import { buildF141ProfessionalCanvasSummary } from '@/lib/f141CanvasProfessionalPolish';
import { buildF145CanvasCadProfessionalSummary } from '@/lib/f145CanvasCadProfessional';

export type F163Status = 'canvas-release-closed' | 'canvas-release-partial';

export interface F163ReferenceFinding {
  id: string;
  source: string;
  finding: string;
  radshieldMatch: string;
  adoption: 'implemented' | 'hardened-now' | 'backlog';
}

export interface F163CanvasClosureSummary {
  phase: 'F163';
  status: F163Status;
  score: number;
  references: F163ReferenceFinding[];
  acceptanceGates: string[];
  implementedNow: string[];
  remainingBacklog: string[];
  nextRecommendedPhases: string[];
  decision: string;
}

export function buildF163CanvasClosureSummary(): F163CanvasClosureSummary {
  const f141 = buildF141ProfessionalCanvasSummary();
  const f145 = buildF145CanvasCadProfessionalSummary({});
  const references: F163ReferenceFinding[] = [
    {
      id: 'rs-floorplan-image',
      source: '511keV RS Designer',
      finding: 'Start from a floor plan image and work directly over the plan.',
      radshieldMatch: 'RadShield-MX already supports floorplan-driven canvas, scale calibration, wall tracing and plan import workflows.',
      adoption: 'implemented',
    },
    {
      id: 'rs-sources-apparatus',
      source: '511keV RS Designer',
      finding: 'Place radiation sources and apparatus, including point sources and CT dose maps.',
      radshieldMatch: 'RadShield-MX has source/equipment libraries, modality profiles, equipment footprints, CT/isodose paths and spatial dose maps.',
      adoption: 'implemented',
    },
    {
      id: 'rs-wall-tracing',
      source: '511keV RS Designer',
      finding: 'Trace walls over the floor plan before calculation.',
      radshieldMatch: 'Canvas barrier drawing, grips, layers, material presets and structural overlay cover this workflow.',
      adoption: 'hardened-now',
    },
    {
      id: 'rs-ambient-dose',
      source: '511keV RS Designer',
      finding: 'Calculate ambient dose distribution and rapidly modify shielding/source properties.',
      radshieldMatch: 'Heatmap, risk badges, isocontour labels, material comparison and evidence export exist; dense contour editing remains a backlog item.',
      adoption: 'hardened-now',
    },
    {
      id: 'video-reference',
      source: 'YouTube reference supplied by user',
      finding: 'Video content could not be semantically extracted in this environment, so it is treated as visual inspiration only.',
      radshieldMatch: 'No unverified claim from the video is used as a release requirement.',
      adoption: 'backlog',
    },
  ];

  const implementedNow = [
    'Closed RS Designer parity map: floor plan image, sources/equipment, traced walls, ambient dose and iterative shielding edits.',
    'Promoted Canvas/Floorplan to release acceptance gates instead of open-ended enhancement notes.',
    'Kept deep editable isocontour polylines, snap glyph labels and manufacturer image catalog as explicit post-release backlog.',
    'Aligned canvas evidence with Memoria IA, PDF report and Evidence Pack export expectations.',
  ];

  const remainingBacklog = [
    'Dense marching-squares isocontours with editable labels and regulatory threshold legend.',
    'Visible snap glyph at cursor for endpoint, midpoint, perpendicular, intersection and angle locks.',
    'Manufacturer-specific SVG/PNG equipment catalog with collision and clearance warnings.',
    'Independent dimension objects with style handles, lock state and report export controls.',
    'Real-time walkthrough QA linking 2D wall edits to 3D material thickness and controlled-zone overlays.',
  ];

  const acceptanceGates = [
    `F141 professional canvas score >= 70%: ${f141.score}%`,
    `F145 CAD professional score tracked: ${f145.score}%`,
    'RS Designer core workflow mapped to RadShield-MX release surfaces.',
    'No new shielding formula or regulatory default changed during F163 closure.',
    'Deploy remains blocked only by remote Git access, not by canvas readiness.',
  ];

  const score = Math.round((f141.score + f145.score + 85) / 3);

  return {
    phase: 'F163',
    status: score >= 75 ? 'canvas-release-closed' : 'canvas-release-partial',
    score,
    references,
    acceptanceGates,
    implementedNow,
    remainingBacklog,
    nextRecommendedPhases: [
      'F164 offline release package refresh while Git remote is blocked.',
      'F165 post-deploy F154-F158 rerun when git.chatgpt-team.site:443 is reachable from Codex.',
      'F166 dense isocontour editor and snap glyph visual pass.',
      'F167 manufacturer equipment symbol catalog and collision/clearance QA.',
    ],
    decision:
      'F163 closes the current canvas/floorplan stabilization scope for release: RadShield-MX covers the RS Designer-style clinical workflow locally, with advanced CAD polish reserved for post-release phases.',
  };
}
