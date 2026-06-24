/**
 * Derives a stable, uppercase Role code from a human-entered Role name.
 * Pure helper — no React. Used by the Role form to auto-suggest a code.
 */
export function buildRoleCode(roleName: string) {
  return roleName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
