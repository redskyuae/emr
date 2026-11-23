import { readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

import { openApiDocument } from './document';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const API_ROOT = join(process.cwd(), 'app', 'api', 'v1');

// Route files name path parameters freely ([id], [roleId]) and the document may
// name the same segment differently ({userId}), so compare path shapes only.
const pathShape = (path: string) => path.replace(/\{[^}]+\}/g, '{}');

function routeOperations() {
  const operations: string[] = [];
  const routeFiles = readdirSync(API_ROOT, { recursive: true, encoding: 'utf8' }).filter(
    (file) => file === 'route.ts' || file.endsWith(`${sep}route.ts`)
  );
  for (const file of routeFiles) {
    const segments = file.split(sep).slice(0, -1);
    const path = ['/api/v1', ...segments.map((s) => s.replace(/^\[(.+)\]$/, '{$1}'))].join('/');
    const source = readFileSync(join(API_ROOT, file), 'utf8');
    for (const [, method] of source.matchAll(
      /export async function (GET|POST|PUT|PATCH|DELETE)\b/g
    )) {
      operations.push(`${method.toLowerCase()} ${pathShape(path)}`);
    }
  }
  return operations.sort();
}

function documentedOperations() {
  return Object.entries(openApiDocument.paths)
    .filter(([path]) => path.startsWith('/api/v1/'))
    .flatMap(([path, item]) =>
      Object.keys(item)
        .filter((method) => HTTP_METHODS.includes(method))
        .map((method) => `${method} ${pathShape(path)}`)
    )
    .sort();
}

describe('OpenAPI route coverage', () => {
  it('should find the API route operations to compare', () => {
    expect(routeOperations().length).toBeGreaterThan(300);
  });

  it('should document every app/api/v1 route operation', () => {
    const documented = new Set(documentedOperations());

    expect(routeOperations().filter((operation) => !documented.has(operation))).toEqual([]);
  });

  it('should not document an operation that has no app/api/v1 route', () => {
    const routes = new Set(routeOperations());

    expect(documentedOperations().filter((operation) => !routes.has(operation))).toEqual([]);
  });
});

describe('OpenAPI Therapist contracts', () => {
  it('should document the Therapist Skill Master operations', () => {
    expect(Object.keys(openApiDocument.paths['/api/v1/therapist-skills'])).toEqual(['get', 'post']);
    expect(Object.keys(openApiDocument.paths['/api/v1/therapist-skills/{id}'])).toEqual([
      'get',
      'put',
      'delete',
    ]);
    expect(openApiDocument.components.schemas.SaveTherapistSkillRequest.required).toEqual(['name']);
  });

  it('should document the Therapist registry and lifecycle operations', () => {
    expect(Object.keys(openApiDocument.paths['/api/v1/therapists/{id}'])).toEqual(['get', 'patch']);
    expect(
      openApiDocument.paths['/api/v1/therapists/{id}/deactivate'].post.responses
    ).toHaveProperty('409');
    expect(openApiDocument.paths['/api/v1/therapists/{id}/reactivate'].post).toBeDefined();
    expect(openApiDocument.components.schemas.CreateTherapistRequest.required).toEqual([
      'name',
      'email',
      'password',
    ]);
  });
});

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
      '403': expect.any(Object),
      '404': { content: expect.any(Object) },
    });
    expect(operation.description).toContain('`visit:read`');
  });
});

describe('OpenAPI Admit Source contract', () => {
  it('should document the Admit Source Master operations', () => {
    expect(Object.keys(openApiDocument.paths['/api/v1/visits/admit-sources'])).toEqual(
      expect.arrayContaining(['get', 'post'])
    );
    expect(Object.keys(openApiDocument.paths['/api/v1/visits/admit-sources/{id}'])).toEqual(
      expect.arrayContaining(['get', 'put', 'delete'])
    );
  });

  it('should document the optional Admit Source on Visit check-in', () => {
    const request = openApiDocument.components.schemas.CheckInVisitRequest;

    expect(request.properties).toHaveProperty('admitSourceId');
    expect(request.required).not.toContain('admitSourceId');
    expect(openApiDocument.components.schemas.Visit.properties).toHaveProperty('admitSource');
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

describe('OpenAPI Visit amendment contracts', () => {
  const amendPaths = [
    ['/api/v1/visits/{id}/amend', 'AmendVisitRequest'],
    ['/api/v1/visits/{id}/notes/{noteId}/amend', 'AmendVisitClinicalNoteRequest'],
    ['/api/v1/visits/{id}/vitals/{vitalId}/amend', 'AmendVisitVitalSignRequest'],
  ] as const;

  it.each(amendPaths)(
    'should document %s behind visit:amend with its error responses',
    (path, requestSchema) => {
      const operation = openApiDocument.paths[path].put;

      expect(operation.description).toContain('`visit:amend`');
      expect(operation.requestBody.content['application/json'].schema).toEqual({
        $ref: `#/components/schemas/${requestSchema}`,
      });
      expect(Object.keys(operation.responses)).toEqual(
        expect.arrayContaining(['200', '400', '401', '403', '404', '409', '500'])
      );
    }
  );

  it('should not accept a Visit link when amending a Clinical Note or Vital Sign', () => {
    const { schemas } = openApiDocument.components;

    expect(schemas.AmendVisitClinicalNoteRequest.properties).not.toHaveProperty('visitId');
    expect(schemas.AmendVisitVitalSignRequest.properties).not.toHaveProperty('visitId');
    expect(schemas.AmendVisitRequest.required).toEqual(['visitTypeId']);
  });

  it('should document the Visit Doctor as optional outside an OPD Consultation', () => {
    const { schemas } = openApiDocument.components;

    expect(schemas.AmendVisitRequest.properties.doctorId.type).toEqual(['integer', 'null']);
    expect(schemas.Visit.properties.doctor.oneOf).toEqual([
      { $ref: '#/components/schemas/VisitDoctorSummary' },
      { type: 'null' },
    ]);
    expect(schemas.CheckInVisitRequest.required).toEqual(['visitTypeId']);
  });
});

describe('OpenAPI clinical coding contracts', () => {
  it('should document ICD-10-CM validation on the Diagnosis Code Master', () => {
    const request = openApiDocument.components.schemas.CreateDiagnosisCodeRequest;
    const post = openApiDocument.paths['/api/v1/clinical-masters/diagnosis-codes'].post;

    expect(request.properties.code.description).toContain('ICD-10-CM');
    expect(JSON.stringify(post.responses)).toContain(
      'Diagnosis code must be a valid ICD-10-CM code, e.g. M54.5.'
    );
  });

  it('should document the Charge Item code type and its CPT and HCPCS rules', () => {
    const request = openApiDocument.components.schemas.CreateChargeItemRequest;

    expect(openApiDocument.components.schemas.ChargeItemCodeType.enum).toEqual([
      'CPT',
      'HCPCS',
      'SERVICE',
      'LOCAL',
    ]);
    expect(request.properties.codeType).toMatchObject({ default: 'LOCAL' });
    expect(request.required).not.toContain('codeType');
    expect(JSON.stringify(openApiDocument.components.schemas.ChargeItem.allOf)).toContain(
      '"codeType"'
    );
    expect(
      JSON.stringify(openApiDocument.paths['/api/v1/charge-items/{id}'].put.responses)
    ).toContain('Charge item code must be a valid HCPCS code, e.g. J1100.');
  });

  it('should document the Ayurveda Diagnosis Code Master operations', () => {
    expect(
      Object.keys(openApiDocument.paths['/api/v1/clinical-masters/ayurveda-diagnosis-codes'])
    ).toEqual(expect.arrayContaining(['get', 'post']));
    expect(
      Object.keys(openApiDocument.paths['/api/v1/clinical-masters/ayurveda-diagnosis-codes/{id}'])
    ).toEqual(expect.arrayContaining(['get', 'put', 'delete']));
    expect(openApiDocument.components.schemas.AyurvedaDiagnosisCode.required).toContain(
      'icdDiagnosisCode'
    );
    expect(
      JSON.stringify(
        openApiDocument.paths['/api/v1/clinical-masters/ayurveda-diagnosis-codes'].post.responses
      )
    ).toContain('Ayurveda diagnosis code AYU-AMV already exists.');
  });

  it('should document who amended a Clinical Note', () => {
    const amend = openApiDocument.paths['/api/v1/visits/{id}/notes/{noteId}/amend'].put;

    expect(Object.keys(openApiDocument.components.schemas.ClinicalNote.properties)).toEqual(
      expect.arrayContaining(['amendedAt', 'amendedByUserId', 'amendedByUserName'])
    );
    expect(amend.description).toContain('amendedByUserId');
    expect(JSON.stringify(amend.responses['200'])).toContain('Dr Priya Nair');
  });

  it('should document the Ayurveda Diagnosis Code write permissions', () => {
    const collection = openApiDocument.paths['/api/v1/clinical-masters/ayurveda-diagnosis-codes'];
    const item = openApiDocument.paths['/api/v1/clinical-masters/ayurveda-diagnosis-codes/{id}'];

    expect(collection.post.description).toContain('`ayurveda-diagnosis-code:create`');
    expect(item.put.description).toContain('`ayurveda-diagnosis-code:update`');
    expect(item.delete.description).toContain('`ayurveda-diagnosis-code:delete`');
    expect(Object.keys(collection.post.responses)).toContain('403');
    expect(Object.keys(item.put.responses)).toContain('403');
    expect(Object.keys(item.delete.responses)).toContain('403');
  });

  it('should document Visit diagnosis list, save, and amend with their permissions', () => {
    const diagnoses = openApiDocument.paths['/api/v1/visits/{id}/diagnoses'];
    const amend = openApiDocument.paths['/api/v1/visits/{id}/diagnoses/amend'].put;

    expect(Object.keys(diagnoses)).toEqual(expect.arrayContaining(['get', 'put']));
    expect(diagnoses.put.description).toContain('`visit:update`');
    expect(amend.description).toContain('`visit:amend`');
    expect(Object.keys(amend.responses)).toEqual(
      expect.arrayContaining(['200', '400', '401', '403', '404', '409', '500'])
    );
    expect(JSON.stringify(diagnoses.put.responses)).toContain(
      'Visit VST-1001 is closed and cannot be edited.'
    );
    expect(JSON.stringify(amend.responses)).toContain('Request body must be valid JSON');
    expect(openApiDocument.components.schemas.SaveVisitDiagnosesRequest.properties).toMatchObject({
      diagnoses: { maxItems: 20 },
    });
  });
});

describe('OpenAPI Visit Summary contract', () => {
  it('should document the Visit Summary read with its permission and billing rule', () => {
    const operation = openApiDocument.paths['/api/v1/visits/{id}/summary'].get;

    expect(operation.description).toContain('`visit:read`');
    expect(operation.description).toContain('`invoice:read`');
    expect(Object.keys(operation.responses)).toEqual(
      expect.arrayContaining(['200', '400', '401', '403', '404', '500'])
    );
    expect(openApiDocument.components.schemas.VisitSummary.required).toEqual(
      expect.arrayContaining(['billing', 'billingIncluded', 'notes', 'diagnoses'])
    );
  });
});
