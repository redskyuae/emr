// Shared inactivity state for the authenticated app shell. Only timestamps and
// a sign-out reason are written to localStorage — never tokens or Session data.

export const LAST_ACTIVITY_KEY = 'emr-last-activity';
const SIGN_OUT_KEY = 'emr-sign-out';

export const IDLE_WARNING_MS = 60_000;
export const ACTIVITY_WRITE_INTERVAL_MS = 5_000;
const DEFAULT_IDLE_TIMEOUT_MINUTES = 10;

export type SignOutReason = 'idle' | 'manual';

type IdleState =
  | { status: 'active'; warnAt: number }
  | { status: 'warning'; expiresAt: number }
  | { status: 'expired' };

// The warning lasts IDLE_WARNING_MS, so the timeout must be longer than that.
export function parseIdleTimeoutMinutes(value: string | undefined) {
  const minutes = Number(value);

  return Number.isFinite(minutes) && minutes * 60_000 > IDLE_WARNING_MS
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

export function readLastActivity() {
  try {
    return parseActivity(window.localStorage.getItem(LAST_ACTIVITY_KEY));
  } catch {
    return null;
  }
}

// Where the idle clock starts when the app shell loads. Loading is not user activity: a
// reload, a restored crashed tab or a discarded background tab coming back must not earn a
// fresh timeout, so the stored time is used as is. Sign-in records a fresh time and sign-out
// clears it, so a missing record cannot prove recent activity and returns null (sign out).
// Without storage nothing can be kept or shared, so the load is the only reference left.
export function getStartingActivity(now: number) {
  try {
    return parseActivity(window.localStorage.getItem(LAST_ACTIVITY_KEY));
  } catch {
    return now;
  }
}

export function recordActivity(at: number) {
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(at));
  } catch {
    // Without storage each tab still tracks its own activity.
  }
}

export function clearLastActivity() {
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
