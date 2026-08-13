/**
 * Loose E.164-style check: a leading "+", then 8-15 digits, first digit
 * non-zero. Deliberately not country-specific (phase2_architecture.md #10:
 * "store the country code rather than assuming the phone number is always
 * Indian") — this accepts any real country code, not just +91.
 */
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

/** Strips common formatting (spaces, dashes, parens) and ensures a leading "+". */
export function normalizePhoneNumber(raw: string): string {
  const stripped = raw.trim().replace(/[\s()-]/g, '');
  return stripped.startsWith('+') ? stripped : `+${stripped}`;
}

export function isValidPhoneNumber(raw: string): boolean {
  return PHONE_PATTERN.test(normalizePhoneNumber(raw));
}
