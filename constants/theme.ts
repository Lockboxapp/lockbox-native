/**
 * LockBox design tokens — colors, spacing, radius, typography, shadows.
 *
 * Consume through the `useTheme()` hook (hooks/use-theme.ts) instead of
 * importing palette colors directly into screens.
 *
 * Typography variants reference the DM Serif Display + DM Sans fonts loaded
 * in `app/_layout.tsx`. The `fontWeight` values are kept so the text falls
 * back to a reasonable system weight if the font fails to load.
 */

import type { TextStyle } from 'react-native';

const palette = {
  // Brand
  forest: '#1a6b3a',
  forestDeep: '#15572f',
  forestSoft: '#2d8a52',
  forestTintLight: '#e6efe9',
  forestTintDark: '#152a1f',

  // Light surfaces
  cream: '#f7f3eb',
  creamSurface: '#fffdf8',
  creamSubtle: '#efeadd',
  ink: '#172119',
  inkMuted: '#687469',
  inkBorder: '#ddd5c7',

  // Dark surfaces
  charcoal: '#0d0f0e',
  charcoalSurface: '#151917',
  charcoalSubtle: '#1c2220',
  smoke: '#eef2ee',
  smokeMuted: '#9aa69d',
  smokeBorder: '#29302b',

  // Status
  amber: '#c47a18',
  amberSoft: '#fbe7c5',
  amberDeepBg: '#2a1f0d',
  rose: '#b14444',
  roseSoft: '#f8d5d5',
  roseDeepBg: '#2a1313',
  blue: '#2d6cdf',
  blueSoft: '#dbe7fb',
  blueDeepBg: '#0f1a2e',

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

export const fontFamily = {
  serif: 'DMSerifDisplay_400Regular',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
} as const;

export const typography = {
  display: {
    fontFamily: fontFamily.serif,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  h1: {
    fontFamily: fontFamily.serif,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  h2: {
    fontFamily: fontFamily.sansBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  title: {
    fontFamily: fontFamily.sansBold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodyStrong: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  eyebrow: {
    fontFamily: fontFamily.sansBold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  caption: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  stat: {
    fontFamily: fontFamily.sansBold,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
} satisfies Record<string, TextStyle>;

type ShadowStyle = {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
};

const buildShadow = (
  color: string,
  opacity: number,
  radiusValue: number,
  offsetY: number,
  elevation: number,
): ShadowStyle => ({
  shadowColor: color,
  shadowOpacity: opacity,
  shadowRadius: radiusValue,
  shadowOffset: { width: 0, height: offsetY },
  elevation,
});

type ThemeColors = {
  background: string;
  surface: string;
  surfaceSubtle: string;
  surfaceAccent: string;
  surfaceWarning: string;
  border: string;
  borderStrong: string;
  borderWarning: string;
  divider: string;
  text: string;
  textMuted: string;
  textInverse: string;
  accent: string;
  accentDeep: string;
  accentSoft: string;
  onAccent: string;
  tabBackground: string;
  tabBorder: string;
  tabActive: string;
  tabInactive: string;
  badge: {
    flexibleBg: string;
    flexibleText: string;
    lockedBg: string;
    lockedText: string;
    keyholderBg: string;
    keyholderText: string;
    neutralBg: string;
    neutralText: string;
    warningBg: string;
    warningText: string;
    dangerBg: string;
    dangerText: string;
    successBg: string;
    successText: string;
  };
  shadow: ShadowStyle;
};

export type ThemeMode = 'light' | 'dark';

export type Theme = {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
  palette: typeof palette;
};

export const lightTheme: Theme = {
  mode: 'light',
  spacing,
  radius,
  typography,
  fontFamily,
  palette,
  colors: {
    background: palette.cream,
    surface: palette.creamSurface,
    surfaceSubtle: palette.creamSubtle,
    surfaceAccent: palette.forestTintLight,
    surfaceWarning: '#fff8e7',
    border: palette.inkBorder,
    borderStrong: '#c8bfac',
    borderWarning: '#f0c040',
    divider: '#ece4d2',
    text: palette.ink,
    textMuted: palette.inkMuted,
    textInverse: palette.creamSurface,
    accent: palette.forest,
    accentDeep: palette.forestDeep,
    accentSoft: palette.forestTintLight,
    onAccent: palette.white,
    tabBackground: palette.creamSurface,
    tabBorder: palette.inkBorder,
    tabActive: palette.forest,
    tabInactive: palette.inkMuted,
    badge: {
      flexibleBg: palette.blueSoft,
      flexibleText: palette.blue,
      lockedBg: palette.forestTintLight,
      lockedText: palette.forestDeep,
      keyholderBg: palette.amberSoft,
      keyholderText: palette.amber,
      neutralBg: palette.creamSubtle,
      neutralText: palette.inkMuted,
      warningBg: palette.amberSoft,
      warningText: palette.amber,
      dangerBg: palette.roseSoft,
      dangerText: palette.rose,
      successBg: palette.forestTintLight,
      successText: palette.forestDeep,
    },
    shadow: buildShadow('#1a1a1a', 0.06, 14, 4, 2),
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  spacing,
  radius,
  typography,
  fontFamily,
  palette,
  colors: {
    background: palette.charcoal,
    surface: palette.charcoalSurface,
    surfaceSubtle: palette.charcoalSubtle,
    surfaceAccent: palette.forestTintDark,
    surfaceWarning: '#2a2010',
    border: palette.smokeBorder,
    borderStrong: '#3a4239',
    borderWarning: '#5a4218',
    divider: '#222825',
    text: palette.smoke,
    textMuted: palette.smokeMuted,
    textInverse: palette.charcoal,
    accent: palette.forestSoft,
    accentDeep: palette.forest,
    accentSoft: palette.forestTintDark,
    onAccent: palette.white,
    tabBackground: palette.charcoalSurface,
    tabBorder: palette.smokeBorder,
    tabActive: palette.forestSoft,
    tabInactive: palette.smokeMuted,
    badge: {
      flexibleBg: palette.blueDeepBg,
      flexibleText: '#8db4f5',
      lockedBg: palette.forestTintDark,
      lockedText: '#7fc59a',
      keyholderBg: palette.amberDeepBg,
      keyholderText: '#e4b265',
      neutralBg: palette.charcoalSubtle,
      neutralText: palette.smokeMuted,
      warningBg: palette.amberDeepBg,
      warningText: '#e4b265',
      dangerBg: palette.roseDeepBg,
      dangerText: '#e89a9a',
      successBg: palette.forestTintDark,
      successText: '#7fc59a',
    },
    shadow: buildShadow('#000000', 0.4, 18, 6, 6),
  },
};

export const themes = { light: lightTheme, dark: darkTheme } as const;
