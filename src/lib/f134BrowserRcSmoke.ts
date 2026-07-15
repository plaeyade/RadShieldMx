export type F134BrowserRcStatus = 'ready' | 'blocked' | 'partial';

export interface F134BrowserRcSmoke {
  phase: 'F134';
  status: F134BrowserRcStatus;
  browserSurface: string;
  requiredViews: string[];
  updateCenterCards: string[];
  evidenceOutputs: string[];
  nextPhase: string;
  decision: string;
}

export function buildF134BrowserRcSmoke(status: F134BrowserRcStatus = 'blocked'): F134BrowserRcSmoke {
  const ready = status === 'ready';

  return {
    phase: 'F134',
    status,
    browserSurface: 'Playwright Chromium against Vite preview release build',
    requiredViews: [
      'Application shell and canonical top bar',
      'Main floorplan canvas with CAD-like QA panels',
      'Update Center release smoke cards',
      'F131 full-stack live, F132 persistence and F133 API authenticated evidence',
    ],
    updateCenterCards: [
      'f131-fullstack-live-smoke',
      'f132-rc-persistence-smoke',
      'f133-api-authenticated-smoke',
      'f134-browser-rc-smoke',
    ],
    evidenceOutputs: [
      'outputs/f134_release_candidate_browser_smoke.json',
      'outputs/fase_134_release_candidate_browser_smoke.md',
      'outputs/f134_release_candidate_browser_smoke.png',
    ],
    nextPhase: ready ? 'F135 release package, deploy decision and final RC checklist' : 'Resolve browser RC blockers before packaging',
    decision: ready
      ? 'F134 confirms the release-candidate UI opens in a real browser and exposes canvas plus live-stack evidence cards.'
      : 'F134 is blocked until the built app, canvas and Update Center release evidence pass browser smoke.',
  };
}
