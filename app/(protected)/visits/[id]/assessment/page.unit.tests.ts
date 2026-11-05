import { beforeEach, describe, expect, it, vi } from 'vitest';

import ClinicianAssessmentPage from './page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('./_components/clinician-assessment-page-impl', () => ({
  ClinicianAssessmentPageImpl: () => null,
}));

// 15730 is a static demo Visit id, which a real Tenant's Visit can share.
const params = Promise.resolve({ id: '15730' });

describe('Clinician assessment demo gate', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return not found for a demo Visit id unless demo pages are enabled', async () => {
    await expect(ClinicianAssessmentPage({ params })).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('should render a demo Visit when demo pages are enabled', async () => {
    vi.stubEnv('ENABLE_DEMO_PAGES', 'true');

    await expect(ClinicianAssessmentPage({ params })).resolves.toBeTruthy();
  });
});
