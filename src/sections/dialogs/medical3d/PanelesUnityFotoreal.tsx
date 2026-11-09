import { useState } from 'react';
import { Download, MonitorCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { UnityWebglExportedBuildContract } from '@/lib/medical3D/unityWebglExportedBuild';
import type { AdvancedPhotorealPackContract } from '@/lib/medical3D/advancedPhotorealPack';
import type { UnityEmbedStatus } from './constantes';

export function UnityWebglExportedBuildPreview({
  contract,
  onOpenExternal,
  onExportHandoff,
}: {
  contract: UnityWebglExportedBuildContract;
  onOpenExternal: () => void;
  onExportHandoff: () => void;
}) {
  const [embedStatus, setEmbedStatus] = useState<UnityEmbedStatus>(contract.viewerUrl ? 'idle' : 'blocked');
  const canEmbed = Boolean(contract.viewerUrl);

  // Al cambiar la URL se reinicia el estado del embebido (ajuste durante el render, sin efecto).
  const [urlPrevia, setUrlPrevia] = useState(contract.viewerUrl);
  if (urlPrevia !== contract.viewerUrl) {
    setUrlPrevia(contract.viewerUrl);
    setEmbedStatus(contract.viewerUrl ? 'idle' : 'blocked');
  }

  return (
    <div className="space-y-2 rounded border border-violet-100 bg-violet-50 p-2" data-testid="f475-f478-unity-webgl-exported-build">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase text-violet-950">F475-F478 Unity WebGL real</div>
          <div className="text-[9px] text-violet-900">Carpeta exportada, iframe/new-tab, handoff JSON y QA live gate.</div>
        </div>
        <Badge variant="outline" className="bg-white text-[9px]" data-testid="f478-unity-live-gate-status">
          {contract.status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-1 text-[9px] text-violet-950">
        <div className="rounded border border-violet-100 bg-white/85 px-1.5 py-1">Fuente {contract.source}</div>
        <div className="rounded border border-violet-100 bg-white/85 px-1.5 py-1">Muros {contract.scenePackage.walls}</div>
        <div className="rounded border border-violet-100 bg-white/85 px-1.5 py-1">Equipos {contract.scenePackage.equipment}</div>
        <div className="rounded border border-violet-100 bg-white/85 px-1.5 py-1">Zonas {contract.scenePackage.zones}</div>
      </div>
      <div className="rounded border border-violet-100 bg-white/85 p-2 text-[9px] leading-relaxed text-violet-950" data-testid="f475-unity-export-folder-requirements">
        <div className="font-semibold">Carpeta requerida: {contract.localFolder}</div>
        <div>{contract.expectedFiles.join(' | ')}</div>
        <div className="mt-1 text-amber-700">Activar con `VITE_MEDICAL_3D_UNITY_LOCAL_BUILD=true` o URL publicada en `VITE_MEDICAL_3D_UNITY_WEBGL_URL`.</div>
      </div>
      <div className="relative h-32 overflow-hidden rounded border border-violet-100 bg-slate-950" data-testid="f476-unity-iframe-shell">
        {canEmbed ? (
          <iframe
            title="Unity WebGL RadShield Medical 3D"
            src={contract.viewerUrl || undefined}
            className="h-full w-full bg-slate-950"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"
            onLoad={() => setEmbedStatus('loaded')}
            data-testid="f476-unity-webgl-iframe"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-[10px] leading-relaxed text-violet-50">
            Copie un build Unity WebGL real o configure URL externa para habilitar el iframe.
          </div>
        )}
        <Badge variant="outline" className="absolute right-2 top-2 bg-white text-[9px]" data-testid="f476-unity-embed-status">
          {embedStatus}
        </Badge>
      </div>
      <div className="rounded border border-violet-100 bg-white/85 p-2 text-[9px] leading-relaxed text-violet-950" data-testid="f477-unity-case-bridge">
        <div className="font-semibold">Bridge de caso</div>
        <div>{contract.bridge.handoffFormat}; eventos {contract.bridge.postMessageEvents.join(', ')}</div>
        <div className="mt-1 text-amber-700">{contract.bridge.visualOnlyBoundary}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" className="h-8 justify-start bg-white text-xs" onClick={onExportHandoff} data-testid="f477-unity-export-handoff">
          <Download className="w-3.5 h-3.5 mr-2" /> Unity case
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 justify-start bg-white text-xs"
          onClick={onOpenExternal}
          disabled={!contract.viewerUrl}
          data-testid="f476-unity-open-viewer"
        >
          <MonitorCog className="w-3.5 h-3.5 mr-2" /> Abrir/preview
        </Button>
      </div>
    </div>
  );
}

export function AdvancedPhotorealPackPanel({
  contract,
  onExport,
}: {
  contract: AdvancedPhotorealPackContract;
  onExport: () => void;
}) {
  return (
    <div className="space-y-2 rounded border border-rose-100 bg-rose-50 p-2" data-testid="f479-f483-advanced-photoreal-pack">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase text-rose-950">F479-F483 fotorealismo avanzado</div>
          <div className="text-[9px] text-rose-900">Texturas, HDRI, decals, presets y QA/export visual.</div>
        </div>
        <Badge variant="outline" className="bg-white text-[9px]">{contract.status}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-1 text-[9px] text-rose-950">
        <div className="rounded border border-rose-100 bg-white/85 px-1.5 py-1">Assets {contract.assetTier}</div>
        <div className="rounded border border-rose-100 bg-white/85 px-1.5 py-1">Materiales {contract.scene.materials}</div>
        <div className="rounded border border-rose-100 bg-white/85 px-1.5 py-1">HDRI {contract.hdri.mode}</div>
        <div className="rounded border border-rose-100 bg-white/85 px-1.5 py-1">Decals {contract.decals.length}</div>
      </div>
      <div className="rounded border border-rose-100 bg-white/85 p-2 text-[9px] leading-relaxed text-rose-950" data-testid="f479-photoreal-texture-plan">
        <div className="font-semibold">Asset root: {contract.assetRoot}</div>
        <div>{contract.textures.map((texture) => `${texture.label}: ${texture.expectedMaps.join('/')}`).join(' | ')}</div>
      </div>
      <div className="rounded border border-rose-100 bg-white/85 p-2 text-[9px] leading-relaxed text-rose-950" data-testid="f480-photoreal-hdri-plan">
        <div className="font-semibold">HDRI esperado</div>
        <div>{contract.hdri.expectedPath}; fallback {contract.hdri.fallback}</div>
      </div>
      <div className="grid grid-cols-2 gap-1 text-[9px]" data-testid="f481-photoreal-decal-plan">
        {contract.decals.slice(0, 4).map((decal) => (
          <div key={decal.id} className="rounded border border-rose-100 bg-white/85 px-1.5 py-1 text-rose-950">
            <span className="font-semibold">{decal.label}</span>
            <div className="text-rose-800">{decal.placement}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1 text-[9px]" data-testid="f482-photoreal-render-presets">
        {contract.renderPresets.map((preset) => (
          <div key={preset.id} className={`rounded border px-1.5 py-1 ${preset.gated ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-rose-100 bg-white/85 text-rose-950'}`}>
            <div className="font-semibold">{preset.label}</div>
            <div>{preset.gated ? 'gated' : 'ready'}</div>
          </div>
        ))}
      </div>
      <div className="text-[9px] leading-relaxed text-amber-700">
        {contract.warnings[0]} {contract.warnings[1]}
      </div>
      <Button size="sm" variant="outline" className="h-8 w-full justify-start bg-white text-xs" onClick={onExport} data-testid="f483-export-photoreal-pack">
        <Download className="w-3.5 h-3.5 mr-2" /> Export F479-F483
      </Button>
    </div>
  );
}
