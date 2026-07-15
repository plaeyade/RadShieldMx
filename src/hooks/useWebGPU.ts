/**
 * useWebGPU — WebGPU Compute Shaders for Monte Carlo acceleration
 * Acelera: heatmap generation, dose grid calculation, gamma index 2D
 * Chrome 113+ | Edge 113+ | Firefox Nightly (behind flag)
 * Fallback: CPU-based calculation (existing logic)
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface WebGPUCapabilities {
  available: boolean;
  adapter: string;
  deviceLimit: number;
  maxComputeWorkgroups: number;
}

// WGSL shader for heatmap dose calculation (parallel point evaluation)
const HEATMAP_SHADER = `
@group(0) @binding(0) var<storage, read> sources: array<f32>;     // [x1,y1,activity1, x2,y2,activity2, ...]
@group(0) @binding(1) var<storage, read> grid: array<f32>;         // [x1,y1, x2,y2, ...]
@group(0) @binding(2) var<storage, read_write> doses: array<f32>; // output

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let idx = gid.x;
  if (idx >= arrayLength(&doses)) { return; }

  let gx = grid[idx * 2];
  let gy = grid[idx * 2 + 1];
  let nSources = arrayLength(&sources) / 3u;
  var dose: f32 = 0.0;

  for (var i: u32 = 0u; i < nSources; i = i + 1u) {
    let sx = sources[i * 3];
    let sy = sources[i * 3 + 1];
    let act = sources[i * 3 + 2];
    let dx = gx - sx;
    let dy = gy - sy;
    let distSq = dx * dx + dy * dy;
    if (distSq > 0.01) {
      dose = dose + act / distSq;
    }
  }
  doses[idx] = dose;
}`;

// WGSL shader for gamma index 2D grid
const GAMMA_SHADER = `
@group(0) @binding(0) var<storage, read> refDose: array<f32>;
@group(0) @binding(1) var<storage, read> evalDose: array<f32>;
@group(0) @binding(2) var<storage, read_write> gamma: array<f32>;
@group(0) @binding(3) var<uniform> params: vec4<f32>; // nx, dta, ddPct, maxDose

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let idx = gid.x;
  let nx = u32(params.x);
  if (idx >= arrayLength(&gamma)) { return; }
  
  let ref = refDose[idx];
  if (ref < 0.1) { gamma[idx] = 0.0; return; }
  
  let ev = evalDose[idx];
  let doseDiff = abs(ev - ref) / (params.z * 0.01 * params.w);
  gamma[idx] = doseDiff; // Simplified: DTA=0 for same point
}`;

export function useWebGPU() {
  const [caps, setCaps] = useState<WebGPUCapabilities | null>(null);
  const [device, setDevice] = useState<GPUDevice | null>(null);
  const [initialized, setInitialized] = useState(false);

  /**
   * Initialize WebGPU device
   */
  const init = useCallback(async (): Promise<boolean> => {
    if (initialized && device) return true;

    try {
      if (!navigator.gpu) {
        toast.info('WebGPU no disponible — usando CPU');
        return false;
      }
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
      });
      if (!adapter) {
        toast.info('No se encontró adaptador GPU — usando CPU');
        return false;
      }
      const dev = await adapter.requestDevice();
      setDevice(dev);
      setCaps({
        available: true,
        adapter: adapter.info?.vendor || 'Unknown',
        deviceLimit: dev.limits.maxStorageBufferBindingSize || 134217728,
        maxComputeWorkgroups: dev.limits.maxComputeWorkgroupsPerDimension || 65535,
      });
      setInitialized(true);
      toast.success(`WebGPU activado: ${adapter.info?.vendor || 'GPU'}`);
      return true;
    } catch (err) {
      toast.info('WebGPU no disponible — cálculos en CPU');
      return false;
    }
  }, [initialized, device]);

  /**
   * Compute heatmap dose on GPU — parallel evaluation of all grid points
   * Returns doses array or null if GPU unavailable (caller should use CPU fallback)
   */
  const computeHeatmapGPU = useCallback(async (
    sources: Array<{ x: number; y: number; activity: number }>,
    gridPoints: Array<{ x: number; y: number }>
  ): Promise<Float32Array | null> => {
    if (!device) return null;

    try {
      // Flatten arrays
      const srcData = new Float32Array(sources.flatMap(s => [s.x, s.y, s.activity]));
      const gridData = new Float32Array(gridPoints.flatMap(g => [g.x, g.y]));
      const doseData = new Float32Array(gridPoints.length);

      // Create buffers
      const srcBuf = device.createBuffer({
        size: srcData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      const gridBuf = device.createBuffer({
        size: gridData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      const doseBuf = device.createBuffer({
        size: doseData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      });
      const readBuf = device.createBuffer({
        size: doseData.byteLength, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });

      // Upload data
      device.queue.writeBuffer(srcBuf, 0, srcData.buffer as ArrayBuffer, srcData.byteOffset, srcData.byteLength);
      device.queue.writeBuffer(gridBuf, 0, gridData.buffer as ArrayBuffer, gridData.byteOffset, gridData.byteLength);

      // Create shader module
      const shaderModule = device.createShaderModule({ code: HEATMAP_SHADER });

      // Create bind group layout
      const bindGroupLayout = device.createBindGroupLayout({
        entries: [
          { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
          { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
          { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        ],
      });

      const pipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
        compute: { module: shaderModule, entryPoint: 'main' },
      });

      const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: srcBuf } },
          { binding: 1, resource: { buffer: gridBuf } },
          { binding: 2, resource: { buffer: doseBuf } },
        ],
      });

      // Dispatch
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginComputePass();
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.dispatchWorkgroups(Math.ceil(gridPoints.length / 64));
      pass.end();
      encoder.copyBufferToBuffer(doseBuf, 0, readBuf, 0, doseData.byteLength);
      device.queue.submit([encoder.finish() as GPUCommandBuffer]);

      // Read back
      await readBuf.mapAsync(GPUMapMode.READ);
      const result = new Float32Array(readBuf.getMappedRange());
      const doses = new Float32Array(result);
      readBuf.unmap();

      return doses;
    } catch (err) {
      console.warn('WebGPU heatmap error:', err);
      return null;
    }
  }, [device]);

  /**
   * Compute gamma index on GPU
   */
  const computeGammaGPU = useCallback(async (
    refDose: Float32Array,
    evalDose: Float32Array,
    nx: number,
    dta: number,
    ddPct: number,
    maxDose: number
  ): Promise<Float32Array | null> => {
    if (!device) return null;
    try {
      const gammaData = new Float32Array(refDose.length);
      const params = new Float32Array([nx, dta, ddPct, maxDose]);

      const refBuf = device.createBuffer({
        size: refDose.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      const evalBuf = device.createBuffer({
        size: evalDose.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      const gammaBuf = device.createBuffer({
        size: gammaData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      });
      const paramsBuf = device.createBuffer({
        size: params.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      const readBuf = device.createBuffer({
        size: gammaData.byteLength, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });

      device.queue.writeBuffer(refBuf, 0, refDose.buffer as ArrayBuffer, refDose.byteOffset, refDose.byteLength);
      device.queue.writeBuffer(evalBuf, 0, evalDose.buffer as ArrayBuffer, evalDose.byteOffset, evalDose.byteLength);
      device.queue.writeBuffer(paramsBuf, 0, params.buffer as ArrayBuffer, params.byteOffset, params.byteLength);

      const shaderModule = device.createShaderModule({ code: GAMMA_SHADER });
      const bindGroupLayout = device.createBindGroupLayout({
        entries: [
          { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
          { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
          { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
          { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
        ],
      });

      const pipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
        compute: { module: shaderModule, entryPoint: 'main' },
      });

      const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: refBuf } },
          { binding: 1, resource: { buffer: evalBuf } },
          { binding: 2, resource: { buffer: gammaBuf } },
          { binding: 3, resource: { buffer: paramsBuf } },
        ],
      });

      const encoder = device.createCommandEncoder();
      const pass = encoder.beginComputePass();
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.dispatchWorkgroups(Math.ceil(refDose.length / 64));
      pass.end();
      encoder.copyBufferToBuffer(gammaBuf, 0, readBuf, 0, gammaData.byteLength);
      device.queue.submit([encoder.finish() as GPUCommandBuffer]);

      await readBuf.mapAsync(GPUMapMode.READ);
      const result = new Float32Array(readBuf.getMappedRange());
      const gamma = new Float32Array(result);
      readBuf.unmap();
      return gamma;
    } catch (err) {
      console.warn('WebGPU gamma error:', err);
      return null;
    }
  }, [device]);

  return {
    caps,
    device,
    available: caps?.available || false,
    initialized,
    init,
    computeHeatmapGPU,
    computeGammaGPU,
  };
}
