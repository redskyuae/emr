/**
 * Setup for unit tests. It runs in every unit test file, in that file's own environment, and
 * fills in browser APIs that jsdom does not implement. Without them, any interaction test that
 * renders a component which uses one (the Tabs pill, the page header watermark) throws.
 */
if (typeof window !== 'undefined') {
  // Components read `matchMedia` to honour `prefers-reduced-motion`. The stub answers that reduced
  // motion is preferred, so they take their static path and no animation runs inside a test. A
  // test that needs a different answer replaces `window.matchMedia` itself.
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = (query: string): MediaQueryList => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }

  // jsdom does no layout, so there is never a resize to report: observing is a no-op.
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}
