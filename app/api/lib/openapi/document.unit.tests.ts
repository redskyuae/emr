import { describe, expect, it } from 'vitest';

import { openApiDocument } from './document';

describe('OpenAPI Visit Patient type contract', () => {
  it('documents three-year classification and lookup errors', () => {
    const operation = openApiDocument.paths['/api/v1/visits/patient-type'].get;
    expect(operation.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'patientId', in: 'query', required: true }),
      ])
    );
    expect(operation.description).toContain('three-calendar-year window');
    expect(operation.responses).toMatchObject({
      '200': { content: expect.any(Object) },
      '400': { content: expect.any(Object) },
      '404': { content: expect.any(Object) },
    });
  });
});

describe('OpenAPI Patient search contract', () => {
  it('should document name, MRN, phone, and date of birth search', () => {
    const operation = openApiDocument.paths['/api/v1/patients'].get;

    expect(operation.description).toContain('full first and last name');
    expect(operation.description).toContain('MRN, phone');
    expect(operation.description).toContain(
      'date of birth (YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY)'
    );
    expect(operation.parameters).toEqual(
      expect.arrayContaining([{ $ref: '#/components/parameters/Query' }])
    );
  });
});

describe('OpenAPI Current User contracts', () => {
  it('should expose the Tenant operational time zone', () => {
    const tenant = openApiDocument.components.schemas.CurrentUserTenant;

    expect(tenant.required).toContain('timeZone');
    expect(tenant.properties.timeZone).toMatchObject({
      type: 'string',
      example: 'Asia/Kolkata',
    });
  });
});

describe('OpenAPI Patient Treatment Plan contracts', () => {
  it('documents direct Treatment assignment after consultation', () => {
    const operation = openApiDocument.paths['/api/v1/patients/{id}/treatment-plans/assign'].post;
    const response = operation.responses as Record<string, { content?: unknown }>;
    const request = openApiDocument.components.schemas.AssignPatientTreatmentPlanRequest;

    expect(operation.requestBody).toBeDefined();
    expect(request.required).toEqual(['treatmentId']);
    expect(request.properties.additionalSessions).toMatchObject({
      type: 'integer',
      minimum: 0,
      maximum: 100,
    });
    expect(response['201'].content).toBeDefined();
    expect(response['400'].content).toBeDefined();
    expect(response['403']).toBeDefined();
    expect(response['404'].content).toBeDefined();
    expect(response['409'].content).toBeDefined();
  });

  it('documents current and historical Patient Treatment Plan response and permission errors', () => {
    const operation = openApiDocument.paths['/api/v1/patients/{id}/treatment-plans'].get;
    const response = operation.responses as Record<string, { content?: unknown }>;

    expect(operation.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'id', in: 'path' }),
        expect.objectContaining({ name: 'status', in: 'query' }),
      ])
    );
    expect(operation.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'status',
          schema: expect.objectContaining({ enum: ['current', 'all'], default: 'current' }),
        }),
      ])
    );
    expect(response['200'].content).toBeDefined();
    expect(response['403']).toBeDefined();
    expect(response['404']).toBeDefined();
  });

  it('documents adding Sessions to a current Patient Treatment Plan', () => {
    const operation = openApiDocument.paths['/api/v1/patients/{id}/treatment-plans'].post;
    const response = operation.responses as Record<string, { content?: unknown }>;
    const request = openApiDocument.components.schemas.AddPatientTreatmentPlanSessionsRequest;

    expect(operation.parameters).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'id', in: 'path' })])
    );
    expect(operation.requestBody).toBeDefined();
    expect(request.required).toEqual(['patientTreatmentPlanId', 'sessions']);
    expect(response['200'].content).toBeDefined();
    expect(response['400']).toBeDefined();
    expect(response['403']).toBeDefined();
    expect(response['404']).toBeDefined();
    expect(response['409']).toBeDefined();
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

  it('should document the inclusive Appointment date filter', () => {
    const operation = openApiDocument.paths['/api/v1/appointments'].get;

    expect(operation.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'fromDate', in: 'query', required: false }),
        expect.objectContaining({ name: 'statusCategory', in: 'query', required: false }),
      ])
    );
  });

  it('should document server-generated Appointment exports and their filters', () => {
    const operation = openApiDocument.paths['/api/v1/appointments/export'].get;
    const response = operation.responses['200'] as { content: Record<string, unknown> };

    expect(operation.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'format', in: 'query', required: true }),
        expect.objectContaining({ name: 'fromDate', in: 'query', required: false }),
        expect.objectContaining({ name: 'doctorId', in: 'query' }),
        expect.objectContaining({ name: 'therapistId', in: 'query' }),
        expect.objectContaining({ name: 'appointmentStatusId', in: 'query' }),
        expect.objectContaining({ name: 'statusCategory', in: 'query', required: false }),
      ])
    );
    expect(response.content['application/pdf']).toBeDefined();
    expect(
      response.content['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    ).toBeDefined();
    expect(operation.responses['409']).toBeDefined();
  });
});

describe('OpenAPI Therapist Schedule contracts', () => {
  it('should document list, create, and update operations with authenticated errors', () => {
    const path = openApiDocument.paths['/api/v1/therapist-schedules'];
    expect(path.get.parameters).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'therapistId', in: 'query' })])
    );
    expect(path.post.responses['201']).toBeDefined();
    expect(path.post.responses['409']).toBeDefined();
    expect(path.put.responses['200']).toBeDefined();
    expect(path.put.responses['401']).toBeDefined();
  });

  it('should require the Therapist and schedule inputs on create', () => {
    expect(openApiDocument.components.schemas.CreateTherapistScheduleRequest.required).toEqual([
      'therapistId',
      'rotaIds',
      'slotInMinute',
      'slotFromDate',
      'slotToDate',
    ]);
  });
});
