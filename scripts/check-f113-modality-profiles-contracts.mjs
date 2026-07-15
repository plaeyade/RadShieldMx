import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f113ModalityProfiles.ts',
    tokens: [
      'F113_MODALITY_PROFILES',
      'buildF113ModalityProfileImplementation',
      'radshield:f113:active-modality-profile',
      'F113 converts DX/TX/NM/CY',
    ],
  },
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'F113_PROFILE_KEY',
      'f113-modality-profiles',
      'f113-active-profile-chip',
      'activateF113Profile',
      'Perfil {f113ActiveProfile.label}',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF113ModalityProfileImplementation',
      'f113-modality-profile-implementation',
      'F113 Modality profiles',
      'F113 Perfiles DX/TX/NM/CY',
    ],
  },
  {
    file: 'scripts/f113-modality-profiles.mjs',
    tokens: [
      'f113_modality_profiles.json',
      'fase_113_modality_profiles.md',
      'DX/TX/NM/CY ahora son perfiles activos persistentes',
    ],
  },
  {
    file: 'outputs/f113_modality_profiles.json',
    tokens: [
      '"phase": "F113"',
      '"status": "implemented-additive"',
      '"storageKey": "radshield:f113:active-modality-profile"',
    ],
  },
  {
    file: 'outputs/fase_113_modality_profiles.md',
    tokens: [
      'F113',
      'Perfiles activos DX/TX/NM/CY',
      'F114 deduplicates top bar menus',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f113:modality-profiles',
      'test:f113:modality-profiles',
    ],
  },
];

const missing = [];
for (const check of checks) {
  const text = readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) missing.push(`${check.file}: ${token}`);
  }
}

if (missing.length > 0) {
  console.error('F113 modality profiles contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F113 modality profiles contracts OK');
