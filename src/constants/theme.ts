/**
 * Design tokens for the app.
 *
 * Everything visual should reference these rather than hard-coded values so the
 * look stays consistent and a dark theme can be layered on later.
 */

export const colors = {
  // Surfaces
  background: '#F7FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF2F7',

  // Brand
  primary: '#2B6CB0',
  primaryDark: '#2C5282',
  primaryMuted: '#EBF4FF',

  // Text
  text: '#1A202C',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  textInverse: '#FFFFFF',

  // Lines
  border: '#E2E8F0',

  // Medicine status. Kept in one place so the dashboard, details screen and
  // badges can never disagree about what "finishing soon" looks like.
  statusActive: '#38A169',
  statusActiveBg: '#F0FFF4',
  statusFinishingSoon: '#D69E2E',
  statusFinishingSoonBg: '#FFFFF0',
  statusFinished: '#718096',
  statusFinishedBg: '#F7FAFC',
  statusExpiringSoon: '#DD6B20',
  statusExpiringSoonBg: '#FFFAF0',
  statusExpired: '#E53E3E',
  statusExpiredBg: '#FFF5F5',

  // Feedback
  danger: '#E53E3E',
  warning: '#D69E2E',
  success: '#38A169',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

/**
 * Minimum tap target. The app is used by non-technical and older users, so we
 * hold to the 44pt floor from Apple's HIG rather than shrinking controls.
 */
export const MIN_TOUCH_TARGET = 44;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  heading: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  subheading: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 18 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
} as const;

export const theme = { colors, spacing, radius, typography } as const;
