// Turns a browser's user agent into the browser, operating system and kind of
// device a person would recognise, for the Audit Log and User Audit. It reads only
// the well-known markers; anything else is reported as unknown rather than guessed.

type DeviceType = 'Desktop' | 'Mobile' | 'Tablet';

export type ParsedUserAgent = {
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  deviceType: DeviceType | null;
};

// Order matters: Edge and Opera also say "Chrome", and Chrome also says "Safari".
const BROWSERS: [name: string, pattern: RegExp][] = [
  ['Edge', /Edg(?:e|A|iOS)?\/([\d.]+)/],
  ['Opera', /OPR\/([\d.]+)/],
  ['Samsung Internet', /SamsungBrowser\/([\d.]+)/],
  ['Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/],
  ['Chrome', /(?:Chrome|CriOS)\/([\d.]+)/],
  ['Safari', /Version\/([\d.]+).*Safari\//],
];

const OPERATING_SYSTEMS: [name: string, pattern: RegExp][] = [
  ['iPadOS', /iPad/],
  ['iOS', /iPhone|iPod/],
  ['Android', /Android/],
  ['Windows', /Windows/],
  ['ChromeOS', /CrOS/],
  ['macOS', /Mac OS X|Macintosh/],
  ['Linux', /Linux/],
];

function majorVersion(version: string | undefined) {
  return version ? version.split('.')[0] : null;
}

export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  if (!userAgent) return { browser: null, browserVersion: null, os: null, deviceType: null };

  const browserMatch = BROWSERS.map(
    ([name, pattern]) => [name, pattern.exec(userAgent)] as const
  ).find(([, match]) => match !== null);
  const os = OPERATING_SYSTEMS.find(([, pattern]) => pattern.test(userAgent))?.[0] ?? null;
  const isTablet =
    /iPad|Tablet/.test(userAgent) || (/Android/.test(userAgent) && !/Mobile/.test(userAgent));
  const isMobile = /Mobi|iPhone|iPod/.test(userAgent);

  return {
    os,
    browser: browserMatch?.[0] ?? null,
    browserVersion: majorVersion(browserMatch?.[1]?.[1]),
    deviceType: isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop',
  };
}

/** A short device description, e.g. `Chrome 156 on macOS`; null when there is no user agent. */
export function describeUserAgent(userAgent: string | null | undefined) {
  if (!userAgent) return null;

  const { browser, browserVersion, os } = parseUserAgent(userAgent);
  const browserLabel = browser ? [browser, browserVersion].filter(Boolean).join(' ') : null;

  if (browserLabel && os) return `${browserLabel} on ${os}`;
  return browserLabel ?? os ?? 'Other device';
}
