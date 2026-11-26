import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { saveVisitDiagnosesCommand } from '@/app/api/lib/modules/visit-diagnosis/commands/save-visit-diagnoses-command';
import { listVisitDiagnosesQuery } from '@/app/api/lib/modules/visit-diagnosis/queries/list-visit-diagnoses-query';
import type { VisitDiagnosis } from '@/app/api/lib/modules/visit-diagnosis/schemas/visit-diagnosis-schema';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET, PUT } from './route';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';

vi.mock('@/app/api/lib/analytics/lifecycle-event-recorder', () => ({
  recordLifecycleEvent: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/visit-diagnosis/commands/save-visit-diagnoses-command', () => ({
  saveVisitDiagnosesCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/visit-diagnosis/queries/list-visit-diagnoses-query', () => ({
  listVisitDiagnosesQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/modules/visit/queries/get-visit-by-id-query', () => ({
  getVisitByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const saveDiagnoses = vi.mocked(saveVisitDiagnosesCommand);
const listDiagnoses = vi.mocked(listVisitDiagnosesQuery);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);
const getVisitById = vi.mocked(getVisitByIdQuery);
const recordAudit = vi.mocked(recordAuditEvent);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const diagnosis = { id: 1, visitId: 42, code: 'M06.9' } as VisitDiagnosis;
const body = {
  diagnoses: [{ codeSystem: 'ICD10CM', diagnosisCodeId: 5, diagnosisType: 'PRINCIPAL' }],
};

function request(method: 'GET' | 'PUT', rawBody = JSON.stringify(body)) {
  return new NextRequest('http://localhost/api/v1/visits/42/diagnoses', {
    method,
    ...(method === 'PUT' ? { body: rawBody, headers: { 'Content-Type': 'application/json' } } : {}),
  });
}

function context(id = '42') {
  return { params: Promise.resolve({ id }) };
}

/** The details the route handed the recorder, resolving a lazy lookup as the recorder does. */
async function recordedDetails() {
  const details = recordAudit.mock.calls[0]?.[3];

  return typeof details === 'function' ? await details() : details;
}

describe('Visit diagnoses route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    listDiagnoses.mockResolvedValue({ success: true, data: [diagnosis], total: 1 });
    saveDiagnoses.mockResolvedValue({ success: true, data: [diagnosis] });
    getVisitById.mockResolvedValue({
      success: true,
      data: { id: 42, visitNumber: 'VST-1042', patient: { id: 9 } } as never,
    });
  });

  describe('GET', () => {
    it('should return unauthorized without a Tenant Session', async () => {
      requireSession.mockResolvedValue(
        NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
      );

      const response = await GET(request('GET'), context());

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(requirePermissions).not.toHaveBeenCalled();
      expect(listDiagnoses).not.toHaveBeenCalled();
    });

    it('should list the diagnoses for the Visit in the active Tenant', async () => {
      const response = await GET(request('GET'), context());

      expect(response.status).toBe(StatusCodes.OK);
      await expect(response.json()).resolves.toEqual({ data: [diagnosis] });
      expect(listDiagnoses).toHaveBeenCalledWith('42', 'tenant-1');
    });

    it('should require visit-diagnosis:read', async () => {
      await GET(request('GET'), context());

      expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['visit-diagnosis:read']);
    });

    it('should return forbidden without listing when visit-diagnosis:read is absent', async () => {
      requirePermissions.mockResolvedValue(
        NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
      );

      const response = await GET(request('GET'), context());

      expect(response.status).toBe(StatusCodes.FORBIDDEN);
      await expect(response.json()).resolves.toEqual({ message: 'Forbidden' });
      expect(listDiagnoses).not.toHaveBeenCalled();
    });

    it('should map a missing Visit to not found', async () => {
      listDiagnoses.mockResolvedValue({
        success: false,
        errors: ['Visit not found'],
        status: StatusCodes.NOT_FOUND,
      });

      const response = await GET(request('GET'), context());

      expect(response.status).toBe(StatusCodes.NOT_FOUND);
      await expect(response.json()).resolves.toEqual({
        message: 'Visit not found',
        errors: ['Visit not found'],
      });
    });

    it('should map an invalid Visit id to bad request', async () => {
      listDiagnoses.mockResolvedValue({ success: false, errors: ['Visit abc is Invalid.'] });

      const response = await GET(request('GET'), context('abc'));

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      await expect(response.json()).resolves.toEqual({
        message: 'Validation failed',
        errors: ['Visit abc is Invalid.'],
      });
    });

    it('should return an internal server error when the query throws', async () => {
      listDiagnoses.mockRejectedValue(new Error('database down'));

      const response = await GET(request('GET'), context());

      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe('PUT', () => {
    it('should return forbidden without saving when visit-diagnosis:update is absent', async () => {
      requirePermissions.mockResolvedValue(
        NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
      );

      const response = await PUT(request('PUT'), context());

      expect(response.status).toBe(StatusCodes.FORBIDDEN);
      expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['visit-diagnosis:update']);
      expect(saveDiagnoses).not.toHaveBeenCalled();
      expect(listDiagnoses).not.toHaveBeenCalled();
    });

    it('should return unauthorized without checking permission', async () => {
      requireSession.mockResolvedValue(
        NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
      );

      const response = await PUT(request('PUT'), context());

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(requirePermissions).not.toHaveBeenCalled();
    });

    it('should reject invalid JSON before saving', async () => {
      const response = await PUT(request('PUT', '{'), context());

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      await expect(response.json()).resolves.toEqual({
        message: 'Request body must be valid JSON',
      });
      expect(saveDiagnoses).not.toHaveBeenCalled();
    });

    it('should pass the Visit id, active Tenant, and body to the command', async () => {
      const response = await PUT(request('PUT'), context());

      expect(response.status).toBe(StatusCodes.OK);
      await expect(response.json()).resolves.toEqual({ data: [diagnosis] });
      expect(saveDiagnoses).toHaveBeenCalledWith('42', 'tenant-1', body);
      expect(recordLifecycleEvent).toHaveBeenCalledTimes(1);
      expect(recordLifecycleEvent).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'visit_diagnoses_saved',
        expect.any(Function)
      );
    });

    it('should record a visit-diagnosis.save Audit Event with the codes added and removed', async () => {
      listDiagnoses.mockResolvedValue({
        success: true,
        data: [{ ...diagnosis, code: 'R51' }],
        total: 1,
      });

      await PUT(request('PUT'), context('42'));

      expect(recordAudit).toHaveBeenCalledWith(
        tenantSession,
        expect.anything(),
        'visit-diagnosis.save',
        expect.any(Function)
      );
      await expect(recordedDetails()).resolves.toMatchObject({
        visitId: 42,
        patientId: 9,
        entityLabel: 'VST-1042',
        metadata: { added: ['M06.9'], removed: ['R51'] },
      });
    });

    it('should answer without waiting on the Visit lookup that only serves the Audit Event', async () => {
      getVisitById.mockRejectedValue(new Error('database down'));

      const response = await PUT(request('PUT'), context('42'));

      expect(response.status).toBe(StatusCodes.OK);
      expect(getVisitById).not.toHaveBeenCalled();
    });

    it('should not record an Audit Event when listing diagnoses', async () => {
      await GET(request('GET'), context('42'));

      expect(recordAudit).not.toHaveBeenCalled();
    });

    it('should surface a single conflict as the message', async () => {
      saveDiagnoses.mockResolvedValue({
        success: false,
        errors: ['Visit VST-1001 is closed and cannot be edited.'],
        status: StatusCodes.CONFLICT,
      });

      const response = await PUT(request('PUT'), context());

      expect(response.status).toBe(StatusCodes.CONFLICT);
      await expect(response.json()).resolves.toEqual({
        message: 'Visit VST-1001 is closed and cannot be edited.',
        errors: ['Visit VST-1001 is closed and cannot be edited.'],
      });
    });

    it('should summarise several conflicts', async () => {
      saveDiagnoses.mockResolvedValue({
        success: false,
        errors: ['Diagnosis code 5 is Invalid.', 'Ayurveda diagnosis code 3 is Invalid.'],
        status: StatusCodes.CONFLICT,
      });

      const response = await PUT(request('PUT'), context());

      await expect(response.json()).resolves.toMatchObject({ message: 'Conflict' });
    });

    it('should map validation failures to bad request', async () => {
      saveDiagnoses.mockResolvedValue({
        success: false,
        errors: ['Choose exactly one Principal ICD-10-CM diagnosis.'],
      });

      const response = await PUT(request('PUT'), context());

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      await expect(response.json()).resolves.toEqual({
        message: 'Validation failed',
        errors: ['Choose exactly one Principal ICD-10-CM diagnosis.'],
      });
      expect(recordLifecycleEvent).not.toHaveBeenCalled();
    });

    it('should map a missing Visit to not found', async () => {
      saveDiagnoses.mockResolvedValue({
        success: false,
        errors: ['Visit not found'],
        status: StatusCodes.NOT_FOUND,
      });

      const response = await PUT(request('PUT'), context());

      expect(response.status).toBe(StatusCodes.NOT_FOUND);
    });

    it('should return an internal server error when the command throws', async () => {
      saveDiagnoses.mockRejectedValue(new Error('database down'));

      const response = await PUT(request('PUT'), context());

      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      await expect(response.json()).resolves.toEqual({ message: 'Internal Server Error' });
    });
  });
});
