/**
 * North Design System
 * Notion-inspired minimalism with warm aesthetic colors
 * Light mode, clean, focused
 */

export const Colors = {
  // Core backgrounds
  background: '#FAFAF8',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#F5F5F3',
  surface: '#FFFFFF',
  surfaceHover: '#F8F8F6',

  // Primary accent — sage green
  primary: '#6B8F71',
  primaryLight: '#8AAE8F',
  primaryDark: '#567356',
  primaryMuted: 'rgba(107, 143, 113, 0.12)',

  // Secondary accent — soft coral
  secondary: '#D4856A',
  secondaryLight: '#E09B83',
  secondaryDark: '#B86D52',
  secondaryMuted: 'rgba(212, 133, 106, 0.12)',

  // Tertiary — warm gold
  tertiary: '#C4A265',
  tertiaryLight: '#D4B67E',
  tertiaryDark: '#A8874C',
  tertiaryMuted: 'rgba(196, 162, 101, 0.12)',

  // Accent — soft lavender
  accent: '#9B8EC4',
  accentLight: '#B3A8D4',
  accentDark: '#7D6FAF',
  accentMuted: 'rgba(155, 142, 196, 0.12)',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#9B9B9B',
  textMuted: '#BCBCBC',

  // Functional
  success: '#6B8F71',
  warning: '#C4A265',
  error: '#D4856A',
  info: '#9B8EC4',

  // Borders
  border: 'rgba(0, 0, 0, 0.08)',
  borderLight: 'rgba(0, 0, 0, 0.04)',
  borderActive: 'rgba(107, 143, 113, 0.4)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
};

export const Typography = {
  displayLarge: {
    fontSize: 34,
    fontFamily: 'Inter_700Bold',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  headlineLarge: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 32,
  },
  headlineMedium: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 28,
  },
  headlineSmall: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  labelLarge: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  labelMedium: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 14,
    letterSpacing: 0.4,
  },
};

export const Layout = {
  tabBarHeight: 88,
  contentBottomPadding: 140,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
};
