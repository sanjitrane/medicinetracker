/**
 * Design tokens for the app.
 *
 * Everything visual should reference these rather than hard-coded values so the
 * look stays consistent and a dark theme can be layered on later.
 *
 * Palette: a dusty blue as the brand color (calm, health-associated) with a
 * dark navy accent reserved for a handful of special moments (the scan/AI
 * action, standout badges) so it still reads as an accent rather than a
 * second primary color. Status colors stay on the warm spectrum
 * (green/amber/orange/red) precisely so they never get confused with brand
 * color — nothing decorative borrows those hues.
 */

export const colors = {
  // Surfaces — a faint blue tint instead of neutral gray, so even empty
  // space carries a little of the brand color.
  background: '#F1F7FA',
  surface: '#FFFFFF',
  surfaceMuted: '#E6F1F5',

  // Brand
  primary: '#78AAC3',
  primaryDark: '#4E7E98',
  primaryMuted: '#DCEBF1',
  accent: '#393B63',
  accentMuted: '#E4E4ED',

  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Lines
  border: '#D3E3EA',

  // Medicine status. Kept in one place so the dashboard, details screen and
  // badges can never disagree about what "finishing soon" looks like.
  statusActive: '#16A34A',
  statusActiveBg: '#DCFCE7',
  statusFinishingSoon: '#D97706',
  statusFinishingSoonBg: '#FEF3C7',
  statusFinished: '#64748B',
  statusFinishedBg: '#F1F5F9',
  statusExpiringSoon: '#EA580C',
  statusExpiringSoonBg: '#FFEDD5',
  statusExpired: '#DC2626',
  statusExpiredBg: '#FEE2E2',

  // Feedback
  danger: '#DC2626',
  warning: '#D97706',
  success: '#16A34A',
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
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

/**
 * Elevation presets. `card` is a soft lift for surfaces sitting on the
 * screen background; `raised` is a touch stronger, for things that should
 * read as the most prominent element on screen (e.g. a hero banner).
 */
export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
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

export const theme = { colors, spacing, radius, shadow, typography } as const;
