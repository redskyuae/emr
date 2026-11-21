import { describe, expect, it } from 'vitest';

import {
  analyticsEventGroups,
  analyticsEvents,
  commonProperties,
  personProperties,
  sanitizeEventProperties,
} from './catalogue';
import type { PropertySpecs } from './event-spec';

// Property names that would describe a Patient, a record, money or typed text. A yes/no flag is
// always safe (`has_emirates_id`), so the check applies to every other kind of property.
const NEVER_SEND =
  /(^|_)(name|email|phone|mrn|emirates|uid|dob|birth|gender|address|photo|diagnosis|complaint|remarks?|text|amount|price|total|value|term|message|id|ids|number|url)($|_)/;
const ALLOWED_NAMES = new Set(['tenant_id']);

function riskyPropertyNames(specs: PropertySpecs) {
  return Object.entries(specs)
    .filter(([name, spec]) => spec.kind !== 'boolean' && !ALLOWED_NAMES.has(name))
    .filter(([name]) => NEVER_SEND.test(name))
    .map(([name]) => name);
}

describe('Analytics Event catalogue', () => {
  it('should not let one group of events silently override another', () => {
    const declared = analyticsEventGroups.flatMap((group) => Object.keys(group));

    expect(new Set(declared).size).toBe(declared.length);
    expect(Object.keys(analyticsEvents)).toHaveLength(declared.length);
  });

  it('should name custom events and properties in snake_case', () => {
    for (const [event, spec] of Object.entries(analyticsEvents)) {
      if (!event.startsWith('$')) {
        expect(event).toMatch(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/);
      }

      for (const name of Object.keys(spec.properties)) {
        expect(name).toMatch(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/);
      }
    }
  });

  it('should not declare any property whose name is on the never-send list', () => {
    for (const [event, spec] of Object.entries(analyticsEvents)) {
      expect({ event, names: riskyPropertyNames(spec.properties) }).toEqual({ event, names: [] });
    }

    expect(riskyPropertyNames(commonProperties)).toEqual([]);
    expect(riskyPropertyNames(personProperties)).toEqual([]);
  });
});

describe('sanitizeEventProperties', () => {
  it('should return null for an event that is not in the catalogue', () => {
    expect(sanitizeEventProperties('patient_viewed', { patient_id: 42 })).toBeNull();
  });

  it('should keep declared and common properties and drop everything else', () => {
    expect(
      sanitizeEventProperties('sign_in_failed', {
        status: 401,
        failure_kind: 'invalid_credentials',
        tenant_slug: 'apollo',
        email: 'asha@example.com',
        message: 'Invalid email or password',
      })
    ).toEqual({ status: 401, failure_kind: 'invalid_credentials', tenant_slug: 'apollo' });
  });
});
