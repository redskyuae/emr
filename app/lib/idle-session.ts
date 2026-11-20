// Shared inactivity state for the authenticated app shell. Only timestamps and
// a sign-out reason are written to localStorage — never tokens or Session data.

export const LAST_ACTIVITY_KEY = 'emr-last-activity';
const SIGN_OUT_KEY = 'emr-sign-out';

export const IDLE_WARNING_MS = 60_000;
export const ACTIVITY_WRITE_INTERVAL_MS = 5_000;
const DEFAULT_IDLE_TIMEOUT_MINUTES = 10;
// 24 hours keeps every timer delay far below the browser's setTimeout limit (about 24.8
// days); a larger delay fires at once and would make the guard reschedule in a tight loop.
export const MAX_IDLE_TIMEOUT_MINUTES = 24 * 60;

export type SignOutReason = 'idle' | 'manual';

type IdleState =
  | { status: 'active'; warnAt: number }
  | { status: 'warning'; expiresAt: number }
  | { status: 'expired' };

// Whole minutes only, longer than the 60-second warning and at most 24 hours. Anything
// else, including a huge value meant to switch the feature off, falls back to the default.
export function parseIdleTimeoutMinutes(value: string | undefined) {
  const minutes = Number(value);

  return Number.isInteger(minutes) &&
    minutes * 60_000 > IDLE_WARNING_MS &&
    minutes <= MAX_IDLE_TIMEOUT_MINUTES
    ? minutes
    : DEFAULT_IDLE_TIMEOUT_MINUTES;
}

export function getIdleState(lastActivity: number, now: number, timeoutMs: number): IdleState {
  const expiresAt = lastActivity + timeoutMs;
  const warnAt = expiresAt - IDLE_WARNING_MS;

  if (now >= expiresAt) return { status: 'expired' };
  if (now >= warnAt) return { status: 'warning', expiresAt };

  return { status: 'active', warnAt };
}

function parseActivity(value: string | null) {
  const at = Number(value);

  return Number.isFinite(at) && at > 0 ? at : null;
}

// This tab's own latest activity. localStorage can refuse writes (for example when full)
// while reads still work, so a recorded time is kept here too. It lives only as long as
// the page's JavaScript, so a reload still depends on the stored value.
let memoryActivity: number | null = null;

function newest(stored: number | null) {
  if (stored === null) return memoryActivity;
  if (memoryActivity === null) return stored;

  return Math.max(stored, memoryActivity);
}

export function readLastActivity() {
  try {
    return newest(parseActivity(window.localStorage.getItem(LAST_ACTIVITY_KEY)));
  } catch {
    return memoryActivity;
  }
}

// Where the idle clock starts when the app shell loads. Loading is not user activity: a
// reload, a restored crashed tab or a discarded background tab coming back must not earn a
// fresh timeout, so the recorded time is used as is. Sign-in records a fresh time and
// sign-out clears it, so a missing record cannot prove recent activity and returns null
// (sign out). Without readable storage or a recorded time, the load is the only reference.
export function getStartingActivity(now: number) {
  try {
    return newest(parseActivity(window.localStorage.getItem(LAST_ACTIVITY_KEY)));
  } catch {
    return memoryActivity ?? now;
  }
}

export function recordActivity(at: number) {
  memoryActivity = at;

  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(at));
  } catch {
    // The in-memory time still covers this tab; other tabs just cannot see it.
  }
}

export function clearLastActivity() {
  memoryActivity = null;

  try {
    window.localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // Nothing was stored without storage.
  }
}

export function broadcastSignOut(reason: SignOutReason) {
  try {
    // The timestamp makes every broadcast a new value, so a storage event fires each time.
    window.localStorage.setItem(SIGN_OUT_KEY, JSON.stringify({ reason, at: Date.now() }));
  } catch {
    // Other tabs fall back to their own idle timer or the next failed API call.
  }
}

export function readSignOutBroadcast(key: string | null, value: string | null) {
  if (key !== SIGN_OUT_KEY || !value) return null;

  try {
    const { reason } = JSON.parse(value) as { reason?: unknown };

    return reason === 'idle' || reason === 'manual' ? reason : null;
  } catch {
    return null;
  }
}

export function getSignedOutPath(reason: SignOutReason) {
  return reason === 'idle' ? '/login?reason=idle' : '/login';
}

export function getIdleSignOutMessage(minutes: number) {
  const unit = minutes === 1 ? 'minute' : 'minutes';

  return `You were automatically signed out due to ${minutes} ${unit} of inactivity. Please sign in again to continue.`;
}
