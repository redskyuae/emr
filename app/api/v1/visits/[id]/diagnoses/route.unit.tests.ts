import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { saveVisitDiagnosesCommand } from '@/app/api/lib/modules/visit-diagnosis/commands/save-visit-diagnoses-command';
import { listVisitDiagnosesQuery } from '@/app/api/lib/modules/visit-diagnosis/queries/list-visit-diagnoses-query';
import type { VisitDiagnosis } from '@/app/api/lib/modules/visit-diagnosis/schemas/visit-diagnosis-schema';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET, PUT } from './route';

vi.mock('@/app/api/lib/modules/visit-diagnosis/commands/save-visit-diagnoses-command', () => ({
  saveVisitDiagnosesCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/visit-diagnosis/queries/list-visit-diagnoses-query', () => ({
  listVisitDiagnosesQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const saveDiagnoses = vi.mocked(saveVisitDiagnosesCommand);
const listDiagnoses = vi.mocked(listVisitDiagnosesQuery);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);

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

describe('Visit diagnoses route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    listDiagnoses.mockResolvedValue({ success: true, data: [diagnosis], total: 1 });
    saveDiagnoses.mockResolvedValue({ success: true, data: [diagnosis] });
  });

  describe('GET', () => {
    it('should return unauthorized without a Tenant Session', async () => {
      requireSession.mockResolvedValue(
        NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
      );

      const response = await GET(request('GET'), context());

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(listDiagnoses).not.toHaveBeenCalled();
    });

    it('should list the diagnoses for the Visit in the active Tenant', async () => {
      const response = await GET(request('GET'), context());

      expect(response.status).toBe(StatusCodes.OK);
      await expect(response.json()).resolves.toEqual({ data: [diagnosis] });
      expect(listDiagnoses).toHaveBeenCalledWith('42', 'tenant-1');
      expect(requirePermissions).not.toHaveBeenCalled();
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
    it('should return forbidden without saving when visit:update is absent', async () => {
      requirePermissions.mockResolvedValue(
        NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
      );

      const response = await PUT(request('PUT'), context());

      expect(response.status).toBe(StatusCodes.FORBIDDEN);
      expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['visit:update']);
      expect(saveDiagnoses).not.toHaveBeenCalled();
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
