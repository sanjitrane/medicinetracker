import { isValidPhoneNumber, normalizePhoneNumber } from '../phoneNumber';

describe('normalizePhoneNumber', () => {
  it('leaves an already-normalized number untouched', () => {
    expect(normalizePhoneNumber('+919876543210')).toBe('+919876543210');
  });

  it('adds a leading + when missing', () => {
    expect(normalizePhoneNumber('919876543210')).toBe('+919876543210');
  });

  it('strips spaces, dashes and parentheses', () => {
    expect(normalizePhoneNumber('+91 98765 43210')).toBe('+919876543210');
    expect(normalizePhoneNumber('+1 (555) 123-4567')).toBe('+15551234567');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizePhoneNumber('  +919876543210  ')).toBe('+919876543210');
  });
});

describe('isValidPhoneNumber', () => {
  it('accepts a valid Indian number', () => {
    expect(isValidPhoneNumber('+919876543210')).toBe(true);
  });

  it('accepts a valid US number', () => {
    expect(isValidPhoneNumber('+15551234567')).toBe(true);
  });

  it('accepts a number missing its leading + (normalized first)', () => {
    expect(isValidPhoneNumber('919876543210')).toBe(true);
  });

  it('accepts a formatted number with spaces/dashes', () => {
    expect(isValidPhoneNumber('+91 98765 43210')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidPhoneNumber('')).toBe(false);
  });

  it('rejects a too-short number', () => {
    expect(isValidPhoneNumber('+123')).toBe(false);
  });

  it('rejects letters', () => {
    expect(isValidPhoneNumber('+91abcdefghij')).toBe(false);
  });

  it('rejects a leading zero after the country code marker', () => {
    expect(isValidPhoneNumber('+0123456789')).toBe(false);
  });
});
