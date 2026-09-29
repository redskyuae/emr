// Build-time UI feature flags. `NEXT_PUBLIC_*` values are inlined by Next.js at build time, so each
// variable must be referenced by its literal name here — never build `process.env` keys dynamically.
// Flags only show or hide UI; they are not a substitute for backend authorization checks.
const FLAGS = {
  hideAuthBrandPanel: process.env.NEXT_PUBLIC_HIDE_AUTH_BRAND_PANEL,
} as const;

// Unset or empty means off, so the current UI stays the default.
export function isFeatureFlagOn(flag: keyof typeof FLAGS): boolean {
  const value = (FLAGS[flag] ?? '').trim().toLowerCase();
  return value === 'true' || value === '1';
}
