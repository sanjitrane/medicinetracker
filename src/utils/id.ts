/**
 * Local-only, no-collision-guarantee ID. Good enough for a single-device,
 * local-first store; a real backend will assign its own IDs on sync.
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
