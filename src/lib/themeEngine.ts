// =============================================================================
// themeEngine.ts — Personalized Theme Engine for RadShield-MX
// Customizable colors, fonts, density, accent colors, dark/light presets
// =============================================================================

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
  };
  isDark: boolean;
  fontScale: number;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  density: 'compact' | 'default' | 'comfortable';
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default-light',
    name: 'Default Light',
    description: 'Clean white theme with blue accents',
    isDark: false,
    fontScale: 1,
    borderRadius: 'md',
    density: 'default',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#f1f5f9',
      border: '#e2e8f0',
    },
  },
  {
    id: 'default-dark',
    name: 'Default Dark',
    description: 'Dark theme with blue accents',
    isDark: true,
    fontScale: 1,
    borderRadius: 'md',
    density: 'default',
    colors: {
      primary: '#3b82f6',
      secondary: '#94a3b8',
      accent: '#fbbf24',
      background: '#0f172a',
      foreground: '#f8fafc',
      muted: '#1e293b',
      border: '#334155',
    },
  },
  {
    id: 'medical-blue',
    name: 'Medical Blue',
    description: 'Clinical blue theme for healthcare environments',
    isDark: false,
    fontScale: 1,
    borderRadius: 'md',
    density: 'default',
    colors: {
      primary: '#0369a1',
      secondary: '#475569',
      accent: '#0ea5e9',
      background: '#f0f9ff',
      foreground: '#0c4a6e',
      muted: '#e0f2fe',
      border: '#bae6fd',
    },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum contrast for accessibility (WCAG AAA)',
    isDark: false,
    fontScale: 1.1,
    borderRadius: 'sm',
    density: 'default',
    colors: {
      primary: '#000000',
      secondary: '#333333',
      accent: '#0000ff',
      background: '#ffffff',
      foreground: '#000000',
      muted: '#f0f0f0',
      border: '#000000',
    },
  },
  {
    id: 'forest-dark',
    name: 'Forest Dark',
    description: 'Dark theme with emerald green tones',
    isDark: true,
    fontScale: 1,
    borderRadius: 'lg',
    density: 'default',
    colors: {
      primary: '#10b981',
      secondary: '#6ee7b7',
      accent: '#34d399',
      background: '#064e3b',
      foreground: '#d1fae5',
      muted: '#065f46',
      border: '#059669',
    },
  },
  {
    id: 'amber-dark',
    name: 'Amber Dark',
    description: 'Warm dark theme with amber highlights',
    isDark: true,
    fontScale: 1,
    borderRadius: 'lg',
    density: 'comfortable',
    colors: {
      primary: '#f59e0b',
      secondary: '#d97706',
      accent: '#fbbf24',
      background: '#451a03',
      foreground: '#fef3c7',
      muted: '#78350f',
      border: '#92400e',
    },
  },
  {
    id: 'slate-minimal',
    name: 'Slate Minimal',
    description: 'Minimalist grayscale theme',
    isDark: false,
    fontScale: 1,
    borderRadius: 'none',
    density: 'compact',
    colors: {
      primary: '#475569',
      secondary: '#64748b',
      accent: '#94a3b8',
      background: '#f8fafc',
      foreground: '#1e293b',
      muted: '#f1f5f9',
      border: '#cbd5e1',
    },
  },
  {
    id: 'rose-elegant',
    name: 'Rose Elegant',
    description: 'Soft rose/pink tones for elegant interface',
    isDark: false,
    fontScale: 1,
    borderRadius: 'xl',
    density: 'comfortable',
    colors: {
      primary: '#e11d48',
      secondary: '#fb7185',
      accent: '#f43f5e',
      background: '#fff1f2',
      foreground: '#881337',
      muted: '#ffe4e6',
      border: '#fecdd3',
    },
  },
];

export const ACCENT_COLORS = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Indigo', value: '#6366f1' },
];

const BORDER_RADIUS_MAP: Record<string, string> = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

const DENSITY_MAP: Record<string, { padding: string; gap: string; fontSize: string }> = {
  compact: { padding: '2px 6px', gap: '2px', fontSize: '0.75rem' },
  default: { padding: '6px 12px', gap: '8px', fontSize: '0.875rem' },
  comfortable: { padding: '10px 16px', gap: '12px', fontSize: '1rem' },
};

/** Apply theme to document CSS variables */
export function applyTheme(preset: ThemePreset): void {
  const root = document.documentElement;
  const c = preset.colors;

  root.style.setProperty('--rs-primary', c.primary);
  root.style.setProperty('--rs-secondary', c.secondary);
  root.style.setProperty('--rs-accent', c.accent);
  root.style.setProperty('--rs-bg', c.background);
  root.style.setProperty('--rs-fg', c.foreground);
  root.style.setProperty('--rs-muted', c.muted);
  root.style.setProperty('--rs-border', c.border);
  root.style.setProperty('--rs-radius', BORDER_RADIUS_MAP[preset.borderRadius] || '8px');
  root.style.setProperty('--rs-font-scale', String(preset.fontScale));

  const density = DENSITY_MAP[preset.density] || DENSITY_MAP.default;
  root.style.setProperty('--rs-padding', density.padding);
  root.style.setProperty('--rs-gap', density.gap);
  root.style.setProperty('--rs-font-size', density.fontSize);

  // Dark mode class
  if (preset.isDark) {
    root.classList.add('rs-dark');
  } else {
    root.classList.remove('rs-dark');
  }

  // Store
  localStorage.setItem('radshield_theme_preset', preset.id);
  localStorage.setItem('radshield_theme_custom', JSON.stringify(preset));
}

/** Load saved theme on app start */
export function loadSavedTheme(): ThemePreset | null {
  try {
    const custom = localStorage.getItem('radshield_theme_custom');
    if (custom) return JSON.parse(custom) as ThemePreset;
    const presetId = localStorage.getItem('radshield_theme_preset');
    if (presetId) return THEME_PRESETS.find(p => p.id === presetId) || null;
  } catch { /* ignore */ }
  return null;
}

/** Generate CSS from theme */
export function generateThemeCSS(preset: ThemePreset): string {
  const c = preset.colors;
  return `
    :root {
      --rs-primary: ${c.primary};
      --rs-secondary: ${c.secondary};
      --rs-accent: ${c.accent};
      --rs-bg: ${c.background};
      --rs-fg: ${c.foreground};
      --rs-muted: ${c.muted};
      --rs-border: ${c.border};
      --rs-radius: ${BORDER_RADIUS_MAP[preset.borderRadius] || '8px'};
      --rs-font-scale: ${preset.fontScale};
    }
  `;
}

/** Create custom theme from preset + modifications */
export function createCustomTheme(
  basePresetId: string,
  modifications: Partial<ThemePreset['colors']> & Partial<Pick<ThemePreset, 'fontScale' | 'borderRadius' | 'density'>>,
): ThemePreset {
  const base = THEME_PRESETS.find(p => p.id === basePresetId) || THEME_PRESETS[0];
  return {
    ...base,
    id: 'custom-' + Date.now(),
    name: 'Custom Theme',
    description: 'User-customized theme',
    colors: { ...base.colors, ...modifications },
    fontScale: modifications.fontScale ?? base.fontScale,
    borderRadius: modifications.borderRadius ?? base.borderRadius,
    density: modifications.density ?? base.density,
  };
}
