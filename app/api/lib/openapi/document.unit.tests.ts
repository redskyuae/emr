import { describe, expect, it } from 'vitest';

import { openApiDocument } from './document';

describe('OpenAPI Patient Treatment Plan contracts', () => {
  it('documents the patient-scoped current-plan response and permission errors', () => {
    const operation = openApiDocument.paths['/api/v1/patients/{id}/treatment-plans'].get;
    const response = operation.responses as Record<string, { content?: unknown }>;

    expect(operation.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'id', in: 'path' }),
        expect.objectContaining({ name: 'status', in: 'query' }),
      ])
    );
    expect(response['200'].content).toBeDefined();
    expect(response['403']).toBeDefined();
    expect(response['404']).toBeDefined();
  });

  it('documents mutually exclusive Procedure Plan and catalogue selectors', () => {
    const schema = openApiDocument.components.schemas.CreateProcedureAppointmentRequest;
    const oneOf = schema.oneOf as Array<{ $ref: string }>;

    expect(oneOf).toEqual([
      { $ref: '#/components/schemas/CreateExistingPlanProcedureAppointmentRequest' },
      { $ref: '#/components/schemas/CreateCatalogueProcedureAppointmentRequest' },
    ]);

    const existing =
      openApiDocument.components.schemas.CreateExistingPlanProcedureAppointmentRequest;
    const catalogue = openApiDocument.components.schemas.CreateCatalogueProcedureAppointmentRequest;
    expect(existing.required).toEqual(
      expect.arrayContaining(['roomId', 'patientTreatmentPlanId', 'patientTreatmentPlanSessionId'])
    );
    expect(catalogue.required).toEqual(expect.arrayContaining(['roomId', 'treatmentId']));
    expect(JSON.stringify(existing)).not.toContain('treatmentSessionId');
    expect(JSON.stringify(catalogue)).not.toContain('treatmentSessionId');
  });

  it('documents Procedure resource availability and persisted allocations', () => {
    const operation = openApiDocument.paths['/api/v1/appointments/resource-availability'].get;
    const response = operation.responses as Record<string, { content?: unknown }>;
    const appointment = openApiDocument.components.schemas.Appointment;

    expect(operation.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'slotDate', in: 'query', required: true }),
        expect.objectContaining({ name: 'startTime', in: 'query', required: true }),
        expect.objectContaining({ name: 'endTime', in: 'query', required: true }),
        expect.objectContaining({ name: 'patientId', in: 'query', required: false }),
      ])
    );
    expect(response['200'].content).toBeDefined();
    expect(appointment.required).toEqual(expect.arrayContaining(['roomId', 'therapist']));
  });
});
