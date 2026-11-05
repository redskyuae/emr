// Visit List, Billing Counter and Clinician assessment render static sample data,
// so they stay unreachable unless a deployment opts in.
export function demoPagesEnabled() {
  return process.env.ENABLE_DEMO_PAGES === 'true';
}
