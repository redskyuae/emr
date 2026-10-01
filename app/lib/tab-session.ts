const TAB_SESSION_KEY = 'emr-tab-session';

export function hasTabSession() {
  try {
    return window.sessionStorage.getItem(TAB_SESSION_KEY) === 'active';
  } catch {
    return false;
  }
}

export function markTabSession() {
  try {
    window.sessionStorage.setItem(TAB_SESSION_KEY, 'active');
    return true;
  } catch {
    return false;
  }
}

export function clearTabSession() {
  try {
    window.sessionStorage.removeItem(TAB_SESSION_KEY);
  } catch {
    // A blocked storage API cannot retain a usable tab marker.
  }
}
