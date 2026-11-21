import { describe, expect, it } from 'vitest';

import { composerLinkFromParams } from './invoice-composer-analytics';

describe('composerLinkFromParams', () => {
  it('should name the kind of encounter the composer was opened for', () => {
    expect(composerLinkFromParams({ visitId: '42', admissionId: null })).toBe('visit');
    expect(composerLinkFromParams({ visitId: null, admissionId: '7' })).toBe('admission');
    expect(composerLinkFromParams({ visitId: null, admissionId: null })).toBe('none');
  });

  it('should ignore an id that the composer would ignore too', () => {
    expect(composerLinkFromParams({ visitId: 'abc', admissionId: '' })).toBe('none');
  });
});
