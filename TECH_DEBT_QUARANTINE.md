# RadShield-MX TypeScript Quarantine Register

Date: 2026-07-05

This file tracks every `// @ts-nocheck` introduced during recovery stabilization. The marker is temporary: each entry must either be fixed, removed from the product build, or explicitly reclassified as an unsupported prototype.

## Exit Criteria

A file leaves quarantine when:

- `// @ts-nocheck` is removed.
- `tsc -p tsconfig.app.json --pretty false` passes.
- The module has a small smoke test, fixture, or documented manual verification path when it affects calculations, exports, imports, or regulatory reports.
- If the module is not product-bound, it is moved to an experimental folder or excluded from production menus.

## Priority Groups

### P0 - Main UX and Navigation

These files are user-facing and close to the main workflow. Fix first.

| File | Reason | Exit path |
| --- | --- | --- |

### P1 - Clinical and Calculation Adjacent

These may affect reports or shielding workflows. Fix before claiming regulatory readiness.

| File | Reason | Exit path |
| --- | --- | --- |

### P2 - Import/Export and Integrations

Important for advanced users, but not required for the current stable deploy.

| File | Reason | Exit path |
| --- | --- | --- |

### P3 - Experimental Engines and Prototypes

These are valuable research paths, but should not block the product shell.

| File | Reason | Exit path |
| --- | --- | --- |

## Current Validation Baseline

As of 2026-07-05:

- `tsc -p tsconfig.app.json --pretty false`: passing.
- `tsc -p tsconfig.stable.json --pretty false`: passing.
- `tsc -p tsconfig.server.json --pretty false`: passing.
- `vite build`: passing.
- Local static deploy `/`: HTTP 200.

## Notes

Do not add new `// @ts-nocheck` entries without adding them to this register. Prefer fixing small typing issues directly when the module is part of the main workflow.

## Recovery Log

- 2026-07-05: Removed quarantine from `src/sections/ContextualHelpPanel.tsx`, `src/sections/dialogs/KeyboardShortcutsDialog.tsx`, and `src/sections/dialogs/CommandPalette.tsx`. Remaining quarantine: 29 files.
- 2026-07-05: Removed quarantine from `src/sections/dialogs/BatemanDecayDialog.tsx`. Remaining quarantine: 28 files.
- 2026-07-05: Removed quarantine from `src/sections/dialogs/IndustrialRadiationDialog.tsx`. Remaining quarantine: 27 files.
- 2026-07-05: Removed quarantine from `src/sections/dialogs/DXFViewerDialog.tsx`, `src/sections/dialogs/CADToMCImport.tsx`, and `src/sections/dialogs/LeadFreeMaterialsDialog.tsx`. Remaining quarantine: 24 files.
- 2026-07-05: Removed quarantine from `src/sections/dialogs/ExternalConnectorDialog.tsx`, `src/sections/dialogs/AutoFillEquipmentDialog.tsx`, `src/sections/dialogs/ExperimentalValidationDialog.tsx`, and `src/sections/dialogs/GeometrySelectorDialog.tsx`. Remaining quarantine: 20 files.
- 2026-07-05: Removed quarantine from `src/sections/dialogs/BarrierEditor.tsx`, `src/sections/dialogs/DashboardCalcDialog.tsx`, `src/sections/dialogs/DICOMDialog.tsx`, `src/sections/dialogs/DoseMapDialog.tsx`, and `src/sections/dialogs/ExposureRateProjectionDialog.tsx`. Remaining quarantine: 15 files.
- 2026-07-05: Removed quarantine from `src/sections/dialogs/DICOMRTIntegrationDialog.tsx`, `src/sections/dialogs/CADGeometryConverterDialog.tsx`, and `src/sections/dialogs/EmailNotificationsDialog.tsx`. Remaining quarantine: 12 files.
- 2026-07-05: Removed quarantine from `src/sections/RAGIngestionPanel.tsx` and `src/sections/dialogs/RevitIfcImportDialog.tsx`. Remaining quarantine: 10 files.
- 2026-07-05: Removed quarantine from `src/lib/uaqProtocol.ts`. Remaining quarantine: 9 files.
- 2026-07-05: Removed quarantine from `src/hooks/useWebScraper.ts`. Remaining quarantine: 8 files.
- 2026-07-05: Removed quarantine from `src/hooks/useWebGPU.ts` and `src/hooks/useWebGPUHeatmap.ts`. Remaining quarantine: 6 files.
- 2026-07-05: Removed quarantine from `src/sections/Toolbar.tsx`. Remaining quarantine: 5 files.
- 2026-07-05: Replaced unused legacy `src/sections/DialogManager.tsx` with a typed compatibility shim. Remaining quarantine: 4 files.
- 2026-07-05: Removed quarantine from `src/sections/dialogs/DoseMapping3D.tsx`. Remaining quarantine: 3 files.
- 2026-07-05: Removed quarantine from `src/lib/bimRAD.ts` by normalizing BIM vector positions to `Vec3`. Remaining quarantine: 2 files.
- 2026-07-05: Removed quarantine from `src/lib/nativeMCEngine.ts` and `src/lib/stepImporter.ts` by splitting prepared MC source typing and exporting the overlap contract. Remaining quarantine: 0 files.
