'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/** The in-app page a click opens in place of this one, or null when the click does not leave it. */
function leavingHref(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  // A modified click opens a new tab or window, so this page and its changes stay.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;

  const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if ((anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return null;

  const url = new URL(anchor.href, window.location.href);
  // Another site unloads the page, which `beforeunload` already warns about.
  if (url.origin !== window.location.origin) return null;
  // A link to this Visit only changes its query, such as the step, and keeps what is typed.
  if (url.pathname === window.location.pathname) return null;

  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Holds every way out of the Visit while it has unsaved changes. In-app links (the sidebar,
 * Back to Visits, Visit Summary) navigate on the client, which `beforeunload` never sees, so
 * their clicks are caught on the document before Next's Link handles them and wait for the
 * user to choose. Reloading or closing the tab gets the browser's own warning.
 */
export function useLeaveVisitGuard(unsaved: boolean) {
  const router = useRouter();
  const [heldHref, setHeldHref] = useState<string | null>(null);

  useEffect(() => {
    if (!unsaved) return;

    const warnOnUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    const holdLink = (event: MouseEvent) => {
      const href = leavingHref(event);
      if (!href) return;

      event.preventDefault();
      event.stopPropagation();
      setHeldHref(href);
    };

    window.addEventListener('beforeunload', warnOnUnload);
    // Capture on the document runs before React's own listener on the app root.
    document.addEventListener('click', holdLink, true);

    return () => {
      window.removeEventListener('beforeunload', warnOnUnload);
      document.removeEventListener('click', holdLink, true);
    };
  }, [unsaved]);

  // Saving while the dialog is open leaves nothing to lose, so the held link is dropped.
  const pendingHref = unsaved ? heldHref : null;

  return {
    pendingHref,
    stay: () => setHeldHref(null),
    leave: () => {
      setHeldHref(null);
      if (pendingHref) router.push(pendingHref);
    },
  };
}
