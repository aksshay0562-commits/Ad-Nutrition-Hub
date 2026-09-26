import { triggerHaptic } from './haptics';

export interface ColorTheme {
  id: string;
  name: string;
  subtitle: string;
  primaryHex: string;
  secondaryHex: string;
  badgeClass: string;
  gradient: string;
  isUnique?: boolean;
}

export interface BgTheme {
  id: string;
  name: string;
  subtitle: string;
  bgClass: string;
  previewBg: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  // Signature & Classic Themes
  {
    id: 'amber',
    name: 'Gold Amber',
    subtitle: 'Signature AD Nutrition gold',
    primaryHex: '#f59e0b',
    secondaryHex: '#fbbf24',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    gradient: 'from-amber-400 to-amber-600',
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    subtitle: 'Bio-herbal & clean vitality',
    primaryHex: '#10b981',
    secondaryHex: '#34d399',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  {
    id: 'crimson',
    name: 'Crimson Red',
    subtitle: 'Hardcore iron & raw intensity',
    primaryHex: '#ef4444',
    secondaryHex: '#f87171',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
    gradient: 'from-red-500 to-rose-600',
  },
  {
    id: 'cyan',
    name: 'Electric Cyan',
    subtitle: 'Ice hydration & laser focus',
    primaryHex: '#06b6d4',
    secondaryHex: '#22d3ee',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    gradient: 'from-cyan-400 to-blue-500',
  },
  {
    id: 'purple',
    name: 'Neon Purple',
    subtitle: 'Hyper fusion & elite stamina',
    primaryHex: '#a855f7',
    secondaryHex: '#c084fc',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    gradient: 'from-purple-400 to-violet-600',
  },
  {
    id: 'orange',
    name: 'Solar Orange',
    subtitle: 'Ignite thermo & fiery drive',
    primaryHex: '#f97316',
    secondaryHex: '#fb923c',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    gradient: 'from-orange-400 to-amber-600',
  },
  {
    id: 'rose',
    name: 'Power Rose',
    subtitle: 'High octane definition & pump',
    primaryHex: '#f43f5e',
    secondaryHex: '#fb7185',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    gradient: 'from-rose-400 to-pink-600',
  },
  {
    id: 'lime',
    name: 'Volt Lime',
    subtitle: 'High voltage athletic energy',
    primaryHex: '#84cc16',
    secondaryHex: '#a3e635',
    badgeClass: 'bg-lime-500/20 text-lime-300 border-lime-500/40',
    gradient: 'from-lime-400 to-emerald-500',
  },
  // Unique & Exotic Signature Editions
  {
    id: 'aurora',
    name: 'Cosmic Aurora',
    subtitle: 'Exotic arctic teal & deep neon glow',
    primaryHex: '#14b8a6',
    secondaryHex: '#5eead4',
    badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    gradient: 'from-teal-400 to-emerald-500',
    isUnique: true,
  },
  {
    id: 'fuchsia',
    name: 'Cyber Hologram',
    subtitle: 'Synthwave hot magenta neon',
    primaryHex: '#d946ef',
    secondaryHex: '#f0abfc',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    gradient: 'from-fuchsia-500 to-pink-600',
    isUnique: true,
  },
  {
    id: 'indigo',
    name: 'Galaxy Indigo',
    subtitle: 'Deep celestial hyper-focus blue',
    primaryHex: '#6366f1',
    secondaryHex: '#a5b4fc',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    gradient: 'from-indigo-500 to-blue-600',
    isUnique: true,
  },
  {
    id: 'magma',
    name: 'Molten Magma',
    subtitle: 'Volcanic heat & incandescent lava',
    primaryHex: '#ff3b00',
    secondaryHex: '#ff7844',
    badgeClass: 'bg-orange-600/20 text-orange-300 border-orange-600/40',
    gradient: 'from-red-600 via-orange-500 to-yellow-500',
    isUnique: true,
  },
  {
    id: 'gold',
    name: '24K Liquid Gold',
    subtitle: 'Pure championship trophy metal',
    primaryHex: '#eab308',
    secondaryHex: '#fef08a',
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    gradient: 'from-yellow-300 via-amber-400 to-yellow-600',
    isUnique: true,
  },
];

export const UNIQUE_QUICK_SWATCHES = [
  { label: 'Cyber Cyan', hex: '#00F0FF' },
  { label: 'Hot Pink', hex: '#FF007F' },
  { label: 'Acid Lime', hex: '#CCFF00' },
  { label: 'Neon Violet', hex: '#8B5CF6' },
  { label: 'Electric Mint', hex: '#00FF9D' },
  { label: 'Molten Flame', hex: '#FF4500' },
  { label: 'Royal Azure', hex: '#3B82F6' },
  { label: 'Pure Platinum', hex: '#E2E8F0' },
];

export const BG_THEMES: BgTheme[] = [
  {
    id: 'midnight',
    name: 'Midnight Carbon',
    subtitle: 'Default deep textured dark mode',
    bgClass: 'bg-neutral-950',
    previewBg: '#09090b',
  },
  {
    id: 'oled',
    name: 'OLED Pure Black',
    subtitle: 'Deep pitch black for maximum contrast & AMOLED power saving',
    bgClass: 'bg-black',
    previewBg: '#000000',
  },
  {
    id: 'slate',
    name: 'Slate Graphite',
    subtitle: 'Moody deep charcoal blue tint',
    bgClass: 'bg-slate-950',
    previewBg: '#0b1120',
  },
];

const STORAGE_KEY_COLOR = 'ad_nutrition_theme_color';
const STORAGE_KEY_BG = 'ad_nutrition_theme_bg';
const STORAGE_KEY_CUSTOM_HEX = 'ad_nutrition_custom_hex';

// Hex to RGB parser
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace(/^#/, '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function mixRgb(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }, weight: number) {
  return {
    r: c1.r * (1 - weight) + c2.r * weight,
    g: c1.g * (1 - weight) + c2.g * weight,
    b: c1.b * (1 - weight) + c2.b * weight,
  };
}

// Generate complete Tailwind 50-950 shade ramp from ANY custom unique hex
export function generateShadeRamp(baseHex: string): Record<string, string> {
  const rgb = hexToRgb(baseHex) || { r: 245, g: 158, b: 11 };
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  return {
    '--color-amber-50': rgbToHex(mixRgb(rgb, white, 0.92).r, mixRgb(rgb, white, 0.92).g, mixRgb(rgb, white, 0.92).b),
    '--color-amber-100': rgbToHex(mixRgb(rgb, white, 0.82).r, mixRgb(rgb, white, 0.82).g, mixRgb(rgb, white, 0.82).b),
    '--color-amber-200': rgbToHex(mixRgb(rgb, white, 0.65).r, mixRgb(rgb, white, 0.65).g, mixRgb(rgb, white, 0.65).b),
    '--color-amber-300': rgbToHex(mixRgb(rgb, white, 0.45).r, mixRgb(rgb, white, 0.45).g, mixRgb(rgb, white, 0.45).b),
    '--color-amber-400': rgbToHex(mixRgb(rgb, white, 0.20).r, mixRgb(rgb, white, 0.20).g, mixRgb(rgb, white, 0.20).b),
    '--color-amber-500': baseHex,
    '--color-amber-600': rgbToHex(mixRgb(rgb, black, 0.18).r, mixRgb(rgb, black, 0.18).g, mixRgb(rgb, black, 0.18).b),
    '--color-amber-700': rgbToHex(mixRgb(rgb, black, 0.35).r, mixRgb(rgb, black, 0.35).g, mixRgb(rgb, black, 0.35).b),
    '--color-amber-800': rgbToHex(mixRgb(rgb, black, 0.52).r, mixRgb(rgb, black, 0.52).g, mixRgb(rgb, black, 0.52).b),
    '--color-amber-900': rgbToHex(mixRgb(rgb, black, 0.70).r, mixRgb(rgb, black, 0.70).g, mixRgb(rgb, black, 0.70).b),
    '--color-amber-950': rgbToHex(mixRgb(rgb, black, 0.85).r, mixRgb(rgb, black, 0.85).g, mixRgb(rgb, black, 0.85).b),
  };
}

export const getSavedColorTheme = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_COLOR);
    if (saved === 'custom') return 'custom';
    if (saved && COLOR_THEMES.some((t) => t.id === saved)) {
      return saved;
    }
  }
  return 'amber';
};

export const getSavedCustomHex = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_HEX);
    if (saved && /^#[0-9A-Fa-f]{6}$/.test(saved)) {
      return saved;
    }
  }
  return '#00F0FF'; // default unique cyber cyan
};

export const getSavedBgTheme = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_BG);
    if (saved && BG_THEMES.some((b) => b.id === saved)) {
      return saved;
    }
  }
  return 'midnight';
};

const AMBER_PROPS = [
  '--color-amber-50',
  '--color-amber-100',
  '--color-amber-200',
  '--color-amber-300',
  '--color-amber-400',
  '--color-amber-500',
  '--color-amber-600',
  '--color-amber-700',
  '--color-amber-800',
  '--color-amber-900',
  '--color-amber-950',
];

export const applyColorTheme = (themeId: string): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Clear any inline custom color properties
  AMBER_PROPS.forEach((p) => root.style.removeProperty(p));
  root.setAttribute('data-color-theme', themeId);

  try {
    localStorage.setItem(STORAGE_KEY_COLOR, themeId);
  } catch (e) {
    console.error('Failed to save color theme to localStorage', e);
  }
};

export const applyCustomUniqueColor = (hex: string): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Generate dynamic shade ramp and inject into inline styles for immediate high-priority override
  const shades = generateShadeRamp(hex);
  Object.entries(shades).forEach(([prop, val]) => {
    root.style.setProperty(prop, val);
  });

  root.setAttribute('data-color-theme', 'custom');

  try {
    localStorage.setItem(STORAGE_KEY_COLOR, 'custom');
    localStorage.setItem(STORAGE_KEY_CUSTOM_HEX, hex);
  } catch (e) {
    console.error('Failed to save custom color to localStorage', e);
  }
};

export const applyBgTheme = (bgId: string): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-bg-theme', bgId);
  try {
    localStorage.setItem(STORAGE_KEY_BG, bgId);
  } catch (e) {
    console.error('Failed to save bg theme to localStorage', e);
  }
};

export const initAppThemes = (): { color: string; bg: string; customHex: string } => {
  const color = getSavedColorTheme();
  const bg = getSavedBgTheme();
  const customHex = getSavedCustomHex();

  if (color === 'custom') {
    applyCustomUniqueColor(customHex);
  } else {
    applyColorTheme(color);
  }

  applyBgTheme(bg);
  return { color, bg, customHex };
};
