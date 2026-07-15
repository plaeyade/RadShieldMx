declare module 'xlsx';

type OrientationLockType =
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

interface ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

interface Math {
  erf(x: number): number;
}

type GPUBufferUsageFlags = number;
type GPUShaderStageFlags = number;
type GPUMapModeFlags = number;

declare const GPUBufferUsage: {
  STORAGE: GPUBufferUsageFlags;
  COPY_DST: GPUBufferUsageFlags;
  COPY_SRC: GPUBufferUsageFlags;
  MAP_READ: GPUBufferUsageFlags;
  UNIFORM: GPUBufferUsageFlags;
};

declare const GPUShaderStage: {
  COMPUTE: GPUShaderStageFlags;
};

declare const GPUMapMode: {
  READ: GPUMapModeFlags;
};

interface GPUAdapterInfo {
  vendor?: string;
}

interface GPUSupportedLimits {
  maxStorageBufferBindingSize?: number;
  maxComputeWorkgroupsPerDimension?: number;
}

interface GPUAdapter {
  info?: GPUAdapterInfo;
  requestDevice(): Promise<GPUDevice>;
}

interface GPU {
  requestAdapter(options?: { powerPreference?: 'low-power' | 'high-performance' }): Promise<GPUAdapter | null>;
}

interface Navigator {
  gpu?: GPU;
}

interface GPUBuffer {
  mapAsync(mode: GPUMapModeFlags): Promise<void>;
  getMappedRange(): ArrayBuffer;
  unmap(): void;
}

interface GPUDevice {
  limits: GPUSupportedLimits;
  queue: {
    writeBuffer(buffer: GPUBuffer, offset: number, data: BufferSource): void;
    submit(commandBuffers: unknown[]): void;
  };
  createBuffer(descriptor: { size: number; usage: GPUBufferUsageFlags }): GPUBuffer;
  createShaderModule(descriptor: { code: string }): unknown;
  createBindGroupLayout(descriptor: unknown): unknown;
  createPipelineLayout(descriptor: { bindGroupLayouts: unknown[] }): unknown;
  createComputePipeline(descriptor: unknown): unknown;
  createBindGroup(descriptor: unknown): unknown;
  createCommandEncoder(): {
    beginComputePass(): {
      setPipeline(pipeline: unknown): void;
      setBindGroup(index: number, bindGroup: unknown): void;
      dispatchWorkgroups(x: number): void;
      end(): void;
    };
    copyBufferToBuffer(source: GPUBuffer, sourceOffset: number, destination: GPUBuffer, destinationOffset: number, size: number): void;
    finish(): unknown;
  };
}
