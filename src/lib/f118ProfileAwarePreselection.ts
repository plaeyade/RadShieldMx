import { F113_MODALITY_PROFILES } from './f113ModalityProfiles';
import { F117_ACTIVE_PROFILE_KEY } from './f117ModalityHandoff';

export interface F118ProfileAwarePreselectionSummary {
  phase: 'F118';
  status: 'implemented-confirmed';
  profileStorageKey: typeof F117_ACTIVE_PROFILE_KEY;
  targets: string[];
  confirmationPolicy: string;
  controls: string[];
  nextPhase: string;
  decision: string;
}

export function buildF118ProfileAwarePreselectionSummary(): F118ProfileAwarePreselectionSummary {
  return {
    phase: 'F118',
    status: 'implemented-confirmed',
    profileStorageKey: F117_ACTIVE_PROFILE_KEY,
    targets: ['Memoria IA equipment suggestion', 'PDF Report template suggestion', 'Evidence Pack objective suggestion'],
    confirmationPolicy: 'F118 shows profile-aware suggestions but only applies them when the user clicks the explicit apply button.',
    controls: [
      'f118-apply-suggested-equipment',
      'f118-apply-suggested-report-template',
      'f118-apply-evidence-objective',
    ],
    nextPhase: 'F119 should smoke-test Memoria IA, PDF Report and Evidence Pack across DX/TX/NM/CY active profiles.',
    decision: `F118 keeps ${F113_MODALITY_PROFILES.map((profile) => profile.label).join('/')} as guidance profiles and avoids silent regulatory defaults.`,
  };
}
