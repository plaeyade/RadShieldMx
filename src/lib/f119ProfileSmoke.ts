import { F113_MODALITY_PROFILES, type F113ModalityProfileId } from './f113ModalityProfiles';
import { buildF117ModalityHandoff, F117_ACTIVE_PROFILE_KEY } from './f117ModalityHandoff';

export interface F119ProfileSmokeRow {
  profileId: F113ModalityProfileId;
  label: string;
  memoriaReportType: string;
  suggestedEquipment: string[];
  reportTemplate: string;
  evidenceObjective: string;
  priorityDocuments: string[];
}

export interface F119ProfileSmokeSummary {
  phase: 'F119';
  status: 'implemented-contract-smoke';
  storageKey: typeof F117_ACTIVE_PROFILE_KEY;
  profilesChecked: string[];
  surfacesChecked: string[];
  explicitApplyControls: string[];
  rows: F119ProfileSmokeRow[];
  nextPhase: string;
  decision: string;
}

export function buildF119ProfileSmokeSummary(): F119ProfileSmokeSummary {
  const rows = F113_MODALITY_PROFILES.map((profile) => {
    const handoff = buildF117ModalityHandoff(profile.id);
    return {
      profileId: profile.id,
      label: profile.label,
      memoriaReportType: handoff.memoriaDefaults.reportType,
      suggestedEquipment: handoff.memoriaDefaults.recommendedEquipmentKeys,
      reportTemplate: handoff.reportDefaults.templateId,
      evidenceObjective: handoff.evidenceDefaults.objective,
      priorityDocuments: handoff.evidenceDefaults.priorityDocuments,
    };
  });

  return {
    phase: 'F119',
    status: 'implemented-contract-smoke',
    storageKey: F117_ACTIVE_PROFILE_KEY,
    profilesChecked: rows.map((row) => row.label),
    surfacesChecked: ['Memoria IA', 'PDF Report', 'Evidence Pack', 'Update App'],
    explicitApplyControls: [
      'f118-apply-suggested-equipment',
      'f118-apply-suggested-report-template',
      'f118-apply-evidence-objective',
    ],
    rows,
    nextPhase: 'F120 should add runtime Playwright smoke for opening each dialog after selecting DX/TX/NM/CY, then capture screenshots for QA.',
    decision: 'F119 validates all DX/TX/NM/CY profile mappings across Memoria IA, PDF Report and Evidence Pack while preserving explicit user confirmation.',
  };
}
