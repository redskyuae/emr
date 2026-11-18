import { preconnect } from 'react-dom';

/**
 * Satoshi (Indian Type Foundry) as one variable font, weights 300–900. The ITF Free Font License
 * allows loading it from Fontshare's servers; the font files are not committed to the repository.
 */
const SATOSHI_STYLESHEET = 'https://api.fontshare.com/v2/css?f[]=satoshi@1&display=swap';

/** Loads Satoshi. Rendered once in the root layout; `--font-satoshi` in `globals.css` names it. */
export function FontStylesheet() {
  preconnect('https://cdn.fontshare.com', { crossOrigin: 'anonymous' });

  return <link rel="stylesheet" href={SATOSHI_STYLESHEET} precedence="font" />;
}
