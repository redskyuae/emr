type SchemaObject = Record<string, unknown>;
type OperationObject = Record<string, unknown>;
type PathItemObject = Record<string, OperationObject>;

type OpenApiDocument = {
  openapi: '3.1.0';
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: { url: string; description: string }[];
  tags: { name: string; description: string }[];
  paths: Record<string, PathItemObject>;
  components: {
    securitySchemes: Record<string, unknown>;
    parameters: Record<string, unknown>;
    schemas: Record<string, SchemaObject>;
    responses: Record<string, unknown>;
  };
};

const jsonContent = (schema: unknown, example?: unknown) => ({
  'application/json': {
    schema,
    ...(example === undefined ? {} : { example }),
  },
});

const schemaRef = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const responseRef = (name: string) => ({ $ref: `#/components/responses/${name}` });
const parameterRef = (name: string) => ({ $ref: `#/components/parameters/${name}` });

const idPathParameter = (entityName: string) => ({
  name: 'id',
  in: 'path',
  required: true,
  description: `${entityName} identifier.`,
  schema: {
    oneOf: [
      { type: 'integer', minimum: 1 },
      { type: 'string', minLength: 1 },
    ],
  },
});

const numberIdPathParameter = (entityName: string) => ({
  name: 'id',
  in: 'path',
  required: true,
  description: `${entityName} identifier.`,
  schema: { type: 'integer', minimum: 1 },
});

const namedNumberPathParameter = (name: string, entityName: string) => ({
  name,
  in: 'path',
  required: true,
  description: `${entityName} identifier.`,
  schema: { type: 'integer', minimum: 1 },
});

const namedStringPathParameter = (name: string, entityName: string) => ({
  name,
  in: 'path',
  required: true,
  description: `${entityName} identifier.`,
  schema: { type: 'string', minLength: 1 },
});

const stringIdPathParameter = (entityName: string) => ({
  name: 'id',
  in: 'path',
  required: true,
  description: `${entityName} identifier.`,
  schema: { type: 'string', minLength: 1 },
});

const paginatedSchema = (itemSchemaName: string) => ({
  type: 'object',
  required: ['data', 'meta'],
  properties: {
    data: { type: 'array', items: schemaRef(itemSchemaName) },
    meta: schemaRef('PaginationMeta'),
  },
});

const dataEnvelopeSchema = (schemaName: string) => ({
  type: 'object',
  required: ['data'],
  properties: {
    data: schemaRef(schemaName),
  },
});

const dataEnvelopeArraySchema = (schemaName: string) => ({
  type: 'object',
  required: ['data'],
  properties: {
    data: { type: 'array', items: schemaRef(schemaName) },
  },
});

const errorResponses = {
  '400': responseRef('ValidationFailed'),
  '404': responseRef('NotFound'),
  '409': responseRef('Conflict'),
  '500': responseRef('InternalServerError'),
};

const authenticatedErrorResponses = {
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  ...errorResponses,
};

const authenticatedListErrorResponses = {
  '400': responseRef('ValidationFailed'),
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '500': responseRef('InternalServerError'),
};

const roleManagementErrorResponses = {
  ...authenticatedErrorResponses,
  '422': responseRef('UnprocessableEntity'),
};

const rolePermissionErrorResponses = {
  '400': responseRef('ValidationFailed'),
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '404': responseRef('NotFound'),
  '500': responseRef('InternalServerError'),
};

const roleAssignmentErrorResponses = {
  ...rolePermissionErrorResponses,
  '422': responseRef('UnprocessableEntity'),
};

const listParameters = [
  parameterRef('Page'),
  parameterRef('Limit'),
  parameterRef('Query'),
  parameterRef('Search'),
];

const requestBody = (schemaName: string, example: unknown) => ({
  required: true,
  content: jsonContent(schemaRef(schemaName), example),
});

const collectionOperations = ({
  tag,
  entity,
  summaryEntity,
  schemaName,
  createSchemaName,
  example,
  extraListParameters = [],
  security,
  listErrorResponses = {
    '400': responseRef('ValidationFailed'),
    '500': responseRef('InternalServerError'),
  },
  mutationErrorResponses = errorResponses,
}: {
  tag: string;
  entity: string;
  summaryEntity: string;
  schemaName: string;
  createSchemaName: string;
  example: unknown;
  extraListParameters?: unknown[];
  security?: unknown[];
  listErrorResponses?: Record<string, unknown>;
  mutationErrorResponses?: Record<string, unknown>;
}) => ({
  get: {
    tags: [tag],
    summary: `List ${summaryEntity}`,
    description: `Returns a paginated list of ${summaryEntity}.`,
    ...(security ? { security } : {}),
    parameters: [...listParameters, ...extraListParameters],
    responses: {
      '200': {
        description: `Paginated ${summaryEntity} list.`,
        content: jsonContent(paginatedSchema(schemaName)),
      },
      ...listErrorResponses,
    },
  },
  post: {
    tags: [tag],
    summary: `Create ${entity}`,
    ...(security ? { security } : {}),
    requestBody: requestBody(createSchemaName, example),
    responses: {
      '201': {
        description: `${entity} created.`,
        content: jsonContent(dataEnvelopeSchema(schemaName)),
      },
      ...mutationErrorResponses,
    },
  },
});

const itemOperations = ({
  tag,
  entity,
  schemaName,
  updateSchemaName,
  example,
  parameters = [],
  security,
  operationErrorResponses = errorResponses,
}: {
  tag: string;
  entity: string;
  schemaName: string;
  updateSchemaName: string;
  example: unknown;
  parameters?: unknown[];
  security?: unknown[];
  operationErrorResponses?: Record<string, unknown>;
}) => ({
  get: {
    tags: [tag],
    summary: `Get ${entity}`,
    ...(security ? { security } : {}),
    parameters,
    responses: {
      '200': {
        description: `${entity} found.`,
        content: jsonContent(dataEnvelopeSchema(schemaName)),
      },
      ...operationErrorResponses,
    },
  },
  put: {
    tags: [tag],
    summary: `Update ${entity}`,
    ...(security ? { security } : {}),
    parameters,
    requestBody: requestBody(updateSchemaName, example),
    responses: {
      '200': {
        description: `${entity} updated.`,
        content: jsonContent(dataEnvelopeSchema(schemaName)),
      },
      ...operationErrorResponses,
    },
  },
  delete: {
    tags: [tag],
    summary: `Delete ${entity}`,
    ...(security ? { security } : {}),
    parameters,
    responses: {
      '204': { description: `${entity} deleted.` },
      ...operationErrorResponses,
    },
  },
});

const patientRecordCollectionOperations = ({
  tag,
  entity,
  summaryEntity,
  schemaName,
  createSchemaName,
  requestExample,
  responseExample,
}: {
  tag: string;
  entity: string;
  summaryEntity: string;
  schemaName: string;
  createSchemaName: string;
  requestExample: unknown;
  responseExample: unknown;
}) => ({
  get: {
    tags: [tag],
    summary: `List ${summaryEntity}`,
    description: `Returns a paginated list of ${summaryEntity} for one Patient in the active Tenant, most-recent first. The tenantId is resolved from the active authenticated Session.`,
    security: [{ cookieAuth: [] }],
    parameters: [numberIdPathParameter('Patient'), ...listParameters],
    responses: {
      '200': {
        description: `Paginated ${summaryEntity} list.`,
        content: jsonContent(paginatedSchema(schemaName), {
          data: [responseExample],
          meta: { total: 1, totalPages: 1, pageSize: 100, pageNumber: 1 },
        }),
      },
      ...authenticatedListErrorResponses,
    },
  },
  post: {
    tags: [tag],
    summary: `Create ${entity}`,
    description: `Records a new ${entity} for one Patient in the active Tenant. The tenantId and recording user are resolved from the active authenticated Session, never from the request body.`,
    security: [{ cookieAuth: [] }],
    parameters: [numberIdPathParameter('Patient')],
    requestBody: requestBody(createSchemaName, requestExample),
    responses: {
      '201': {
        description: `${entity} created.`,
        content: jsonContent(dataEnvelopeSchema(schemaName), { data: responseExample }),
      },
      ...authenticatedErrorResponses,
    },
  },
});

const patientRecordItemOperations = ({
  tag,
  entity,
  schemaName,
  updateSchemaName,
  recordParam,
  requestExample,
  responseExample,
  extraPutErrorResponses = {},
}: {
  tag: string;
  entity: string;
  schemaName: string;
  updateSchemaName: string;
  recordParam: string;
  requestExample: unknown;
  responseExample: unknown;
  extraPutErrorResponses?: Record<string, unknown>;
}) => {
  const parameters = [
    numberIdPathParameter('Patient'),
    namedNumberPathParameter(recordParam, entity),
  ];

  return {
    get: {
      tags: [tag],
      summary: `Get ${entity}`,
      description: `Returns one ${entity} by ID for the Patient in the active Tenant. Records from other Tenants are treated as not found.`,
      security: [{ cookieAuth: [] }],
      parameters,
      responses: {
        '200': {
          description: `${entity} found.`,
          content: jsonContent(dataEnvelopeSchema(schemaName), { data: responseExample }),
        },
        ...authenticatedErrorResponses,
      },
    },
    put: {
      tags: [tag],
      summary: `Update ${entity}`,
      description: `Updates one ${entity} for the Patient in the active Tenant.`,
      security: [{ cookieAuth: [] }],
      parameters,
      requestBody: requestBody(updateSchemaName, requestExample),
      responses: {
        '200': {
          description: `${entity} updated.`,
          content: jsonContent(dataEnvelopeSchema(schemaName), { data: responseExample }),
        },
        ...authenticatedErrorResponses,
        ...extraPutErrorResponses,
      },
    },
    delete: {
      tags: [tag],
      summary: `Delete ${entity}`,
      description: `Soft-deletes one ${entity} for the Patient in the active Tenant.`,
      security: [{ cookieAuth: [] }],
      parameters,
      responses: {
        '204': { description: `${entity} deleted.` },
        ...authenticatedErrorResponses,
      },
    },
  };
};

const globalReferenceCollection = ({
  tag,
  entity,
  schemaName,
  createSchemaName,
  example,
  extraListParameters,
}: {
  tag: string;
  entity: string;
  schemaName: string;
  createSchemaName: string;
  example: unknown;
  extraListParameters?: unknown[];
}) =>
  collectionOperations({
    tag,
    entity,
    summaryEntity: `${entity} Global References`,
    schemaName,
    createSchemaName,
    example,
    extraListParameters,
  });

const appointmentMasterCollection = ({
  tag,
  entity,
  schemaName,
  createSchemaName,
  example,
}: {
  tag: string;
  entity: string;
  schemaName: string;
  createSchemaName: string;
  example: unknown;
}) =>
  collectionOperations({
    tag,
    entity,
    summaryEntity: `${entity} Masters`,
    schemaName,
    createSchemaName,
    example,
    security: [{ cookieAuth: [] }],
    listErrorResponses: authenticatedListErrorResponses,
    mutationErrorResponses: authenticatedErrorResponses,
  });

const stringCodeProperty = (description: string) => ({
  type: 'string',
  minLength: 1,
  maxLength: 10,
  description,
});

const namedCodeCreateSchema = (entityName: string) => ({
  type: 'object',
  required: ['name', 'code'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    code: stringCodeProperty(`${entityName} code. The API normalizes this value to uppercase.`),
  },
});

const namedCodeSchema = (entityName: string) => ({
  allOf: [
    namedCodeCreateSchema(entityName),
    {
      type: 'object',
      required: ['id', 'createdOn', 'modifiedOn'],
      properties: {
        id: { type: 'integer', minimum: 1 },
        createdOn: { type: 'string', format: 'date-time' },
        modifiedOn: { type: 'string', format: 'date-time' },
      },
    },
  ],
});

const appointmentMasterCreateSchema = (entityName: string, nullableDescription = false) => ({
  type: 'object',
  required: ['name', 'code'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    code: stringCodeProperty(`${entityName} code. The API normalizes this value to uppercase.`),
    description: nullableDescription
      ? { type: ['string', 'null'], description: `${entityName} description.` }
      : { type: 'string', description: `${entityName} description.` },
  },
});

const appointmentMasterSchema = (createSchemaName: string) => ({
  allOf: [
    schemaRef(createSchemaName),
    {
      type: 'object',
      required: ['id', 'tenantId', 'name', 'code', 'description', 'createdOn', 'modifiedOn'],
      properties: {
        id: { type: 'integer', minimum: 1 },
        tenantId: {
          type: 'string',
          minLength: 1,
          description: 'Tenant identifier resolved from the active authenticated Session.',
        },
        description: { type: ['string', 'null'] },
        createdOn: { type: 'string', format: 'date-time' },
        modifiedOn: { type: 'string', format: 'date-time' },
      },
    },
  ],
});

const doctorRotaRequestExample = {
  name: 'Morning Rota',
  fromTime: '09:00',
  toTime: '13:00',
};

const doctorScheduleRequestExample = {
  doctorId: 42,
  rotaIds: [1, 2],
  slotInMinute: '00:15',
  slotFromDate: '2026-07-15',
  slotToDate: '2026-07-20',
};

const doctorScheduleExample = {
  id: 11,
  tenantId: 'org_apollo',
  doctorId: 42,
  isActive: true,
  slotFromDate: '2026-07-15',
  slotToDate: '2026-07-20',
  slotInMinute: '00:15',
  slotDurationMinutes: 15,
  rotaDetails: [
    {
      rotaId: 1,
      rotaName: 'Morning Rota',
      rotaTime: '09:00 - 13:00',
      fromTime: '09:00',
      toTime: '13:00',
    },
  ],
  createdOn: '2026-07-14T08:30:00.000Z',
  modifiedOn: '2026-07-14T08:30:00.000Z',
};

const doctorSlotsExample = [
  {
    slotDate: '2026-07-15',
    status: 'Available',
    rotas: [
      {
        doctorRotaId: 1,
        rotaName: 'Morning Rota',
        duration: 15,
        slots: [
          { slot: 1, slotTime: '09:00', slotStatus: 'Available' },
          { slot: 2, slotTime: '09:15', slotStatus: 'Booked' },
        ],
      },
    ],
  },
];

const createAppointmentRequestExample = {
  doctorId: 42,
  appointmentModeId: 1,
  appointmentTypeId: 2,
  appointmentReasonId: 3,
  patientId: 42,
  slotDate: '31-12-2099',
  doctorRotaId: 1,
  slotTimes: ['09:00', '09:15'],
  remarks: 'Patient requested a morning appointment.',
};

const appointmentExample = {
  id: 101,
  tenantId: 'org_apollo',
  bookingNumber: 'APT-1001',
  patient: {
    id: 42,
    mrn: 'MRN-1042',
    firstName: 'Asha',
    lastName: 'Rao',
    phone: '+91-9876543210',
    registrationStatus: 'registered',
  },
  doctor: { id: 42, name: 'Dr. Meera Iyer' },
  appointmentMode: { id: 1, name: 'In Person', code: 'INP' },
  appointmentType: { id: 2, name: 'Consultation', code: 'CONS' },
  appointmentReason: { id: 3, name: 'Follow-up', code: 'FUP' },
  appointmentStatus: { id: 4, name: 'Scheduled', code: 'SCH', category: 'scheduled' },
  slotDate: '31-12-2099',
  rotaName: 'Morning Rota',
  slots: [
    { slotTime: '09:00', status: 'Booked' },
    { slotTime: '09:15', status: 'Booked' },
  ],
  remarks: 'Patient requested a morning appointment.',
  createdOn: '2099-12-01T04:30:00.000Z',
};

const admissionExample = {
  id: 12,
  tenantId: 'org_apollo',
  admissionNumber: 'ADM-1001',
  status: 'ADMITTED',
  admissionReason: 'Chest pain, observation',
  remarks: null,
  expectedDischargeDate: '20-07-2026',
  admittedAt: '2026-07-17T06:15:00.000Z',
  dischargedAt: null,
  dischargeDisposition: null,
  dischargeSummary: null,
  cancelledAt: null,
  cancellationReason: null,
  createdOn: '2026-07-17T06:15:00.000Z',
  modifiedOn: '2026-07-17T06:15:00.000Z',
  patient: {
    id: 42,
    mrn: 'MRN-1042',
    firstName: 'Asha',
    lastName: 'Rao',
    phone: '+91-9876543210',
  },
  doctor: { id: 42, name: 'Dr. Meera Iyer' },
  admissionType: { id: 1, name: 'Emergency', code: 'EMER' },
  bed: { id: 9, bedNumber: 'ICU-01' },
  ward: { id: 3, name: 'ICU', code: 'ICU' },
  visit: { id: 7, visitNumber: 'VST-1001' },
};

const bedExample = {
  id: 9,
  tenantId: 'org_apollo',
  bedNumber: 'ICU-01',
  wardId: 3,
  roomId: 4,
  status: 'AVAILABLE',
  notes: null,
  createdOn: '2026-07-01T08:00:00.000Z',
  modifiedOn: '2026-07-01T08:00:00.000Z',
  ward: { id: 3, name: 'ICU', code: 'ICU' },
  room: { id: 4, roomNumber: '301-A' },
};

const bedBoardExample = [
  {
    wardId: 3,
    wardName: 'ICU',
    wardCode: 'ICU',
    beds: [
      {
        id: 9,
        bedNumber: 'ICU-01',
        status: 'OCCUPIED',
        roomNumber: '301-A',
        occupant: {
          mrn: 'MRN-1042',
          patientId: 42,
          lastName: 'Rao',
          firstName: 'Asha',
          admissionId: 12,
          admissionNumber: 'ADM-1001',
        },
      },
      { id: 10, bedNumber: 'ICU-02', status: 'AVAILABLE', roomNumber: null, occupant: null },
    ],
  },
];

const visitExample = {
  id: 501,
  tenantId: 'org_apollo',
  visitNumber: 'VST-1001',
  status: 'CHECKED_IN',
  visitDate: '16-07-2026',
  queueToken: 7,
  patient: {
    id: 42,
    mrn: 'MRN-1042',
    firstName: 'Asha',
    lastName: 'Rao',
    phone: '+91-9876543210',
  },
  doctor: { id: 42, name: 'Dr. Meera Iyer' },
  visitType: { id: 1, name: 'OPD Consultation', code: 'OPD' },
  appointment: { id: 101, bookingNumber: 'APT-1042' },
  chiefComplaint: 'Fever for 3 days',
  remarks: null,
  checkedInAt: '2026-07-16T04:30:00.000Z',
  consultationStartedAt: null,
  completedAt: null,
  cancelledAt: null,
  cancellationReason: null,
  createdOn: '2026-07-16T04:30:00.000Z',
  modifiedOn: '2026-07-16T04:30:00.000Z',
};

const uploadedVisitDocumentExample = {
  fileName: 'referral.pdf',
  fileUrl:
    'https://abc123.public.blob.vercel-storage.com/tenants/org_apollo/visit-documents/referral-x1y2.pdf',
  contentType: 'application/pdf',
  fileSize: 20480,
};

const visitDocumentExample = {
  id: 88,
  visitId: 501,
  fileName: 'referral.pdf',
  fileUrl:
    'https://abc123.public.blob.vercel-storage.com/tenants/org_apollo/visit-documents/referral-x1y2.pdf',
  contentType: 'application/pdf',
  fileSize: 20480,
  createdOn: '2026-07-16T04:31:00.000Z',
};

const specialtyExample = {
  id: 7,
  tenantId: 'org_apollo',
  name: 'Cardiology',
  code: 'CARD',
  description: 'Diagnosis and treatment of heart and vascular conditions',
  createdOn: '2026-06-30T08:30:00.000Z',
  modifiedOn: '2026-06-30T08:30:00.000Z',
};

const specialtyRequestExample = {
  name: 'Cardiology',
  code: 'card',
  description: 'Diagnosis and treatment of heart and vascular conditions',
};

const specialtyValidationFailed = {
  description: 'Validation failed or the request body is not valid JSON.',
  content: {
    'application/json': {
      schema: { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
      examples: {
        invalidName: {
          summary: 'Missing Specialty name',
          value: {
            message: 'Validation failed',
            errors: ['Specialty name is required'],
          },
        },
        invalidId: {
          summary: 'Invalid Specialty identifier',
          value: {
            message: 'Validation failed',
            errors: ['Specialty abc is Invalid.'],
          },
        },
        invalidJson: {
          summary: 'Malformed JSON request body',
          value: { message: 'Request body must be valid JSON' },
        },
      },
    },
  },
};

const specialtyUnauthorized = {
  description: 'A valid authenticated Session is required.',
  content: jsonContent(schemaRef('UnauthorizedError'), { message: 'Unauthorized' }),
};

const specialtyForbidden = {
  description:
    'No active Tenant is selected, or the authenticated member lacks Tenant Admin authority for a mutation.',
  content: {
    'application/json': {
      schema: schemaRef('ForbiddenError'),
      examples: {
        noActiveTenant: {
          summary: 'No active Tenant selected',
          value: { message: 'No active tenant selected.' },
        },
        tenantAdminRequired: {
          summary: 'Tenant Admin authority required',
          value: { message: 'Forbidden' },
        },
      },
    },
  },
};

const specialtyNotFound = {
  description: 'Specialty was not found in the active Tenant.',
  content: jsonContent(schemaRef('NotFoundError'), {
    message: 'Specialty not found',
    errors: ['Specialty not found'],
  }),
};

const specialtyConflict = {
  description: 'Specialty name or non-null code already exists in the active Tenant.',
  content: {
    'application/json': {
      schema: schemaRef('ConflictError'),
      examples: {
        duplicateName: {
          summary: 'Duplicate Specialty name',
          value: {
            message: 'Specialty name Cardiology already exists.',
            errors: ['Specialty name Cardiology already exists.'],
          },
        },
        duplicateCode: {
          summary: 'Duplicate normalized Specialty code',
          value: {
            message: 'Specialty code CARD already exists.',
            errors: ['Specialty code CARD already exists.'],
          },
        },
      },
    },
  },
};

const specialtyReadErrorResponses = {
  '400': specialtyValidationFailed,
  '401': specialtyUnauthorized,
  '403': specialtyForbidden,
  '404': specialtyNotFound,
  '500': responseRef('InternalServerError'),
};

const specialtyMutationErrorResponses = {
  ...specialtyReadErrorResponses,
  '409': specialtyConflict,
};

const doctorRequestExample = {
  name: 'Anita Mehta',
  email: 'anita.mehta@apollo.example',
  password: 'StrongerPass123',
  gender: 'Female',
  dateOfBirth: '1985-04-12',
  staffCode: 'DOC-1042',
  designation: 'Consultant Cardiologist',
  specialtyId: 7,
  registrationNumber: 'TN-MED-558211',
  qualifications: 'MBBS, MD, DM Cardiology',
};

const doctorExample = {
  id: 42,
  userId: 'usr_anita_mehta',
  tenantId: 'org_apollo',
  name: doctorRequestExample.name,
  email: doctorRequestExample.email,
  phone: null,
  gender: doctorRequestExample.gender,
  dateOfBirth: doctorRequestExample.dateOfBirth,
  staffCode: doctorRequestExample.staffCode,
  designation: doctorRequestExample.designation,
  specialtyId: doctorRequestExample.specialtyId,
  specialtyName: 'Cardiology',
  registrationNumber: doctorRequestExample.registrationNumber,
  qualifications: doctorRequestExample.qualifications,
  isActive: true,
  createdOn: '2026-07-07T08:30:00.000Z',
  modifiedOn: '2026-07-07T08:30:00.000Z',
};

const doctorValidationFailed = {
  description: 'Doctor validation failed or the request body is not valid JSON.',
  content: {
    'application/json': {
      schema: { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
      examples: {
        missingSpecialty: {
          summary: 'Missing required Specialty',
          value: { message: 'Validation failed', errors: ['Specialty is required.'] },
        },
        invalidSpecialty: {
          summary: 'Specialty is not in the active Tenant',
          value: { message: 'Validation failed', errors: ['Specialty 999 is Invalid.'] },
        },
        invalidId: {
          summary: 'Invalid Doctor identifier',
          value: { message: 'Validation failed', errors: ['Doctor abc is Invalid.'] },
        },
        invalidJson: {
          summary: 'Malformed JSON request body',
          value: { message: 'Request body must be valid JSON' },
        },
      },
    },
  },
};

const doctorNotFound = {
  description: 'Doctor was not found in the active Tenant.',
  content: jsonContent(schemaRef('NotFoundError'), {
    message: 'Doctor not found',
    errors: ['Doctor not found'],
  }),
};

const doctorConflict = {
  description: 'Doctor email, registration number, or Staff code conflicts with an active record.',
  content: {
    'application/json': {
      schema: schemaRef('ConflictError'),
      examples: {
        duplicateEmail: {
          summary: 'Email already belongs to Staff',
          value: {
            message: 'A Staff member with this email already exists.',
            errors: ['A Staff member with this email already exists.'],
          },
        },
        duplicateRegistration: {
          summary: 'Registration number already exists',
          value: {
            message: 'Doctor registration number TN-MED-558211 already exists.',
            errors: ['Doctor registration number TN-MED-558211 already exists.'],
          },
        },
      },
    },
  },
};

const doctorReadErrorResponses = {
  '400': doctorValidationFailed,
  '401': specialtyUnauthorized,
  '403': specialtyForbidden,
  '404': doctorNotFound,
  '500': responseRef('InternalServerError'),
};

const doctorMutationErrorResponses = {
  ...doctorReadErrorResponses,
  '409': doctorConflict,
};

const assetCategoryExample = {
  id: 1,
  tenantId: 'org_apollo',
  name: 'Diagnostic Imaging',
  code: 'IMG',
  color: '#2563EB',
  description: 'Radiology and imaging equipment',
  createdOn: '2026-06-23T04:00:00.000Z',
  modifiedOn: '2026-06-23T04:00:00.000Z',
};

const assetCategoryRequestExample = {
  name: 'Diagnostic Imaging',
  code: 'img',
  color: '#2563EB',
  description: 'Radiology and imaging equipment',
};

const assetCategoryValidationFailed = {
  description: 'Validation failed or the request body is not valid JSON.',
  content: jsonContent(
    { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
    {
      message: 'Validation failed',
      errors: ['Asset category color must be a hex value like #2563EB.'],
    }
  ),
};

const assetCategoryNotFound = {
  description: 'Asset Category was not found in the active Tenant.',
  content: jsonContent(schemaRef('NotFoundError'), {
    message: 'Asset category not found',
    errors: ['Asset category not found'],
  }),
};

const assetCategoryConflict = {
  description: 'Asset Category name or code already exists in the active Tenant.',
  content: jsonContent(schemaRef('ConflictError'), {
    message: "Asset category name 'Diagnostic Imaging' already exists.",
    errors: ["Asset category name 'Diagnostic Imaging' already exists."],
  }),
};

const assetCategoryErrorResponses = {
  '400': assetCategoryValidationFailed,
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '404': assetCategoryNotFound,
  '409': assetCategoryConflict,
  '500': responseRef('InternalServerError'),
};

const assetStatusExample = {
  id: 1,
  tenantId: 'org_apollo',
  name: 'In Use',
  code: 'INUSE',
  color: '#16A34A',
  description: 'Asset is currently assigned and operational',
  createdOn: '2026-06-23T04:00:00.000Z',
  modifiedOn: '2026-06-23T04:00:00.000Z',
};

const assetStatusRequestExample = {
  name: 'In Use',
  code: 'inuse',
  color: '#16A34A',
  description: 'Asset is currently assigned and operational',
};

const assetStatusValidationFailed = {
  description: 'Validation failed or the request body is not valid JSON.',
  content: jsonContent(
    { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
    {
      message: 'Validation failed',
      errors: ['Asset status color must be a hex value like #16A34A.'],
    }
  ),
};

const assetStatusNotFound = {
  description: 'Asset Status was not found in the active Tenant.',
  content: jsonContent(schemaRef('NotFoundError'), {
    message: 'Asset status not found',
    errors: ['Asset status not found'],
  }),
};

const assetStatusConflict = {
  description: 'Asset Status name or code already exists in the active Tenant.',
  content: jsonContent(schemaRef('ConflictError'), {
    message: "Asset status name 'In Use' already exists.",
    errors: ["Asset status name 'In Use' already exists."],
  }),
};

const assetStatusErrorResponses = {
  '400': assetStatusValidationFailed,
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '404': assetStatusNotFound,
  '409': assetStatusConflict,
  '500': responseRef('InternalServerError'),
};

const assetConditionExample = {
  id: 1,
  tenantId: 'org_apollo',
  name: 'Excellent',
  code: 'EXC',
  color: '#16A34A',
  description: 'Asset is in excellent physical condition',
  createdOn: '2026-06-23T04:00:00.000Z',
  modifiedOn: '2026-06-23T04:00:00.000Z',
};

const assetConditionRequestExample = {
  name: 'Excellent',
  code: 'exc',
  color: '#16A34A',
  description: 'Asset is in excellent physical condition',
};

const assetConditionValidationFailed = {
  description: 'Validation failed or the request body is not valid JSON.',
  content: jsonContent(
    { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
    {
      message: 'Validation failed',
      errors: ['Asset condition color must be a hex value like #16A34A.'],
    }
  ),
};

const assetConditionNotFound = {
  description: 'Asset Condition was not found in the active Tenant.',
  content: jsonContent(schemaRef('NotFoundError'), {
    message: 'Asset condition not found',
    errors: ['Asset condition not found'],
  }),
};

const assetConditionConflict = {
  description: 'Asset Condition name or code already exists in the active Tenant.',
  content: jsonContent(schemaRef('ConflictError'), {
    message: "Asset condition name 'Excellent' already exists.",
    errors: ["Asset condition name 'Excellent' already exists."],
  }),
};

const assetConditionErrorResponses = {
  '400': assetConditionValidationFailed,
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '404': assetConditionNotFound,
  '409': assetConditionConflict,
  '500': responseRef('InternalServerError'),
};

const workOrderTypeExample = {
  id: 1,
  tenantId: 'org_apollo',
  name: 'Preventive',
  code: 'PREV',
  color: '#2563EB',
  description: 'Planned preventive maintenance work',
  createdOn: '2026-06-23T04:00:00.000Z',
  modifiedOn: '2026-06-23T04:00:00.000Z',
};

const workOrderTypeRequestExample = {
  name: 'Preventive',
  code: 'prev',
  color: '#2563EB',
  description: 'Planned preventive maintenance work',
};

const workOrderTypeValidationFailed = {
  description: 'Validation failed or the request body is not valid JSON.',
  content: jsonContent(
    { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
    {
      message: 'Validation failed',
      errors: ['Work order type color must be a hex value like #16A34A.'],
    }
  ),
};

const workOrderTypeNotFound = {
  description: 'Work Order Type was not found in the active Tenant.',
  content: jsonContent(schemaRef('NotFoundError'), {
    message: 'Work order type not found',
    errors: ['Work order type not found'],
  }),
};

const workOrderTypeConflict = {
  description:
    'Work Order Type name/code already exists, or the Type is referenced by a non-deleted Work Order.',
  content: {
    'application/json': {
      schema: schemaRef('ConflictError'),
      examples: {
        duplicateName: {
          value: {
            message: "Work order type name 'Preventive' already exists.",
            errors: ["Work order type name 'Preventive' already exists."],
          },
        },
        inUse: {
          value: {
            message: 'Work order type cannot be deleted while it is in use.',
            errors: ['Work order type cannot be deleted while it is in use.'],
          },
        },
      },
    },
  },
};

const workOrderTypeErrorResponses = {
  '400': workOrderTypeValidationFailed,
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '404': workOrderTypeNotFound,
  '409': workOrderTypeConflict,
  '500': responseRef('InternalServerError'),
};

const roomTypeExample = {
  id: 1,
  tenantId: 'org_apollo',
  name: 'Private Room',
  code: 'PVT',
  color: '#2563EB',
  dailyRate: 4500,
  description: 'Single-occupancy room with an attached bathroom',
  createdOn: '2026-06-23T04:00:00.000Z',
  modifiedOn: '2026-06-23T04:00:00.000Z',
};

const roomTypeRequestExample = {
  name: 'Private Room',
  code: 'pvt',
  color: '#2563EB',
  dailyRate: 4500,
  description: 'Single-occupancy room with an attached bathroom',
};

const roomTypeValidationFailed = {
  description: 'Validation failed or the request body is not valid JSON.',
  content: jsonContent(
    { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
    {
      message: 'Validation failed',
      errors: ['Room type color must be a hex value like #2563EB.'],
    }
  ),
};

const roomTypeNotFound = {
  description: 'Room Type was not found in the active Tenant.',
  content: jsonContent(schemaRef('NotFoundError'), {
    message: 'Room type not found',
    errors: ['Room type not found'],
  }),
};

const roomTypeConflict = {
  description:
    'Room Type name/code already exists in the active Tenant, or the Room Type still has Rooms assigned to it.',
  content: {
    'application/json': {
      schema: schemaRef('ConflictError'),
      examples: {
        duplicateName: {
          value: {
            message: "Room type name 'Private Room' already exists.",
            errors: ["Room type name 'Private Room' already exists."],
          },
        },
        duplicateCode: {
          value: {
            message: "Room type code 'PVT' already exists.",
            errors: ["Room type code 'PVT' already exists."],
          },
        },
        inUse: {
          value: {
            message: 'Room type cannot be deleted while Rooms are assigned to it.',
            errors: ['Room type cannot be deleted while Rooms are assigned to it.'],
          },
        },
      },
    },
  },
};

const roomTypeErrorResponses = {
  '400': roomTypeValidationFailed,
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '404': roomTypeNotFound,
  '409': roomTypeConflict,
  '500': responseRef('InternalServerError'),
};

const roomExample = {
  id: 1,
  tenantId: 'org_apollo',
  roomNumber: '101-A',
  roomTypeId: 1,
  status: 'AVAILABLE',
  bedCount: 2,
  floor: '1',
  wing: 'East',
  facility: 'Apollo Main Hospital',
  department: 'Cardiology',
  notes: 'Corner room with a window',
  roomType: {
    id: 1,
    name: 'Private Room',
    code: 'PVT',
    color: '#2563EB',
    dailyRate: 4500,
  },
  createdOn: '2026-06-23T04:00:00.000Z',
  modifiedOn: '2026-06-23T04:00:00.000Z',
};

const roomRequestExample = {
  roomNumber: '101-A',
  roomTypeId: 1,
  status: 'AVAILABLE',
  bedCount: 2,
  floor: '1',
  wing: 'East',
  facility: 'Apollo Main Hospital',
  department: 'Cardiology',
  notes: 'Corner room with a window',
};

const roomSummaryExample = {
  totalRooms: 42,
  totalBeds: 96,
  availableRooms: 18,
  occupancyRate: 45.2,
  byStatus: [
    { status: 'AVAILABLE', count: 18 },
    { status: 'CLEANING', count: 3 },
    { status: 'MAINTENANCE', count: 2 },
    { status: 'OCCUPIED', count: 19 },
  ],
  byType: [
    { roomTypeId: 1, name: 'Private Room', color: '#2563EB', count: 24 },
    { roomTypeId: 2, name: 'General Ward', color: '#16A34A', count: 18 },
  ],
};

const roomValidationFailed = {
  description: 'Validation failed or the request body is not valid JSON.',
  content: jsonContent(
    { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
    {
      message: 'Validation failed',
      errors: ['Room status must be one of AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, CLEANING'],
    }
  ),
};

const roomNotFound = {
  description: 'Room was not found in the active Tenant.',
  content: jsonContent(schemaRef('NotFoundError'), {
    message: 'Room not found',
    errors: ['Room not found'],
  }),
};

const roomConflict = {
  description:
    'Room number already exists in the active Tenant, the referenced Room Type is invalid, or the Room is occupied.',
  content: {
    'application/json': {
      schema: schemaRef('ConflictError'),
      examples: {
        duplicateRoomNumber: {
          value: {
            message: "Room number '101-A' already exists.",
            errors: ["Room number '101-A' already exists."],
          },
        },
        invalidRoomType: {
          value: {
            message: 'Room type 99 is Invalid.',
            errors: ['Room type 99 is Invalid.'],
          },
        },
        occupied: {
          value: {
            message: 'Room cannot be deleted while it is occupied.',
            errors: ['Room cannot be deleted while it is occupied.'],
          },
        },
      },
    },
  },
};

const roomErrorResponses = {
  '400': roomValidationFailed,
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '404': roomNotFound,
  '409': roomConflict,
  '500': responseRef('InternalServerError'),
};

const workOrderPriorityExample = {
  id: 1,
  tenantId: 'org_apollo',
  name: 'Critical',
  code: 'CRIT',
  color: '#DC2626',
  description: 'Urgent maintenance work requiring immediate attention',
  createdOn: '2026-06-23T04:00:00.000Z',
  modifiedOn: '2026-06-23T04:00:00.000Z',
};

const workOrderPriorityRequestExample = {
  name: 'Critical',
  code: 'crit',
  color: '#DC2626',
  description: 'Urgent maintenance work requiring immediate attention',
};

const workOrderPriorityValidationFailed = {
  description: 'Validation failed or the request body is not valid JSON.',
  content: jsonContent(
    { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
    {
      message: 'Validation failed',
      errors: ['Work order priority color must be a hex value like #16A34A.'],
    }
  ),
};

const workOrderPriorityNotFound = {
  description: 'Work Order Priority was not found in the active Tenant.',
  content: jsonContent(schemaRef('NotFoundError'), {
    message: 'Work order priority not found',
    errors: ['Work order priority not found'],
  }),
};

const workOrderPriorityConflict = {
  description:
    'Work Order Priority name/code already exists, or the Priority is referenced by a non-deleted Work Order.',
  content: {
    'application/json': {
      schema: schemaRef('ConflictError'),
      examples: {
        duplicateName: {
          value: {
            message: "Work order priority name 'Critical' already exists.",
            errors: ["Work order priority name 'Critical' already exists."],
          },
        },
        inUse: {
          value: {
            message: 'Work order priority cannot be deleted while it is in use.',
            errors: ['Work order priority cannot be deleted while it is in use.'],
          },
        },
      },
    },
  },
};

const workOrderPriorityErrorResponses = {
  '400': workOrderPriorityValidationFailed,
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '404': workOrderPriorityNotFound,
  '409': workOrderPriorityConflict,
  '500': responseRef('InternalServerError'),
};

const workOrderStatusExample = {
  id: 1,
  tenantId: 'org_apollo',
  name: 'In Progress',
  code: 'INPROG',
  category: 'IN_PROGRESS',
  color: '#2563EB',
  description: 'Maintenance work is actively underway',
  isSystem: true,
  createdOn: '2026-06-27T04:00:00.000Z',
  modifiedOn: '2026-06-27T04:00:00.000Z',
};

const workOrderStatusRequestExample = {
  name: 'In Progress',
  code: 'inprog',
  category: 'IN_PROGRESS',
  color: '#2563EB',
  description: 'Maintenance work is actively underway',
};

const workOrderStatusValidationFailed = {
  description: 'Validation failed or the request body is not valid JSON.',
  content: jsonContent(
    { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
    {
      message: 'Validation failed',
      errors: ['Work order status color must be a hex value like #16A34A.'],
    }
  ),
};

const workOrderStatusNotFound = {
  description: 'Work Order Status was not found in the active Tenant.',
  content: jsonContent(schemaRef('NotFoundError'), {
    message: 'Work order status not found',
    errors: ['Work order status not found'],
  }),
};

const workOrderStatusConflict = {
  description:
    'Work Order Status name/code conflicts with an active status, the mutation targets protected System Work Order Status state, or a non-deleted Work Order prevents category change/deletion.',
  content: {
    'application/json': {
      schema: schemaRef('ConflictError'),
      examples: {
        duplicateName: {
          summary: 'Duplicate status name',
          value: {
            message: "Work order status name 'In Progress' already exists.",
            errors: ["Work order status name 'In Progress' already exists."],
          },
        },
        immutableSystemCode: {
          summary: 'System status code is immutable',
          value: {
            message: 'System work order status code cannot be changed.',
            errors: ['System work order status code cannot be changed.'],
          },
        },
        immutableSystemCategory: {
          summary: 'System status category is immutable',
          value: {
            message: 'System work order status category cannot be changed.',
            errors: ['System work order status category cannot be changed.'],
          },
        },
        protectedSystemStatus: {
          summary: 'System status cannot be deleted',
          value: {
            message: 'System work order status cannot be deleted.',
            errors: ['System work order status cannot be deleted.'],
          },
        },
        inUseCategory: {
          summary: 'In-use status category cannot change',
          value: {
            message: 'Work order status category cannot be changed while the status is in use.',
            errors: ['Work order status category cannot be changed while the status is in use.'],
          },
        },
        inUseDelete: {
          summary: 'In-use status cannot be deleted',
          value: {
            message: 'Work order status cannot be deleted while it is in use.',
            errors: ['Work order status cannot be deleted while it is in use.'],
          },
        },
      },
    },
  },
};

const workOrderStatusErrorResponses = {
  '400': workOrderStatusValidationFailed,
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '404': workOrderStatusNotFound,
  '409': workOrderStatusConflict,
  '500': responseRef('InternalServerError'),
};

const assetMasterSummaryExample = {
  id: 1,
  name: 'Diagnostic Imaging',
  color: '#2563EB',
};

const assetExample = {
  id: 1,
  tenantId: 'org_apollo',
  name: 'MRI Scanner 1.5T',
  categoryId: 1,
  statusId: 2,
  conditionId: 3,
  manufacturer: 'Siemens Healthineers',
  model: 'MAGNETOM Sola',
  serialNumber: 'SN-MG-88421',
  facility: 'Apollo Main Hospital',
  department: 'Radiology',
  location: 'Radiology Wing - MRI Suite 2',
  custodian: 'Dr. Kavya Menon',
  purchaseDate: '2024-02-15',
  warrantyExpiry: '2029-02-14',
  cost: 1450000,
  currentValue: 1325000,
  lastServiceDate: '2026-05-20',
  nextServiceDate: '2026-08-20',
  calibrationDate: '2026-05-20',
  category: assetMasterSummaryExample,
  status: {
    id: 2,
    name: 'In Use',
    color: '#16A34A',
  },
  condition: {
    id: 3,
    name: 'Excellent',
    color: '#16A34A',
  },
  createdOn: '2026-06-24T04:00:00.000Z',
  modifiedOn: '2026-06-24T04:00:00.000Z',
};

const assetRequestExample = {
  name: 'MRI Scanner 1.5T',
  categoryId: 1,
  statusId: 2,
  conditionId: 3,
  manufacturer: 'Siemens Healthineers',
  model: 'MAGNETOM Sola',
  serialNumber: 'SN-MG-88421',
  facility: 'Apollo Main Hospital',
  department: 'Radiology',
  location: 'Radiology Wing - MRI Suite 2',
  custodian: 'Dr. Kavya Menon',
  purchaseDate: '2024-02-15',
  warrantyExpiry: '2029-02-14',
  cost: 1450000,
  currentValue: 1325000,
  lastServiceDate: '2026-05-20',
  nextServiceDate: '2026-08-20',
  calibrationDate: '2026-05-20',
};

const assetValidationFailed = {
  description: 'Validation failed or the request body is not valid JSON.',
  content: jsonContent(
    { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
    {
      message: 'Validation failed',
      errors: ['Asset name cannot be empty'],
    }
  ),
};

const assetNotFound = {
  description: 'Asset was not found in the active Tenant.',
  content: jsonContent(schemaRef('NotFoundError'), {
    message: 'Asset not found',
    errors: ['Asset not found'],
  }),
};

const assetConflict = {
  description:
    'Asset serial number already exists, a referenced Asset Master does not exist in the active Tenant, or the Asset has Active Work Orders.',
  content: {
    'application/json': {
      schema: schemaRef('ConflictError'),
      examples: {
        duplicateSerialNumber: {
          summary: 'Duplicate serial number',
          value: {
            message: "Asset serial number 'SN-MG-88421' already exists.",
            errors: ["Asset serial number 'SN-MG-88421' already exists."],
          },
        },
        invalidReference: {
          summary: 'Invalid Asset Master reference',
          value: {
            message: 'Asset category 999 is Invalid.',
            errors: ['Asset category 999 is Invalid.'],
          },
        },
        activeWorkOrders: {
          summary: 'Asset has Active Work Orders',
          value: {
            message: 'Asset cannot be deleted while it has active work orders.',
            errors: ['Asset cannot be deleted while it has active work orders.'],
          },
        },
      },
    },
  },
};

const assetErrorResponses = {
  '400': assetValidationFailed,
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '404': assetNotFound,
  '409': assetConflict,
  '500': responseRef('InternalServerError'),
};

const patientRequestExample = {
  firstName: 'Asha',
  middleName: 'Kiran',
  lastName: 'Rao',
  gender: 'female',
  dateOfBirth: '1990-05-14',
  bloodGroup: 'B+',
  maritalStatus: 'married',
  preferredPaymentMethod: 'insurance',
  phone: '+91-9876543210',
  alternatePhone: '+91-9123456780',
  email: 'asha.rao@example.com',
  addressLine1: '221B Residency Road',
  addressLine2: 'Near City Hospital',
  city: 'Bengaluru',
  stateId: 5,
  countryId: 1,
  postalCode: '560025',
  nationalityId: 1,
  languageId: 2,
  religionId: 3,
  govtIdType: 'passport',
  govtIdNumber: 'N1234567',
  emergencyContactName: 'Kiran Rao',
  emergencyContactRelationship: 'Spouse',
  emergencyContactPhone: '+91-9988776655',
};

const patientExample = {
  id: 42,
  tenantId: 'org_apollo',
  mrn: 'MRN-1042',
  ...patientRequestExample,
  registrationStatus: 'registered',
  state: { id: 5, name: 'Karnataka' },
  country: { id: 1, name: 'India', code: 'IN' },
  nationality: { id: 1, name: 'Indian' },
  language: { id: 2, name: 'Kannada' },
  religion: { id: 3, name: 'Hindu' },
  isActive: true,
  createdOn: '2026-06-24T04:00:00.000Z',
  modifiedOn: '2026-06-24T04:00:00.000Z',
};

const patientAllergyExample = {
  id: 7,
  tenantId: 'org_apollo',
  patientId: 42,
  allergenId: 12,
  substance: null,
  reaction: 'Hives and facial swelling',
  severity: 'severe',
  status: 'active',
  notedOn: '2026-03-01',
  notes: 'Reaction documented during intake.',
  recordedByUserId: 'user_9f3',
  createdOn: '2026-03-01T09:30:00.000Z',
  modifiedOn: '2026-03-01T09:30:00.000Z',
};

const patientProblemExample = {
  id: 3,
  tenantId: 'org_apollo',
  patientId: 42,
  diagnosisCodeId: 5,
  title: 'Essential (primary) hypertension',
  clinicalStatus: 'active',
  onsetDate: '2025-11-15',
  resolvedDate: null,
  notes: null,
  recordedByUserId: 'user_9f3',
  createdOn: '2025-11-15T10:00:00.000Z',
  modifiedOn: '2025-11-15T10:00:00.000Z',
};

const patientVitalSignExample = {
  id: 15,
  tenantId: 'org_apollo',
  patientId: 42,
  visitId: null,
  admissionId: null,
  recordedAt: '2026-03-01T09:30:00.000Z',
  heightCm: 170,
  weightKg: 70,
  bmi: 24.2,
  systolic: 120,
  diastolic: 80,
  pulseBpm: 72,
  respRate: 16,
  temperatureC: 36.8,
  spo2: 98,
  painScore: 2,
  notes: null,
  recordedByUserId: 'user_9f3',
  createdOn: '2026-03-01T09:30:00.000Z',
  modifiedOn: '2026-03-01T09:30:00.000Z',
};

const patientMedicationExample = {
  id: 21,
  tenantId: 'org_apollo',
  patientId: 42,
  drugName: 'Metformin',
  dose: '500 mg',
  route: 'oral',
  frequency: 'BID',
  status: 'active',
  startDate: '2026-01-10',
  endDate: null,
  notes: null,
  recordedByUserId: 'user_9f3',
  createdOn: '2026-01-10T08:00:00.000Z',
  modifiedOn: '2026-01-10T08:00:00.000Z',
};

const clinicalNoteExample = {
  id: 31,
  tenantId: 'org_apollo',
  patientId: 42,
  visitId: null,
  admissionId: null,
  noteTypeId: 3,
  subjective: 'Patient reports a productive cough for three days with mild fever.',
  objective: 'Temp 37.8C, chest clear on auscultation, throat mildly erythematous.',
  assessment: 'Acute upper respiratory infection.',
  plan: 'Supportive care, fluids, paracetamol as needed. Review in 5 days if not improving.',
  status: 'draft',
  signedAt: null,
  authorUserId: 'user_9f3',
  recordedByUserId: 'user_9f3',
  createdOn: '2026-03-01T09:45:00.000Z',
  modifiedOn: '2026-03-01T09:45:00.000Z',
};

const signedClinicalNoteExample = {
  ...clinicalNoteExample,
  status: 'signed',
  signedAt: '2026-03-01T10:15:00.000Z',
  modifiedOn: '2026-03-01T10:15:00.000Z',
};

const patientValidationFailed = {
  description: 'Validation failed or the request body is not valid JSON.',
  content: {
    'application/json': {
      schema: { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
      examples: {
        missingRequiredField: {
          summary: 'Missing a required Patient field',
          value: {
            message: 'Validation failed',
            errors: ['Patient first name is required'],
          },
        },
        futureDateOfBirth: {
          summary: 'Date of birth in the future',
          value: {
            message: 'Validation failed',
            errors: ['Date of birth must not be in the future'],
          },
        },
        govtIdPairing: {
          summary: 'Government ID type and number not provided together',
          value: {
            message: 'Validation failed',
            errors: ['Patient government ID type and number must be provided together'],
          },
        },
        invalidId: {
          summary: 'Invalid Patient identifier',
          value: {
            message: 'Validation failed',
            errors: ['Patient abc is Invalid.'],
          },
        },
        invalidJson: {
          summary: 'Malformed JSON request body',
          value: { message: 'Request body must be valid JSON' },
        },
      },
    },
  },
};

const patientNotFound = {
  description: 'Patient was not found in the active Tenant.',
  content: jsonContent(schemaRef('NotFoundError'), {
    message: 'Patient not found',
    errors: ['Patient not found'],
  }),
};

const patientConflict = {
  description:
    'Patient government ID already exists in the active Tenant, or a referenced State, Country, Nationality, Language, or Religion is invalid.',
  content: {
    'application/json': {
      schema: schemaRef('ConflictError'),
      examples: {
        duplicateGovtId: {
          summary: 'Duplicate government ID',
          value: {
            message: 'Patient government ID N1234567 already exists.',
            errors: ['Patient government ID N1234567 already exists.'],
          },
        },
        invalidReference: {
          summary: 'Invalid Global Reference',
          value: {
            message: 'Patient nationality 999 is Invalid.',
            errors: ['Patient nationality 999 is Invalid.'],
          },
        },
        stateCountryMismatch: {
          summary: 'State does not belong to the given Country',
          value: {
            message: 'Patient state 5 does not belong to country 2.',
            errors: ['Patient state 5 does not belong to country 2.'],
          },
        },
      },
    },
  },
};

const patientErrorResponses = {
  '400': patientValidationFailed,
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '404': patientNotFound,
  '409': patientConflict,
  '500': responseRef('InternalServerError'),
};

const workOrderExample = {
  id: 43,
  tenantId: 'org_apollo',
  code: 'WO-1043',
  assetId: 1,
  typeId: 1,
  priorityId: 2,
  statusId: 1,
  technician: 'Vendor (Lumenis)',
  dueDate: '2026-07-04',
  completedOn: null,
  note: 'Beam alignment fault — awaiting OEM engineer.',
  type: { id: 1, name: 'Corrective', color: '#DC2626' },
  priority: { id: 2, name: 'Critical', color: '#DC2626' },
  status: { id: 1, name: 'Open', category: 'OPEN', color: '#2563EB' },
  asset: {
    id: 1,
    name: 'Surgical Laser',
    model: 'AcuPulse',
    serialNumber: 'SN-LS-90014',
  },
  createdOn: '2026-06-27T10:30:00.000Z',
  modifiedOn: '2026-06-27T10:30:00.000Z',
};

const workOrderRequestExample = {
  assetId: 1,
  typeId: 1,
  priorityId: 2,
  statusId: 1,
  technician: 'Vendor (Lumenis)',
  dueDate: '2026-07-04',
  note: 'Beam alignment fault — awaiting OEM engineer.',
};

const workOrderValidationFailed = {
  description: 'Validation failed or the request body is not valid JSON.',
  content: jsonContent(
    { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
    {
      message: 'Validation failed',
      errors: ['Work order asset ID is required'],
    }
  ),
};

const workOrderConflict = {
  description: 'A referenced Asset or Work Order Master is not active in the current Tenant.',
  content: {
    'application/json': {
      schema: schemaRef('ConflictError'),
      examples: {
        invalidStatus: {
          summary: 'Invalid Work Order Status reference',
          value: {
            message: 'Work order status 999 is Invalid.',
            errors: ['Work order status 999 is Invalid.'],
          },
        },
        invalidAsset: {
          summary: 'Invalid Asset reference',
          value: {
            message: 'Asset 999 is Invalid.',
            errors: ['Asset 999 is Invalid.'],
          },
        },
      },
    },
  },
};

const invoiceResponseExample = {
  id: 42,
  tenantId: 'org_apollo',
  invoiceNumber: 'INV-1042',
  status: 'FINALIZED',
  subtotal: 15500,
  discountAmount: 500,
  grandTotal: 15000,
  amountPaid: 5000,
  balanceDue: 10000,
  notes: null,
  finalizedAt: '2026-07-18T09:30:00.000Z',
  voidedAt: null,
  voidReason: null,
  createdOn: '2026-07-18T09:00:00.000Z',
  modifiedOn: '2026-07-18T09:30:00.000Z',
  patient: { id: 7, mrn: 'MRN-0007', firstName: 'Asha', lastName: 'Rao' },
  visit: null,
  admission: { id: 9, admissionNumber: 'ADM-1001' },
  lines: [
    {
      id: 1,
      invoiceId: 42,
      chargeItemId: 3,
      description: 'General Consultation',
      quantity: 1,
      unitPrice: 500,
      amount: 500,
      source: 'MANUAL',
    },
    {
      id: 2,
      invoiceId: 42,
      chargeItemId: null,
      description: 'Bed charges — ICU-01 (ICU), 3 days @ 5000.00',
      quantity: 3,
      unitPrice: 5000,
      amount: 15000,
      source: 'BED_AUTO',
    },
  ],
  payments: [
    {
      id: 1,
      invoiceId: 42,
      receiptNumber: 'RCP-2010',
      amount: 5000,
      method: 'UPI',
      reference: 'UPI-8842013',
      notes: null,
      receivedAt: '2026-07-18T09:31:00.000Z',
    },
  ],
};

const invoiceListItemExample = {
  id: 42,
  invoiceNumber: 'INV-1042',
  status: 'FINALIZED',
  grandTotal: 15000,
  amountPaid: 5000,
  balanceDue: 10000,
  createdOn: '2026-07-18T09:00:00.000Z',
  patient: { id: 7, mrn: 'MRN-0007', firstName: 'Asha', lastName: 'Rao' },
  visit: null,
  admission: { id: 9, admissionNumber: 'ADM-1001' },
};

const paymentResponseExample = invoiceResponseExample.payments[0];

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'EMR App Router API',
    version: '1.0.0',
    description:
      'OpenAPI document for the EMR Next.js App Router API. A Tenant owns Facilities, configures tenant-scoped Masters, and uses shared Global Reference data.',
  },
  servers: [{ url: '/', description: 'Current deployment' }],
  tags: [
    {
      name: 'Authentication',
      description: 'Public sign-in and sign-out APIs for Session lifecycle.',
    },
    {
      name: 'Tenant Provisioning',
      description:
        'Public signup API that provisions a Tenant and Tenant Owner, plus the session-scoped Tenant Onboarding API that installs baseline defaults.',
    },
    { name: 'Tenant', description: 'Tenant management APIs.' },
    { name: 'Staff', description: 'Staff user management APIs for Tenant Admins.' },
    { name: 'Session', description: 'Authenticated user Session management APIs.' },
    {
      name: 'Current User',
      description: 'Identity, Tenant context, and Effective Permissions of the authenticated user.',
    },
    { name: 'Role', description: 'Role management APIs for Tenant Admins.' },
    {
      name: 'Role Assignment',
      description: 'Staff Role Assignment APIs for Tenant Admins.',
    },
    {
      name: 'Permission Assignment',
      description: 'Role Permission Assignment APIs for Tenant Admins.',
    },
    {
      name: 'Permission',
      description: 'Read-only Permission Catalogue APIs for Tenant Admins.',
    },
    { name: 'Global Reference', description: 'Global Reference APIs shared by all Tenants.' },
    { name: 'Appointment Type', description: 'Appointment Type Master APIs.' },
    { name: 'Appointment Reason', description: 'Appointment Reason Master APIs.' },
    { name: 'Appointment Mode', description: 'Appointment Mode Master APIs.' },
    { name: 'Appointment Status', description: 'Appointment Status Master APIs.' },
    { name: 'Visit Type', description: 'Visit Type Master APIs.' },
    { name: 'Visit', description: 'Tenant-scoped Visit check-in, queue, and lifecycle APIs.' },
    { name: 'Ward', description: 'Ward Master APIs.' },
    { name: 'Bed', description: 'Tenant-scoped Bed registry and Bed Board APIs.' },
    { name: 'Admission Type', description: 'Admission Type Master APIs.' },
    {
      name: 'Admission',
      description: 'Tenant-scoped inpatient Admission, transfer, and discharge APIs.',
    },
    {
      name: 'Charge Item',
      description: 'Tenant-scoped Charge Item (billable service) Master APIs.',
    },
    {
      name: 'Invoice',
      description:
        'Tenant-scoped Invoice lifecycle, line items, discounts, and Bed-Day Charge generation APIs.',
    },
    {
      name: 'Payment',
      description: 'Tenant-scoped, append-only Payment recording APIs against Invoices.',
    },
    { name: 'Specialty', description: 'Tenant-scoped Specialty Master APIs.' },
    { name: 'Doctor', description: 'Tenant-scoped Doctor registry and lifecycle APIs.' },
    {
      name: 'Doctor Rota',
      description: 'Tenant-scoped reusable Doctor scheduling template APIs.',
    },
    {
      name: 'Doctor Schedule',
      description: 'Tenant-scoped Doctor availability assignment and generated slot APIs.',
    },
    {
      name: 'Appointment',
      description: 'Tenant-scoped Appointment booking APIs.',
    },
    {
      name: 'Appointment Cancelled Reason',
      description: 'Appointment Cancelled Reason Master APIs.',
    },
    { name: 'Asset Category', description: 'Asset Category Master APIs.' },
    { name: 'Asset Status', description: 'Asset Status Master APIs.' },
    { name: 'Asset Condition', description: 'Asset Condition Master APIs.' },
    { name: 'Work Order Type', description: 'Work Order Type Master APIs.' },
    { name: 'Work Order Priority', description: 'Work Order Priority Master APIs.' },
    { name: 'Work Order Status', description: 'Work Order Status Master APIs.' },
    { name: 'Work Order', description: 'Maintenance Work Order APIs.' },
    { name: 'Asset', description: 'Asset inventory APIs.' },
    { name: 'Room Type', description: 'Tenant-scoped Room Type Master APIs.' },
    { name: 'Room', description: 'Tenant-scoped Room registry and occupancy APIs.' },
    { name: 'Diagnosis Code', description: 'Tenant-scoped Diagnosis Code (ICD-10) Master APIs.' },
    { name: 'Allergen', description: 'Tenant-scoped Allergen Master APIs.' },
    { name: 'Clinical Note Type', description: 'Tenant-scoped Clinical Note Type Master APIs.' },
    { name: 'Patient', description: 'Patient Registration and management APIs.' },
    { name: 'Patient Allergy', description: 'Patient-scoped Allergy record APIs (Patient Chart).' },
    {
      name: 'Patient Problem',
      description: 'Patient-scoped Problem List record APIs (Patient Chart).',
    },
    {
      name: 'Patient Vital Sign',
      description: 'Patient-scoped Vital Sign record APIs (Patient Chart).',
    },
    {
      name: 'Patient Medication',
      description: 'Patient-scoped Medication record APIs (Patient Chart).',
    },
    {
      name: 'Clinical Note',
      description: 'Patient-scoped Clinical Note (SOAP) record APIs (Patient Chart).',
    },
  ],
  paths: {
    '/api/v1/signin': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in and select active Tenant',
        description:
          'Authenticates a user with email and password, creates a Session, and sets the sole Active Tenant available to that user as the active Tenant for tenant-scoped APIs.',
        requestBody: requestBody('SigninRequest', {
          email: 'priya.raghavan@apollo.example',
          password: 'StrongerPass123',
          rememberMe: false,
        }),
        responses: {
          '200': {
            description: 'User signed in and active Tenant selected.',
            content: jsonContent(dataEnvelopeSchema('SigninResult'), {
              data: {
                tenant: {
                  id: 'org_123',
                  name: 'Apollo Hospitals',
                  slug: 'apollo-hospitals',
                  logo: null,
                  isActive: true,
                  isOnboarded: true,
                  createdAt: '2026-06-11T00:00:00.000Z',
                },
              },
            }),
          },
          '400': {
            description: 'Validation failed or request body is invalid JSON.',
            content: jsonContent(
              { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
              {
                message: 'Validation failed',
                errors: ['Email must be valid'],
              }
            ),
          },
          '401': {
            description: 'Email or password is invalid.',
            content: jsonContent(schemaRef('SigninError'), {
              message: 'Invalid email or password',
              errors: ['Invalid email or password'],
            }),
          },
          '403': {
            description: 'The authenticated user has no Active Tenant available.',
            content: jsonContent(schemaRef('SigninError'), {
              message: 'No active Tenant available for this user.',
              errors: ['No active Tenant available for this user.'],
            }),
          },
          '409': {
            description:
              'More than one Active Tenant is available and Tenant selection is required.',
            content: jsonContent(schemaRef('SigninError'), {
              message:
                'Multiple active Tenants available for this user. Tenant selection is required.',
              errors: [
                'Multiple active Tenants available for this user. Tenant selection is required.',
              ],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/signout': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign out current Session',
        description:
          'Ends the current Session if one exists and clears the BetterAuth Session cookies for this browser.',
        security: [],
        responses: {
          '204': {
            description: 'Current Session ended and Session cookies cleared.',
          },
          '400': responseRef('ValidationFailed'),
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/signup': {
      post: {
        tags: ['Tenant Provisioning'],
        summary: 'Signup and provision Tenant',
        description:
          'First phase of Tenant Provisioning: creates the Tenant Owner user, provisions a Tenant, signs the owner in, and sets the new Tenant as active. Baseline configuration (Permission Catalogue and default Specialty, Appointment, Asset, and Work Order masters) is installed by the second phase, Tenant Onboarding, via POST /api/v1/onboarding; the returned Tenant has isOnboarded false until that phase completes.',
        requestBody: requestBody('SignupRequest', {
          tenantName: 'Apollo Hospitals',
          ownerName: 'Dr. Priya Raghavan',
          ownerEmail: 'priya.raghavan@apollo.example',
          password: 'StrongerPass123',
        }),
        responses: {
          '201': {
            description: 'Tenant provisioned and owner signed in. Tenant Onboarding still pending.',
            content: jsonContent(dataEnvelopeSchema('SignupResult'), {
              data: {
                tenant: {
                  id: 'org_123',
                  name: 'Apollo Hospitals',
                  slug: 'apollo-hospitals',
                  logo: null,
                  isActive: true,
                  isOnboarded: false,
                  createdAt: '2026-06-11T00:00:00.000Z',
                },
              },
            }),
          },
          '400': {
            description: 'Validation failed or request body is invalid JSON.',
            content: jsonContent(
              { oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')] },
              {
                message: 'Validation failed',
                errors: ['Password must be at least 8 characters'],
              }
            ),
          },
          '409': {
            description: 'Owner email or Tenant name is already in use.',
            content: jsonContent(schemaRef('ConflictError'), {
              message: 'A user with this email already exists.',
              errors: ['A user with this email already exists.'],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/onboarding': {
      post: {
        tags: ['Tenant Provisioning'],
        summary: 'Onboard active Tenant',
        description:
          'Second phase of Tenant Provisioning: idempotently seeds the system-wide Permission Catalogue and the active Tenant’s default Specialty, Appointment, Asset, and Work Order masters, then marks the Tenant as onboarded. The Tenant is resolved from the Session (activeOrganizationId) and never supplied by the client. Calling this API for an already onboarded Tenant returns 200 without re-seeding, and a legacy Tenant that already has the older seeded defaults but no onboarded flag is only marked onboarded — established Tenants are not backfilled and defaults deleted by a Tenant Admin are never resurrected. The request has no body.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Tenant onboarded (or already onboarded); baseline defaults are in place.',
            content: jsonContent(dataEnvelopeSchema('OnboardTenantResult'), {
              data: {
                tenant: {
                  id: 'org_123',
                  name: 'Apollo Hospitals',
                  slug: 'apollo-hospitals',
                  logo: null,
                  isActive: true,
                  isOnboarded: true,
                  createdAt: '2026-06-11T00:00:00.000Z',
                },
              },
            }),
          },
          '401': responseRef('Unauthorized'),
          '403': {
            description: 'No Active Tenant is selected on the Session.',
            content: jsonContent(schemaRef('ForbiddenError'), {
              message: 'No active tenant selected.',
              errors: ['No active tenant selected.'],
            }),
          },
          '404': {
            description: 'The active Tenant no longer exists.',
            content: jsonContent(schemaRef('NotFoundError'), {
              message: 'Tenant not found',
              errors: ['Tenant not found'],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/me': {
      get: {
        tags: ['Current User'],
        summary: 'Get current user',
        description:
          'Returns the authenticated user resolved from the Session: identity (and Staff profile when one exists), the Active Tenant, the membership authority level, the assigned Roles, and the Effective Permissions. tenantId is taken from the Session (activeOrganizationId) and is never supplied by the client. Effective Permissions are the entire active Permission Catalogue for an owner/admin membership, otherwise the de-duplicated union of the assigned Roles’ Permission Assignments, each expressed as a Permission Key (resource:action).',
        responses: {
          '200': {
            description: 'Authenticated user, Tenant context, Roles, and Effective Permissions.',
            content: jsonContent(dataEnvelopeSchema('CurrentUser'), {
              data: {
                user: {
                  id: 'usr_8f3c1a',
                  name: 'Dr. Asha Rao',
                  email: 'asha.rao@apollo.example',
                  image: null,
                  phone: '+91 90000 11111',
                  emailVerified: true,
                  staffProfile: {
                    staffCode: 'EMP-001',
                    designation: 'Cardiologist',
                    gender: 'Female',
                    dateOfBirth: '1985-04-12',
                    isActive: true,
                  },
                },
                tenant: {
                  id: 'org_123',
                  name: 'Apollo Hospitals',
                  slug: 'apollo-hospitals',
                  isActive: true,
                },
                roles: [{ id: 4, name: 'Receptionist', code: 'RECEPTIONIST' }],
                permissions: ['appointment:create', 'appointment:read', 'staff:read'],
                membership: { role: 'member' },
              },
            }),
          },
          '401': responseRef('Unauthorized'),
          '403': {
            description:
              'No Active Tenant is selected on the Session, or the user is not a member of the Active Tenant.',
            content: jsonContent(schemaRef('ForbiddenError'), {
              message: 'No active tenant selected.',
              errors: ['No active tenant selected.'],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/tenants/{id}': {
      get: {
        tags: ['Tenant'],
        summary: 'Get Tenant',
        security: [{ cookieAuth: [] }],
        parameters: [idPathParameter('Tenant')],
        responses: {
          '200': {
            description: 'Tenant found.',
            content: jsonContent(dataEnvelopeSchema('Tenant')),
          },
          ...authenticatedErrorResponses,
        },
      },
      put: {
        tags: ['Tenant'],
        summary: 'Update Tenant',
        security: [{ cookieAuth: [] }],
        parameters: [idPathParameter('Tenant')],
        requestBody: requestBody('UpdateTenantRequest', {
          name: 'Apollo Hospitals',
          logo: 'https://example.com/logo.png',
        }),
        responses: {
          '200': {
            description: 'Tenant updated.',
            content: jsonContent(dataEnvelopeSchema('Tenant')),
          },
          ...authenticatedErrorResponses,
        },
      },
    },
    '/api/v1/tenants/{id}/deactivate': {
      patch: {
        tags: ['Tenant'],
        summary: 'Deactivate Tenant',
        security: [{ cookieAuth: [] }],
        parameters: [idPathParameter('Tenant')],
        responses: {
          '200': {
            description: 'Tenant deactivated.',
            content: jsonContent(dataEnvelopeSchema('Tenant')),
          },
          ...authenticatedErrorResponses,
        },
      },
    },
    '/api/v1/tenants/{id}/reactivate': {
      patch: {
        tags: ['Tenant'],
        summary: 'Reactivate Tenant',
        security: [{ cookieAuth: [] }],
        parameters: [idPathParameter('Tenant')],
        responses: {
          '200': {
            description: 'Tenant reactivated.',
            content: jsonContent(dataEnvelopeSchema('Tenant')),
          },
          ...authenticatedErrorResponses,
        },
      },
    },
    '/api/v1/sessions': {
      get: {
        tags: ['Session'],
        summary: 'List Current User Sessions',
        description:
          'Returns active, non-expired Sessions for the authenticated user. The raw BetterAuth session token is never returned.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Active Sessions for the authenticated user.',
            content: jsonContent(schemaRef('SessionListResponse'), {
              data: [
                {
                  id: 'sess_abc',
                  ipAddress: '203.0.113.42',
                  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                  createdAt: '2026-06-09T08:00:00.000Z',
                  expiresAt: '2026-06-16T08:00:00.000Z',
                  isCurrent: true,
                },
                {
                  id: 'sess_def',
                  ipAddress: '203.0.113.10',
                  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
                  createdAt: '2026-06-08T14:00:00.000Z',
                  expiresAt: '2026-06-15T14:00:00.000Z',
                  isCurrent: false,
                },
              ],
              meta: { total: 2 },
            }),
          },
          '401': responseRef('Unauthorized'),
          '500': responseRef('InternalServerError'),
        },
      },
      delete: {
        tags: ['Session'],
        summary: 'Revoke Other Current User Sessions',
        description:
          'Revokes all Sessions for the authenticated user except the Session making this request. Use BetterAuth sign-out to end the current Session.',
        security: [{ cookieAuth: [] }],
        responses: {
          '204': { description: 'Other Sessions revoked.' },
          '401': responseRef('Unauthorized'),
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/sessions/{sessionId}': {
      delete: {
        tags: ['Session'],
        summary: 'Revoke Current User Session',
        description:
          'Revokes one Session owned by the authenticated user. The current Session cannot be revoked through this endpoint.',
        security: [{ cookieAuth: [] }],
        parameters: [namedStringPathParameter('sessionId', 'Session')],
        responses: {
          '204': { description: 'Session revoked.' },
          '400': responseRef('ValidationFailed'),
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '422': {
            description: 'The current Session must be ended through sign-out.',
            content: jsonContent(schemaRef('UnprocessableEntityError'), {
              message: 'Cannot revoke the current session. Use sign-out instead.',
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/users': {
      get: {
        tags: ['Staff'],
        summary: 'List Staff',
        description:
          'Returns a paginated list of non-deleted Staff profiles in the active Tenant, each with its assigned Roles embedded. Optionally filter by search text, assigned Role, and activation status. Requires the caller to be a Tenant Admin for the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [
          parameterRef('Page'),
          parameterRef('Limit'),
          parameterRef('Query'),
          parameterRef('StaffRoleId'),
          parameterRef('StaffStatus'),
        ],
        responses: {
          '200': {
            description: 'Paginated Staff list with embedded Roles.',
            content: jsonContent(paginatedSchema('StaffWithRoles'), {
              data: [
                {
                  id: 'user_priya',
                  name: 'Dr. Priya Sharma',
                  email: 'priya.sharma@apollohospitals.com',
                  phone: '+91-9876543210',
                  staffCode: 'DOC-001',
                  designation: 'Cardiologist',
                  gender: 'Female',
                  dateOfBirth: '1985-03-15',
                  isActive: true,
                  createdOn: '2026-06-09T10:00:00.000Z',
                  modifiedOn: '2026-06-09T10:00:00.000Z',
                  roles: [
                    { id: 2, name: 'Doctor' },
                    { id: 8, name: 'Ward Manager' },
                  ],
                },
              ],
              meta: {
                total: 1,
                totalPages: 1,
                pageSize: 10,
                pageNumber: 1,
              },
            }),
          },
          ...authenticatedErrorResponses,
        },
      },
      post: {
        tags: ['Staff'],
        summary: 'Create Staff',
        description:
          'Creates a credentialed BetterAuth user, adds the user as a member of the active Tenant, creates the Staff profile, and assigns at least one Role in the same Tenant. The email address must not already exist anywhere in the system.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateStaffRequest', {
          name: 'Dr. Priya Sharma',
          email: 'priya.sharma@apollohospitals.com',
          password: 'ChangeMe123!',
          roleIds: [2, 8],
          phone: '+91-9876543210',
          staffCode: 'DOC-001',
          designation: 'Cardiologist',
          gender: 'Female',
          dateOfBirth: '1985-03-15',
        }),
        responses: {
          '201': {
            description: 'Staff created.',
            content: jsonContent(dataEnvelopeSchema('Staff'), {
              data: {
                id: 'user_priya',
                name: 'Dr. Priya Sharma',
                email: 'priya.sharma@apollohospitals.com',
                phone: '+91-9876543210',
                staffCode: 'DOC-001',
                designation: 'Cardiologist',
                gender: 'Female',
                dateOfBirth: '1985-03-15',
                isActive: true,
                createdOn: '2026-06-09T10:00:00.000Z',
                modifiedOn: '2026-06-09T10:00:00.000Z',
              },
            }),
          },
          ...authenticatedErrorResponses,
        },
      },
    },
    '/api/v1/users/{id}': {
      get: {
        tags: ['Staff'],
        summary: 'Get Staff',
        description:
          'Returns a Staff profile by BetterAuth user ID within the active Tenant. Tenant Owners or Admins without a Staff profile are not returned by this API.',
        security: [{ cookieAuth: [] }],
        parameters: [stringIdPathParameter('Staff')],
        responses: {
          '200': {
            description: 'Staff found.',
            content: jsonContent(dataEnvelopeSchema('Staff')),
          },
          ...authenticatedErrorResponses,
        },
      },
      put: {
        tags: ['Staff'],
        summary: 'Update Staff',
        description:
          'Updates Staff profile fields plus BetterAuth name and phone. Email cannot be changed through this API, and password changes require a dedicated credential endpoint.',
        security: [{ cookieAuth: [] }],
        parameters: [stringIdPathParameter('Staff')],
        requestBody: requestBody('UpdateStaffRequest', {
          name: 'Dr. Priya Sharma',
          phone: '+91-9876543210',
          staffCode: 'DOC-001',
          designation: 'Senior Consultant',
          gender: 'Female',
          dateOfBirth: '1985-03-15',
        }),
        responses: {
          '200': {
            description: 'Staff updated.',
            content: jsonContent(dataEnvelopeSchema('Staff')),
          },
          ...authenticatedErrorResponses,
        },
      },
    },
    '/api/v1/users/{userId}/roles': {
      get: {
        tags: ['Role Assignment'],
        summary: 'List Staff Roles',
        description:
          'Returns the full Role objects assigned to an active Staff member in the active Tenant. Staff from other Tenants, inactive Staff, and non-Staff users are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [namedStringPathParameter('userId', 'Staff')],
        responses: {
          '200': {
            description: 'Roles assigned to the Staff member.',
            content: jsonContent(dataEnvelopeArraySchema('Role'), {
              data: [
                {
                  id: 2,
                  tenantId: 'org_abc123',
                  name: 'Doctor',
                  code: 'DOCTOR',
                  description: 'Clinical staff with prescribing authority',
                  isSystem: true,
                  createdOn: '2026-06-09T10:00:00.000Z',
                  modifiedOn: '2026-06-09T10:00:00.000Z',
                },
                {
                  id: 8,
                  tenantId: 'org_abc123',
                  name: 'Ward Manager',
                  code: 'WARD_MGR',
                  description: 'Oversees ward operations and nursing staff',
                  isSystem: false,
                  createdOn: '2026-06-09T10:00:00.000Z',
                  modifiedOn: '2026-06-09T10:00:00.000Z',
                },
              ],
            }),
          },
          ...roleAssignmentErrorResponses,
        },
      },
      post: {
        tags: ['Role Assignment'],
        summary: 'Assign Roles To Staff',
        description:
          'Assigns one or more active Roles from the active Tenant to an active Staff member. Duplicate IDs and already-assigned Roles are ignored. The assigner is always the authenticated Tenant Admin, not a request body field.',
        security: [{ cookieAuth: [] }],
        parameters: [namedStringPathParameter('userId', 'Staff')],
        requestBody: requestBody('AssignUserRolesRequest', {
          roleIds: [2, 8],
        }),
        responses: {
          '200': {
            description: 'The Staff member Roles after assignment.',
            content: jsonContent(dataEnvelopeArraySchema('Role'), {
              data: [
                {
                  id: 2,
                  tenantId: 'org_abc123',
                  name: 'Doctor',
                  code: 'DOCTOR',
                  description: 'Clinical staff with prescribing authority',
                  isSystem: true,
                  createdOn: '2026-06-09T10:00:00.000Z',
                  modifiedOn: '2026-06-09T10:00:00.000Z',
                },
                {
                  id: 8,
                  tenantId: 'org_abc123',
                  name: 'Ward Manager',
                  code: 'WARD_MGR',
                  description: 'Oversees ward operations and nursing staff',
                  isSystem: false,
                  createdOn: '2026-06-09T10:00:00.000Z',
                  modifiedOn: '2026-06-09T10:00:00.000Z',
                },
              ],
            }),
          },
          ...roleAssignmentErrorResponses,
        },
      },
    },
    '/api/v1/users/{userId}/sessions': {
      get: {
        tags: ['Session'],
        summary: 'List Staff Sessions',
        description:
          'Returns active, non-expired Sessions for a Staff member in the active Tenant. Requires the caller to be a Tenant Admin for the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [namedStringPathParameter('userId', 'Staff')],
        responses: {
          '200': {
            description: 'Active Sessions for the Staff member.',
            content: jsonContent(schemaRef('SessionListResponse'), {
              data: [
                {
                  id: 'sess_staff_abc',
                  ipAddress: '203.0.113.42',
                  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                  createdAt: '2026-06-09T08:00:00.000Z',
                  expiresAt: '2026-06-16T08:00:00.000Z',
                  isCurrent: false,
                },
              ],
              meta: { total: 1 },
            }),
          },
          '400': responseRef('ValidationFailed'),
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '500': responseRef('InternalServerError'),
        },
      },
      delete: {
        tags: ['Session'],
        summary: 'Revoke Staff Sessions',
        description:
          'Force-revokes all Sessions for a Staff member in the active Tenant, including that Staff member’s current Session if they are online. Requires the caller to be a Tenant Admin for the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [namedStringPathParameter('userId', 'Staff')],
        responses: {
          '204': { description: 'Staff Sessions revoked.' },
          '400': responseRef('ValidationFailed'),
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/users/{userId}/roles/{roleId}': {
      delete: {
        tags: ['Role Assignment'],
        summary: 'Remove Role From Staff',
        description:
          'Hard-deletes one Role Assignment from an active Staff member in the active Tenant. Removing the Staff member’s final Role Assignment is rejected.',
        security: [{ cookieAuth: [] }],
        parameters: [
          namedStringPathParameter('userId', 'Staff'),
          namedNumberPathParameter('roleId', 'Role'),
        ],
        responses: {
          '204': { description: 'Role Assignment removed.' },
          '422': {
            description: 'The Staff member must retain at least one Role Assignment.',
            content: jsonContent(schemaRef('UnprocessableEntityError'), {
              message: 'Users must have at least one role.',
            }),
          },
          ...rolePermissionErrorResponses,
        },
      },
    },
    '/api/v1/users/{id}/deactivate': {
      patch: {
        tags: ['Staff'],
        summary: 'Deactivate Staff',
        description:
          'Marks the Staff profile inactive in the active Tenant, bans the BetterAuth user, and clears existing sessions. Staff code remains reserved while the profile is non-deleted.',
        security: [{ cookieAuth: [] }],
        parameters: [stringIdPathParameter('Staff')],
        responses: {
          '200': {
            description: 'Staff deactivated.',
            content: jsonContent(dataEnvelopeSchema('Staff')),
          },
          ...authenticatedErrorResponses,
        },
      },
    },
    '/api/v1/users/{id}/reactivate': {
      patch: {
        tags: ['Staff'],
        summary: 'Reactivate Staff',
        description:
          'Marks the Staff profile active in the active Tenant and unbans the BetterAuth user.',
        security: [{ cookieAuth: [] }],
        parameters: [stringIdPathParameter('Staff')],
        responses: {
          '200': {
            description: 'Staff reactivated.',
            content: jsonContent(dataEnvelopeSchema('Staff')),
          },
          ...authenticatedErrorResponses,
        },
      },
    },
    '/api/v1/roles': {
      get: {
        tags: ['Role'],
        summary: 'List Roles',
        description:
          'Returns a paginated list of non-deleted Roles in the active Tenant. Requires the caller to be a Tenant Admin for the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [parameterRef('Page'), parameterRef('Limit'), parameterRef('Query')],
        responses: {
          '200': {
            description: 'Paginated Role list.',
            content: jsonContent(paginatedSchema('Role'), {
              data: [
                {
                  id: 8,
                  tenantId: 'org_abc123',
                  name: 'Ward Manager',
                  code: 'WARD_MGR',
                  description: 'Oversees ward operations and nursing staff',
                  isSystem: false,
                  createdOn: '2026-06-09T10:00:00.000Z',
                  modifiedOn: '2026-06-09T10:00:00.000Z',
                  assignedStaffCount: 0,
                  permissionAssignmentCount: 12,
                },
              ],
              meta: {
                total: 1,
                totalPages: 1,
                pageSize: 10,
                pageNumber: 1,
              },
            }),
          },
          ...authenticatedErrorResponses,
        },
      },
      post: {
        tags: ['Role'],
        summary: 'Create Role',
        description:
          'Creates a custom Role in the active Tenant. The code is normalized to uppercase and becomes immutable after creation.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateRoleRequest', {
          name: 'Ward Manager',
          code: 'WARD_MGR',
          description: 'Oversees ward operations and nursing staff',
        }),
        responses: {
          '201': {
            description: 'Role created.',
            content: jsonContent(dataEnvelopeSchema('Role'), {
              data: {
                id: 8,
                tenantId: 'org_abc123',
                name: 'Ward Manager',
                code: 'WARD_MGR',
                description: 'Oversees ward operations and nursing staff',
                isSystem: false,
                createdOn: '2026-06-09T10:00:00.000Z',
                modifiedOn: '2026-06-09T10:00:00.000Z',
                assignedStaffCount: 0,
                permissionAssignmentCount: 0,
              },
            }),
          },
          ...authenticatedErrorResponses,
        },
      },
    },
    '/api/v1/roles/{id}': {
      get: {
        tags: ['Role'],
        summary: 'Get Role',
        description:
          'Returns a Role by ID from the active Tenant. Soft-deleted Roles and Roles from other Tenants are not returned.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Role')],
        responses: {
          '200': {
            description: 'Role found.',
            content: jsonContent(dataEnvelopeSchema('Role')),
          },
          ...authenticatedErrorResponses,
        },
      },
      put: {
        tags: ['Role'],
        summary: 'Update Role',
        description:
          'Updates Role name or description in the active Tenant. Role code is immutable after creation; System Roles may be renamed.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Role')],
        requestBody: requestBody('UpdateRoleRequest', {
          name: 'Ward Operations Manager',
          description: 'Coordinates ward operations and nursing staff',
        }),
        responses: {
          '200': {
            description: 'Role updated.',
            content: jsonContent(dataEnvelopeSchema('Role')),
          },
          ...authenticatedErrorResponses,
        },
      },
      delete: {
        tags: ['Role'],
        summary: 'Delete Role',
        description:
          'Soft-deletes a custom Role in the active Tenant. System Roles and Roles with active Role Assignments cannot be deleted.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Role')],
        responses: {
          '204': { description: 'Role deleted.' },
          ...roleManagementErrorResponses,
        },
      },
    },
    '/api/v1/roles/{id}/permissions': {
      get: {
        tags: ['Permission Assignment'],
        summary: 'List Role Permissions',
        description:
          'Returns a flat list of active Permissions assigned to a Role in the active Tenant. Roles from other Tenants are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Role')],
        responses: {
          '200': {
            description: 'Assigned Permissions for the Role.',
            content: jsonContent(dataEnvelopeArraySchema('AssignedPermission'), {
              data: [
                {
                  id: 10,
                  module: 'identity-access',
                  resource: 'role',
                  action: 'read',
                  name: 'role:read',
                  description: 'View Roles.',
                },
                {
                  id: 11,
                  module: 'identity-access',
                  resource: 'permission-assignment',
                  action: 'replace',
                  name: 'permission-assignment:replace',
                  description: 'Replace all Permission Assignments for a Role.',
                },
              ],
            }),
          },
          ...rolePermissionErrorResponses,
        },
      },
      post: {
        tags: ['Permission Assignment'],
        summary: 'Assign Permissions To Role',
        description:
          'Adds one or more active Permissions to a Role in the active Tenant. Duplicate IDs and already-assigned Permissions are ignored.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Role')],
        requestBody: requestBody('AssignRolePermissionsRequest', {
          permissionIds: [10, 11, 16],
        }),
        responses: {
          '200': {
            description: 'The Role Permissions after assignment.',
            content: jsonContent(dataEnvelopeArraySchema('AssignedPermission'), {
              data: [
                {
                  id: 10,
                  module: 'identity-access',
                  resource: 'role',
                  action: 'read',
                  name: 'role:read',
                  description: 'View Roles.',
                },
                {
                  id: 11,
                  module: 'identity-access',
                  resource: 'permission-assignment',
                  action: 'replace',
                  name: 'permission-assignment:replace',
                  description: 'Replace all Permission Assignments for a Role.',
                },
                {
                  id: 16,
                  module: 'appointment-masters',
                  resource: 'appointment-type',
                  action: 'read',
                  name: 'appointment-type:read',
                  description: 'View Appointment Types.',
                },
              ],
            }),
          },
          ...rolePermissionErrorResponses,
        },
      },
      put: {
        tags: ['Permission Assignment'],
        summary: 'Replace Role Permissions',
        description:
          'Atomically replaces all Permission Assignments for a Role in the active Tenant. An empty permissionIds array clears all Permission Assignments for the Role.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Role')],
        requestBody: requestBody('SetRolePermissionsRequest', {
          permissionIds: [10, 11],
        }),
        responses: {
          '200': {
            description: 'The new full Role Permission set.',
            content: jsonContent(dataEnvelopeArraySchema('AssignedPermission'), {
              data: [
                {
                  id: 10,
                  module: 'identity-access',
                  resource: 'role',
                  action: 'read',
                  name: 'role:read',
                  description: 'View Roles.',
                },
                {
                  id: 11,
                  module: 'identity-access',
                  resource: 'permission-assignment',
                  action: 'replace',
                  name: 'permission-assignment:replace',
                  description: 'Replace all Permission Assignments for a Role.',
                },
              ],
            }),
          },
          ...rolePermissionErrorResponses,
        },
      },
    },
    '/api/v1/roles/{id}/permissions/{permissionId}': {
      delete: {
        tags: ['Permission Assignment'],
        summary: 'Remove Permission From Role',
        description:
          'Hard-deletes one Permission Assignment from a Role in the active Tenant. Returns not found when the Role or assignment does not exist.',
        security: [{ cookieAuth: [] }],
        parameters: [
          numberIdPathParameter('Role'),
          namedNumberPathParameter('permissionId', 'Permission'),
        ],
        responses: {
          '204': { description: 'Permission Assignment removed.' },
          ...rolePermissionErrorResponses,
        },
      },
    },
    '/api/v1/permissions': {
      get: {
        tags: ['Permission'],
        summary: 'List Permission Catalogue',
        description:
          'Returns all active Permissions grouped by module. Requires the caller to be a Tenant Admin for the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [parameterRef('PermissionModule')],
        responses: {
          '200': {
            description: 'Permission Catalogue grouped by module.',
            content: jsonContent(schemaRef('PermissionCatalogue'), {
              data: {
                'identity-access': [
                  {
                    id: 10,
                    name: 'role:read',
                    resource: 'role',
                    action: 'read',
                    description: 'View Roles.',
                  },
                  {
                    id: 11,
                    name: 'role:create',
                    resource: 'role',
                    action: 'create',
                    description: 'Create Roles.',
                  },
                ],
                'appointment-masters': [
                  {
                    id: 16,
                    name: 'appointment-type:read',
                    resource: 'appointment-type',
                    action: 'read',
                    description: 'View Appointment Types.',
                  },
                ],
              },
            }),
          },
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/permissions/{id}': {
      get: {
        tags: ['Permission'],
        summary: 'Get Permission',
        description:
          'Returns an active Permission by ID. Inactive Permissions are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Permission')],
        responses: {
          '200': {
            description: 'Permission found.',
            content: jsonContent(dataEnvelopeSchema('Permission'), {
              data: {
                id: 10,
                module: 'identity-access',
                resource: 'role',
                action: 'read',
                name: 'role:read',
                description: 'View Roles.',
                isActive: true,
                createdOn: '2026-06-11T00:00:00.000Z',
                modifiedOn: '2026-06-11T00:00:00.000Z',
              },
            }),
          },
          '400': responseRef('ValidationFailed'),
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/countries': globalReferenceCollection({
      tag: 'Global Reference',
      entity: 'Country',
      schemaName: 'Country',
      createSchemaName: 'CreateCountryRequest',
      example: { name: 'India', code: 'IN' },
    }),
    '/api/v1/countries/{id}': itemOperations({
      tag: 'Global Reference',
      entity: 'Country',
      schemaName: 'Country',
      updateSchemaName: 'UpdateCountryRequest',
      example: { name: 'India', code: 'IN' },
      parameters: [numberIdPathParameter('Country')],
    }),
    '/api/v1/states': globalReferenceCollection({
      tag: 'Global Reference',
      entity: 'State',
      schemaName: 'State',
      createSchemaName: 'CreateStateRequest',
      example: { name: 'Tamil Nadu', countryId: 1 },
      extraListParameters: [parameterRef('CountryId')],
    }),
    '/api/v1/states/{id}': itemOperations({
      tag: 'Global Reference',
      entity: 'State',
      schemaName: 'State',
      updateSchemaName: 'UpdateStateRequest',
      example: { name: 'Tamil Nadu', countryId: 1 },
      parameters: [numberIdPathParameter('State')],
    }),
    '/api/v1/languages': globalReferenceCollection({
      tag: 'Global Reference',
      entity: 'Language',
      schemaName: 'Language',
      createSchemaName: 'CreateLanguageRequest',
      example: { name: 'English', code: 'EN' },
    }),
    '/api/v1/languages/{id}': itemOperations({
      tag: 'Global Reference',
      entity: 'Language',
      schemaName: 'Language',
      updateSchemaName: 'UpdateLanguageRequest',
      example: { name: 'English', code: 'EN' },
      parameters: [numberIdPathParameter('Language')],
    }),
    '/api/v1/nationalities': globalReferenceCollection({
      tag: 'Global Reference',
      entity: 'Nationality',
      schemaName: 'Nationality',
      createSchemaName: 'CreateNationalityRequest',
      example: { name: 'Indian', code: 'IND' },
    }),
    '/api/v1/nationalities/{id}': itemOperations({
      tag: 'Global Reference',
      entity: 'Nationality',
      schemaName: 'Nationality',
      updateSchemaName: 'UpdateNationalityRequest',
      example: { name: 'Indian', code: 'IND' },
      parameters: [numberIdPathParameter('Nationality')],
    }),
    '/api/v1/religions': globalReferenceCollection({
      tag: 'Global Reference',
      entity: 'Religion',
      schemaName: 'Religion',
      createSchemaName: 'CreateReligionRequest',
      example: { name: 'Hindu', code: 'HIN' },
    }),
    '/api/v1/religions/{id}': itemOperations({
      tag: 'Global Reference',
      entity: 'Religion',
      schemaName: 'Religion',
      updateSchemaName: 'UpdateReligionRequest',
      example: { name: 'Hindu', code: 'HIN' },
      parameters: [numberIdPathParameter('Religion')],
    }),
    '/api/v1/specialties': {
      get: {
        tags: ['Specialty'],
        summary: 'List Specialties',
        description:
          'Returns active Specialties for the Tenant resolved from the authenticated Session. Any authenticated member of the active Tenant may read this list. Search matches Specialty name and code.',
        security: [{ cookieAuth: [] }],
        parameters: listParameters,
        responses: {
          '200': {
            description: 'Paginated Specialty list.',
            content: jsonContent(paginatedSchema('Specialty'), {
              data: [specialtyExample],
              meta: { total: 1, totalPages: 1, pageSize: 10, pageNumber: 1 },
            }),
          },
          '400': specialtyValidationFailed,
          '401': specialtyUnauthorized,
          '403': specialtyForbidden,
          '500': responseRef('InternalServerError'),
        },
      },
      post: {
        tags: ['Specialty'],
        summary: 'Create Specialty',
        description:
          'Creates a Specialty in the Tenant resolved from the authenticated Session. Tenant Admin authority is required. A non-empty code is trimmed and normalized to uppercase; an omitted, null, or blank code is stored as null.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateSpecialtyRequest', specialtyRequestExample),
        responses: {
          '201': {
            description: 'Specialty created.',
            content: jsonContent(dataEnvelopeSchema('Specialty'), {
              data: specialtyExample,
            }),
          },
          '400': specialtyValidationFailed,
          '401': specialtyUnauthorized,
          '403': specialtyForbidden,
          '409': specialtyConflict,
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/specialties/{id}': {
      get: {
        tags: ['Specialty'],
        summary: 'Get Specialty',
        description:
          'Returns an active Specialty from the Tenant resolved from the authenticated Session. Cross-Tenant and soft-deleted records are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Specialty')],
        responses: {
          '200': {
            description: 'Specialty found.',
            content: jsonContent(dataEnvelopeSchema('Specialty'), {
              data: specialtyExample,
            }),
          },
          ...specialtyReadErrorResponses,
        },
      },
      put: {
        tags: ['Specialty'],
        summary: 'Update Specialty',
        description:
          'Fully replaces the editable Specialty fields in the active Tenant. Tenant Admin authority is required. Name is required; omitted, null, or blank optional fields are cleared.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Specialty')],
        requestBody: requestBody('UpdateSpecialtyRequest', specialtyRequestExample),
        responses: {
          '200': {
            description: 'Specialty updated.',
            content: jsonContent(dataEnvelopeSchema('Specialty'), {
              data: specialtyExample,
            }),
          },
          ...specialtyMutationErrorResponses,
        },
      },
      delete: {
        tags: ['Specialty'],
        summary: 'Delete Specialty',
        description:
          'Soft-deletes a Specialty in the active Tenant. Tenant Admin authority is required.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Specialty')],
        responses: {
          '204': { description: 'Specialty deleted.' },
          ...specialtyReadErrorResponses,
        },
      },
    },
    '/api/v1/doctors': {
      get: {
        tags: ['Doctor'],
        summary: 'List Doctors',
        description:
          'Returns Doctors in the Tenant resolved from the authenticated Session. Search matches joined Staff identity fields and registration number; filters support Specialty and coupled active status.',
        security: [{ cookieAuth: [] }],
        parameters: [
          ...listParameters,
          {
            name: 'specialtyId',
            in: 'query',
            description: 'Filter by a Specialty in the active Tenant.',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by the coupled Doctor and Staff active state.',
            schema: { type: 'string', enum: ['active', 'inactive'] },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated Doctor list.',
            content: jsonContent(paginatedSchema('Doctor'), {
              data: [doctorExample],
              meta: { total: 1, totalPages: 1, pageSize: 10, pageNumber: 1 },
            }),
          },
          '400': doctorValidationFailed,
          '401': specialtyUnauthorized,
          '403': specialtyForbidden,
          '500': responseRef('InternalServerError'),
        },
      },
      post: {
        tags: ['Doctor'],
        summary: 'Create Doctor',
        description:
          'Creates a Doctor aggregate in the active Tenant: login, Staff profile, Doctor System Role Assignment, and clinical Doctor record. Tenant Admin authority is required. tenantId and assignedBy come from the Session, and callers must not send roleIds.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateDoctorRequest', doctorRequestExample),
        responses: {
          '201': {
            description: 'Doctor created and Doctor System Role auto-assigned.',
            content: jsonContent(dataEnvelopeSchema('Doctor'), { data: doctorExample }),
          },
          ...doctorMutationErrorResponses,
        },
      },
    },
    '/api/v1/doctors/{id}': {
      get: {
        tags: ['Doctor'],
        summary: 'Get Doctor',
        description:
          'Returns the joined Staff identity and Doctor clinical record in the active Tenant. Cross-Tenant identifiers are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Doctor')],
        responses: {
          '200': {
            description: 'Doctor found.',
            content: jsonContent(dataEnvelopeSchema('Doctor'), { data: doctorExample }),
          },
          ...doctorReadErrorResponses,
        },
      },
      patch: {
        tags: ['Doctor'],
        summary: 'Update Doctor',
        description:
          'Partially updates permitted Staff person fields and Doctor clinical fields atomically. Email and password are not editable here.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Doctor')],
        requestBody: requestBody('UpdateDoctorRequest', {
          name: 'Dr Anita Mehta',
          specialtyId: 7,
          registrationNumber: 'TN-MED-558211',
          qualifications: 'MBBS, MD, DM Cardiology',
        }),
        responses: {
          '200': {
            description: 'Doctor updated.',
            content: jsonContent(dataEnvelopeSchema('Doctor'), {
              data: { ...doctorExample, name: 'Dr Anita Mehta' },
            }),
          },
          ...doctorMutationErrorResponses,
        },
      },
    },
    '/api/v1/doctors/{id}/deactivate': {
      post: {
        tags: ['Doctor'],
        summary: 'Deactivate Doctor',
        description:
          'Atomically deactivates the Doctor, underlying Staff profile, and login, and revokes active Sessions.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Doctor')],
        responses: {
          '200': {
            description: 'Doctor and Staff login deactivated.',
            content: jsonContent(dataEnvelopeSchema('Doctor'), {
              data: { ...doctorExample, isActive: false },
            }),
          },
          ...doctorReadErrorResponses,
        },
      },
    },
    '/api/v1/doctors/{id}/reactivate': {
      post: {
        tags: ['Doctor'],
        summary: 'Reactivate Doctor',
        description: 'Atomically reactivates the Doctor, underlying Staff profile, and login.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Doctor')],
        responses: {
          '200': {
            description: 'Doctor and Staff login reactivated.',
            content: jsonContent(dataEnvelopeSchema('Doctor'), { data: doctorExample }),
          },
          ...doctorReadErrorResponses,
        },
      },
    },
    '/api/v1/doctor-rotas': collectionOperations({
      tag: 'Doctor Rota',
      entity: 'Doctor Rota',
      summaryEntity: 'Doctor Rotas',
      schemaName: 'DoctorRota',
      createSchemaName: 'CreateDoctorRotaRequest',
      example: doctorRotaRequestExample,
      security: [{ cookieAuth: [] }],
      listErrorResponses: authenticatedListErrorResponses,
      mutationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/doctor-rotas/{id}': itemOperations({
      tag: 'Doctor Rota',
      entity: 'Doctor Rota',
      schemaName: 'DoctorRota',
      updateSchemaName: 'UpdateDoctorRotaRequest',
      example: doctorRotaRequestExample,
      parameters: [numberIdPathParameter('Doctor Rota')],
      security: [{ cookieAuth: [] }],
      operationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/doctor-schedules': {
      get: {
        tags: ['Doctor Schedule'],
        summary: 'List Doctor Schedules',
        description:
          'Returns paginated DoctorSchedules for the active Tenant. Optional filters narrow by Doctor and schedule date range.',
        security: [{ cookieAuth: [] }],
        parameters: [
          parameterRef('Page'),
          parameterRef('Limit'),
          {
            name: 'doctorId',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1 },
            description: 'Doctor identifier.',
          },
          {
            name: 'fromDate',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'toDate',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated DoctorSchedule list.',
            content: jsonContent(paginatedSchema('DoctorSchedule'), {
              data: [doctorScheduleExample],
              meta: { total: 1, totalPages: 1, pageSize: 10, pageNumber: 1 },
            }),
          },
          ...authenticatedListErrorResponses,
        },
      },
      post: {
        tags: ['Doctor Schedule'],
        summary: 'Create Doctor Schedule',
        description:
          'Assigns one or more DoctorRotas to a Doctor over a date range. tenantId is resolved from the active Session.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateDoctorScheduleRequest', doctorScheduleRequestExample),
        responses: {
          '201': {
            description: 'DoctorSchedule created.',
            content: jsonContent(dataEnvelopeSchema('DoctorSchedule'), {
              data: doctorScheduleExample,
            }),
          },
          ...authenticatedErrorResponses,
          '409': responseRef('Conflict'),
        },
      },
      put: {
        tags: ['Doctor Schedule'],
        summary: 'Update Doctor Schedule',
        description:
          'Updates a DoctorSchedule by id supplied in the request body. rotaType=new adds rota links; rotaType=remove removes rota links.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('UpdateDoctorScheduleRequest', {
          doctorScheduleId: 11,
          rotaIds: [2],
          rotaType: 'new',
        }),
        responses: {
          '200': {
            description: 'DoctorSchedule updated.',
            content: jsonContent(dataEnvelopeSchema('DoctorSchedule'), {
              data: doctorScheduleExample,
            }),
          },
          ...authenticatedErrorResponses,
          '409': responseRef('Conflict'),
        },
      },
    },
    '/api/v1/doctor-slots': {
      get: {
        tags: ['Doctor Schedule'],
        summary: 'List Doctor Slots',
        description:
          'Generates available DoctorSlots for a Doctor on one date from active DoctorSchedules and assigned DoctorRotas.',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'doctorId',
            in: 'query',
            required: true,
            schema: { type: 'integer', minimum: 1 },
            description: 'Doctor identifier.',
          },
          {
            name: 'slotDate',
            in: 'query',
            required: true,
            schema: {
              oneOf: [
                { type: 'string', format: 'date', description: 'YYYY-MM-DD' },
                { type: 'string', pattern: '^\\d{2}-\\d{2}-\\d{4}$', description: 'DD-MM-YYYY' },
              ],
            },
            description:
              'Slot date. Existing schedule storage and responses use YYYY-MM-DD; legacy appointment booking clients may query with DD-MM-YYYY.',
          },
        ],
        responses: {
          '200': {
            description: 'Generated DoctorSlots grouped by date and DoctorRota.',
            content: jsonContent(dataEnvelopeArraySchema('DoctorSlotDate'), {
              data: doctorSlotsExample,
            }),
          },
          ...authenticatedListErrorResponses,
        },
      },
    },
    '/api/v1/appointments': {
      get: {
        tags: ['Appointment'],
        summary: 'List Appointments',
        description:
          "Lists Appointments in the active Tenant. With no slotDate or patientId filter, the list defaults to today's schedule in the Tenant Time Zone and is ordered by earliest reserved DoctorSlot; Patient-specific history suppresses that default.",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'slotDate',
            in: 'query',
            required: false,
            description:
              'Tenant-local Appointment date in DD-MM-YYYY format. Defaults to today unless patientId is supplied.',
            schema: { type: 'string', example: '16-07-2026' },
          },
          {
            name: 'doctorId',
            in: 'query',
            required: false,
            description: 'Filter to one Doctor schedule.',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'patientId',
            in: 'query',
            required: false,
            description:
              "Filter to one Patient's Appointment history. Suppresses the today default.",
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'appointmentStatusId',
            in: 'query',
            required: false,
            description: 'Filter by one tenant-scoped AppointmentStatus.',
            schema: { type: 'integer', minimum: 1 },
          },
          parameterRef('Page'),
          parameterRef('Limit'),
          parameterRef('Query'),
          parameterRef('Search'),
        ],
        responses: {
          '200': {
            description: 'Appointment schedule.',
            content: jsonContent(paginatedSchema('Appointment'), {
              data: [appointmentExample],
              meta: { total: 1, totalPages: 1, pageSize: 10, pageNumber: 1 },
            }),
          },
          ...authenticatedListErrorResponses,
        },
      },
      post: {
        tags: ['Appointment'],
        summary: 'Create Appointment',
        description:
          'Creates an Appointment in the active Tenant. The server assigns bookingNumber, uses the protected system Scheduled Appointment Status, validates the Patient or creates a provisional Patient, snapshots rotaName, and reserves one or more consecutive DoctorSlots atomically. Clients send doctorId, not clinicianId; facility/location/regulatory and visitClassification are intentionally omitted until Visits/Facilities are integrated.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateAppointmentRequest', createAppointmentRequestExample),
        responses: {
          '201': {
            description: 'Appointment created.',
            content: jsonContent(dataEnvelopeSchema('Appointment'), { data: appointmentExample }),
          },
          '400': responseRef('ValidationFailed'),
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '409': {
            description:
              'A referenced master is invalid, the Patient is inactive, a selected slot is no longer available, or provisional Patient details match an existing Patient.',
            content: jsonContent(schemaRef('AppointmentConflictError'), {
              message: 'Conflict',
              errors: ['Potential Patient match found. Retry with patientId.'],
              patientMatches: [
                {
                  id: 42,
                  mrn: 'MRN-1042',
                  firstName: 'Asha',
                  lastName: 'Rao',
                  phone: '+91-9876543210',
                  registrationStatus: 'registered',
                  isActive: true,
                },
              ],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/appointments/lookup': {
      get: {
        tags: ['Appointment'],
        summary: 'Look up an Appointment by Booking Number',
        description:
          'Resolves one Appointment in the active Tenant from its human-facing Booking Number, compared case-insensitively. Intended for the Visit Check-in desk, which reads the Booking Number off the Patient rather than an internal identifier.',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'bookingNumber',
            in: 'query',
            required: true,
            description: 'Booking Number of the Appointment.',
            schema: { type: 'string', minLength: 1, maxLength: 20, example: 'APT-1042' },
          },
        ],
        responses: {
          '200': {
            description: 'Appointment found.',
            content: jsonContent(dataEnvelopeSchema('Appointment'), { data: appointmentExample }),
          },
          '400': {
            description: 'The Booking Number is missing or blank.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Validation failed',
              errors: ['Booking Number is required'],
            }),
          },
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': {
            description: 'No Appointment in this Tenant carries that Booking Number.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Appointment not found',
              errors: ['Appointment APT-9999 is Invalid.'],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/appointments/types': appointmentMasterCollection({
      tag: 'Appointment Type',
      entity: 'Appointment Type',
      schemaName: 'AppointmentType',
      createSchemaName: 'CreateAppointmentTypeRequest',
      example: {
        name: 'Consultation',
        code: 'CONS',
        description: 'General consultation appointment',
      },
    }),
    '/api/v1/appointments/types/{id}': itemOperations({
      tag: 'Appointment Type',
      entity: 'Appointment Type',
      schemaName: 'AppointmentType',
      updateSchemaName: 'UpdateAppointmentTypeRequest',
      example: {
        name: 'Consultation',
        code: 'CONS',
        description: 'General consultation appointment',
      },
      parameters: [numberIdPathParameter('Appointment Type')],
      security: [{ cookieAuth: [] }],
      operationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/appointments/reasons': appointmentMasterCollection({
      tag: 'Appointment Reason',
      entity: 'Appointment Reason',
      schemaName: 'AppointmentReason',
      createSchemaName: 'CreateAppointmentReasonRequest',
      example: {
        name: 'Fever',
        code: 'FEVER',
        description: 'Patient reports fever symptoms',
      },
    }),
    '/api/v1/appointments/reasons/{id}': itemOperations({
      tag: 'Appointment Reason',
      entity: 'Appointment Reason',
      schemaName: 'AppointmentReason',
      updateSchemaName: 'UpdateAppointmentReasonRequest',
      example: {
        name: 'Fever',
        code: 'FEVER',
        description: 'Patient reports fever symptoms',
      },
      parameters: [numberIdPathParameter('Appointment Reason')],
      security: [{ cookieAuth: [] }],
      operationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/appointments/modes': appointmentMasterCollection({
      tag: 'Appointment Mode',
      entity: 'Appointment Mode',
      schemaName: 'AppointmentMode',
      createSchemaName: 'CreateAppointmentModeRequest',
      example: {
        name: 'In Person',
        code: 'INP',
        description: 'Patient visits the Facility',
      },
    }),
    '/api/v1/appointments/modes/{id}': itemOperations({
      tag: 'Appointment Mode',
      entity: 'Appointment Mode',
      schemaName: 'AppointmentMode',
      updateSchemaName: 'UpdateAppointmentModeRequest',
      example: {
        name: 'In Person',
        code: 'INP',
        description: 'Patient visits the Facility',
      },
      parameters: [numberIdPathParameter('Appointment Mode')],
      security: [{ cookieAuth: [] }],
      operationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/appointments/statuses': appointmentMasterCollection({
      tag: 'Appointment Status',
      entity: 'Appointment Status',
      schemaName: 'AppointmentStatus',
      createSchemaName: 'CreateAppointmentStatusRequest',
      example: {
        name: 'Scheduled',
        code: 'SCH',
        category: 'SCHEDULED',
        description: 'Appointment is scheduled',
      },
    }),
    '/api/v1/appointments/statuses/{id}': itemOperations({
      tag: 'Appointment Status',
      entity: 'Appointment Status',
      schemaName: 'AppointmentStatus',
      updateSchemaName: 'UpdateAppointmentStatusRequest',
      example: {
        name: 'Scheduled',
        code: 'SCH',
        category: 'SCHEDULED',
        description: 'Appointment is scheduled',
      },
      parameters: [numberIdPathParameter('Appointment Status')],
      security: [{ cookieAuth: [] }],
      operationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/appointments/cancelled-reasons': appointmentMasterCollection({
      tag: 'Appointment Cancelled Reason',
      entity: 'Appointment Cancelled Reason',
      schemaName: 'AppointmentCancelledReason',
      createSchemaName: 'CreateAppointmentCancelledReasonRequest',
      example: {
        name: 'Patient unavailable',
        code: 'PUNAV',
        description: 'Patient requested cancellation',
      },
    }),
    '/api/v1/appointments/cancelled-reasons/{id}': itemOperations({
      tag: 'Appointment Cancelled Reason',
      entity: 'Appointment Cancelled Reason',
      schemaName: 'AppointmentCancelledReason',
      updateSchemaName: 'UpdateAppointmentCancelledReasonRequest',
      example: {
        name: 'Patient unavailable',
        code: 'PUNAV',
        description: 'Patient requested cancellation',
      },
      parameters: [numberIdPathParameter('Appointment Cancelled Reason')],
      security: [{ cookieAuth: [] }],
      operationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/visits': {
      get: {
        tags: ['Visit'],
        summary: 'List Visits',
        description:
          "Lists Visits in the active Tenant. With no visitDate or patientId filter, the list defaults to today's queue in the Tenant Time Zone and is ordered by Queue Token; otherwise it is ordered most recently checked in first.",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'visitDate',
            in: 'query',
            required: false,
            description: 'Tenant-local Visit date in DD-MM-YYYY format. Defaults to today.',
            schema: { type: 'string', example: '16-07-2026' },
          },
          {
            name: 'doctorId',
            in: 'query',
            required: false,
            description: 'Filter to one Doctor queue.',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'patientId',
            in: 'query',
            required: false,
            description: "Filter to one Patient's Visit history. Suppresses the today default.",
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'status',
            in: 'query',
            required: false,
            description: 'Filter by Visit Status.',
            schema: schemaRef('VisitStatus'),
          },
          parameterRef('Page'),
          parameterRef('Limit'),
          parameterRef('Query'),
          parameterRef('Search'),
        ],
        responses: {
          '200': {
            description: "Today's Visit queue.",
            content: jsonContent(paginatedSchema('Visit'), {
              data: [visitExample],
              meta: { total: 1, totalPages: 1, pageSize: 10, pageNumber: 1 },
            }),
          },
          ...authenticatedListErrorResponses,
        },
      },
      post: {
        tags: ['Visit'],
        summary: 'Check in a Patient for a Visit',
        description:
          'Creates a Visit in the active Tenant. Send either appointmentId to fulfil an Appointment booked for today — the Patient and Doctor are taken from it and the Appointment moves to its Checked In status — or patientId and doctorId for a Walk-in Visit; sending both is invalid. The server assigns the Visit Number and the Queue Token (per Doctor, per Tenant-local day). The Patient must be a Registered Patient who is active, and must not already have an Active Visit.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: schemaRef('CheckInVisitRequest'),
              examples: {
                fromAppointment: {
                  summary: 'Check in against a booked Appointment',
                  value: { appointmentId: 42, visitTypeId: 1, chiefComplaint: 'Fever for 3 days' },
                },
                walkIn: {
                  summary: 'Walk-in Visit with no Appointment',
                  value: {
                    patientId: 1042,
                    doctorId: 7,
                    visitTypeId: 1,
                    chiefComplaint: 'Chest pain since morning',
                    remarks: 'Arrived without an appointment',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Visit created and Queue Token issued.',
            content: jsonContent(dataEnvelopeSchema('Visit'), { data: visitExample }),
          },
          '400': {
            description: 'The request body is invalid or mixes the two check-in shapes.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Validation failed',
              errors: [
                'Provide either appointmentId for an Appointment check-in or patientId and doctorId for a Walk-in Visit, not both.',
              ],
            }),
          },
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '409': {
            description:
              'A referenced record is invalid, the Appointment is not checkable today, the Patient is provisional or inactive, or the Patient already has an Active Visit.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Patient 1042 already has an active visit.',
              errors: ['Patient 1042 already has an active visit.'],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/visits/{id}': {
      get: {
        tags: ['Visit'],
        summary: 'Get Visit',
        description: 'Reads one Visit in the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Visit')],
        responses: {
          '200': {
            description: 'Visit details.',
            content: jsonContent(dataEnvelopeSchema('Visit'), { data: visitExample }),
          },
          ...authenticatedErrorResponses,
        },
      },
      put: {
        tags: ['Visit'],
        summary: 'Update Visit details',
        description:
          'Updates the chief complaint and remarks of an Active Visit. A Completed or Cancelled Visit is a historical record and cannot be edited.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Visit')],
        requestBody: requestBody('UpdateVisitRequest', {
          chiefComplaint: 'Fever for 3 days, now with cough',
          remarks: 'Referred by GP',
        }),
        responses: {
          '200': {
            description: 'Visit updated.',
            content: jsonContent(dataEnvelopeSchema('Visit'), { data: visitExample }),
          },
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '409': {
            description: 'The Visit is Completed or Cancelled.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Visit VST-1001 is closed and cannot be edited.',
              errors: ['Visit VST-1001 is closed and cannot be edited.'],
            }),
          },
          '400': responseRef('ValidationFailed'),
          '500': responseRef('InternalServerError'),
        },
      },
      delete: {
        tags: ['Visit'],
        summary: 'Delete Visit',
        description:
          'Soft-deletes a Visit as an administrative correction. Cancelling a Visit is the clinical outcome and is a separate operation.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Visit')],
        responses: {
          '204': { description: 'Visit deleted.' },
          ...authenticatedErrorResponses,
        },
      },
    },
    '/api/v1/visits/{id}/start': {
      post: {
        tags: ['Visit'],
        summary: 'Start the consultation',
        description:
          'Moves a Checked In Visit to In Consultation and stamps the start time. Only a Checked In Visit may be started.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Visit')],
        responses: {
          '200': {
            description: 'Consultation started.',
            content: jsonContent(dataEnvelopeSchema('Visit'), {
              data: {
                ...visitExample,
                status: 'IN_CONSULTATION',
                consultationStartedAt: '2026-07-16T04:45:00.000Z',
              },
            }),
          },
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '409': {
            description: 'The Visit is not Checked In.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Visit VST-1001 cannot be started from its current status.',
              errors: ['Visit VST-1001 cannot be started from its current status.'],
            }),
          },
          '400': responseRef('ValidationFailed'),
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/visits/{id}/complete': {
      post: {
        tags: ['Visit'],
        summary: 'Complete the Visit',
        description:
          'Moves an In Consultation Visit to Completed and moves any linked Appointment to its Completed status. Only an In Consultation Visit may be completed.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Visit')],
        responses: {
          '200': {
            description: 'Visit completed.',
            content: jsonContent(dataEnvelopeSchema('Visit'), {
              data: {
                ...visitExample,
                status: 'COMPLETED',
                consultationStartedAt: '2026-07-16T04:45:00.000Z',
                completedAt: '2026-07-16T05:10:00.000Z',
              },
            }),
          },
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '409': {
            description: 'The Visit is not In Consultation.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Visit VST-1001 cannot be completed from its current status.',
              errors: ['Visit VST-1001 cannot be completed from its current status.'],
            }),
          },
          '400': responseRef('ValidationFailed'),
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/visits/{id}/cancel': {
      post: {
        tags: ['Visit'],
        summary: 'Cancel the Visit',
        description:
          'Cancels an Active Visit with a reason and returns any linked Appointment to its Scheduled status so the Patient can be checked in again. The Queue Token is not reused. The Appointment itself is not cancelled.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Visit')],
        requestBody: requestBody('CancelVisitRequest', {
          cancellationReason: 'Patient left before consultation',
        }),
        responses: {
          '200': {
            description: 'Visit cancelled.',
            content: jsonContent(dataEnvelopeSchema('Visit'), {
              data: {
                ...visitExample,
                status: 'CANCELLED',
                cancelledAt: '2026-07-16T05:00:00.000Z',
                cancellationReason: 'Patient left before consultation',
              },
            }),
          },
          '400': {
            description: 'The cancellation reason is missing.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Validation failed',
              errors: ['Cancellation reason is required'],
            }),
          },
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '409': {
            description: 'The Visit is already Completed or Cancelled.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Visit VST-1001 cannot be cancelled from its current status.',
              errors: ['Visit VST-1001 cannot be cancelled from its current status.'],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/visits/documents': {
      post: {
        tags: ['Visit'],
        summary: 'Upload a Visit document to Blob',
        description:
          'Uploads a single file to Blob storage and returns its URL and metadata. This does not persist anything against a Visit — send the returned metadata in a Check-in payload (documents[]) or to POST /api/v1/visits/{id}/documents. Accepts a PDF or an image (PNG, JPEG, WEBP, GIF, TIFF) up to 4.5MB.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary', description: 'The file to upload.' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'File uploaded to Blob.',
            content: jsonContent(dataEnvelopeSchema('VisitDocumentMetadata'), {
              data: uploadedVisitDocumentExample,
            }),
          },
          '400': {
            description: 'The file is missing, empty, too large, or an unsupported type.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'File must be a PDF or an image (PNG, JPEG, WEBP, GIF, TIFF)',
            }),
          },
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/visits/{id}/documents': {
      get: {
        tags: ['Visit'],
        summary: 'List Visit documents',
        description: 'Lists the documents attached to a Visit in the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Visit')],
        responses: {
          '200': {
            description: 'Documents attached to the Visit.',
            content: jsonContent(dataEnvelopeArraySchema('VisitDocument'), {
              data: [visitDocumentExample],
            }),
          },
          ...authenticatedErrorResponses,
        },
      },
      post: {
        tags: ['Visit'],
        summary: 'Attach a document to a Visit',
        description:
          'Persists a document (already uploaded via POST /api/v1/visits/documents) against an Active Visit. A Completed or Cancelled Visit cannot be edited.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Visit')],
        requestBody: requestBody('VisitDocumentMetadata', uploadedVisitDocumentExample),
        responses: {
          '201': {
            description: 'Document attached to the Visit.',
            content: jsonContent(dataEnvelopeSchema('VisitDocument'), {
              data: visitDocumentExample,
            }),
          },
          '400': responseRef('ValidationFailed'),
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '409': {
            description: 'The Visit is Completed or Cancelled.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Visit VST-1001 is closed and cannot be edited.',
              errors: ['Visit VST-1001 is closed and cannot be edited.'],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/visits/{id}/documents/{documentId}': {
      delete: {
        tags: ['Visit'],
        summary: 'Delete a Visit document',
        description:
          'Removes a document from an Active Visit and deletes the underlying Blob file. A Completed or Cancelled Visit cannot be edited.',
        security: [{ cookieAuth: [] }],
        parameters: [
          numberIdPathParameter('Visit'),
          {
            name: 'documentId',
            in: 'path',
            required: true,
            description: 'Identifier of the document to delete.',
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          '204': { description: 'Document deleted.' },
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': {
            description: 'The Visit or document was not found.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Document not found',
              errors: ['Document not found'],
            }),
          },
          '409': {
            description: 'The Visit is Completed or Cancelled.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Visit VST-1001 is closed and cannot be edited.',
              errors: ['Visit VST-1001 is closed and cannot be edited.'],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/visits/types': appointmentMasterCollection({
      tag: 'Visit Type',
      entity: 'Visit Type',
      schemaName: 'VisitType',
      createSchemaName: 'CreateVisitTypeRequest',
      example: {
        name: 'OPD Consultation',
        code: 'OPD',
        description: 'Standard outpatient consultation',
      },
    }),
    '/api/v1/visits/types/{id}': itemOperations({
      tag: 'Visit Type',
      entity: 'Visit Type',
      schemaName: 'VisitType',
      updateSchemaName: 'UpdateVisitTypeRequest',
      example: {
        name: 'OPD Consultation',
        code: 'OPD',
        description: 'Standard outpatient consultation',
      },
      parameters: [numberIdPathParameter('Visit Type')],
      security: [{ cookieAuth: [] }],
      operationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/wards': appointmentMasterCollection({
      tag: 'Ward',
      entity: 'Ward',
      schemaName: 'Ward',
      createSchemaName: 'CreateWardRequest',
      example: { name: 'ICU', code: 'ICU', description: 'Intensive care unit' },
    }),
    '/api/v1/wards/{id}': itemOperations({
      tag: 'Ward',
      entity: 'Ward',
      schemaName: 'Ward',
      updateSchemaName: 'UpdateWardRequest',
      example: { name: 'ICU', code: 'ICU', description: 'Intensive care unit' },
      parameters: [numberIdPathParameter('Ward')],
      security: [{ cookieAuth: [] }],
      operationErrorResponses: {
        ...authenticatedErrorResponses,
        '409': {
          description: 'The Ward still has Beds assigned, or the new name/code already exists.',
          content: jsonContent(schemaRef('ValidationError'), {
            message: 'Ward ICU cannot be removed while Beds are assigned to it.',
            errors: ['Ward ICU cannot be removed while Beds are assigned to it.'],
          }),
        },
      },
    }),
    '/api/v1/admission-types': appointmentMasterCollection({
      tag: 'Admission Type',
      entity: 'Admission Type',
      schemaName: 'AdmissionType',
      createSchemaName: 'CreateAdmissionTypeRequest',
      example: {
        name: 'Emergency',
        code: 'EMER',
        description: 'Unplanned admission through emergency attendance',
      },
    }),
    '/api/v1/admission-types/{id}': itemOperations({
      tag: 'Admission Type',
      entity: 'Admission Type',
      schemaName: 'AdmissionType',
      updateSchemaName: 'UpdateAdmissionTypeRequest',
      example: {
        name: 'Emergency',
        code: 'EMER',
        description: 'Unplanned admission through emergency attendance',
      },
      parameters: [numberIdPathParameter('Admission Type')],
      security: [{ cookieAuth: [] }],
      operationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/charge-items': collectionOperations({
      tag: 'Charge Item',
      entity: 'Charge Item',
      summaryEntity: 'Charge Items',
      schemaName: 'ChargeItem',
      createSchemaName: 'CreateChargeItemRequest',
      example: {
        name: 'General Consultation',
        code: 'CONS',
        category: 'CONSULTATION',
        unitPrice: 500,
        description: 'Standard outpatient consultation fee',
        isActive: true,
      },
      security: [{ cookieAuth: [] }],
      listErrorResponses: authenticatedListErrorResponses,
      mutationErrorResponses: {
        ...authenticatedErrorResponses,
        '409': {
          description: 'The Charge Item name or code already exists in the Tenant.',
          content: jsonContent(schemaRef('ValidationError'), {
            message: 'Charge item code CONS already exists.',
            errors: ['Charge item code CONS already exists.'],
          }),
        },
      },
      extraListParameters: [
        {
          name: 'category',
          in: 'query',
          required: false,
          description: 'Filter to one Charge Item Category.',
          schema: schemaRef('ChargeItemCategory'),
        },
        {
          name: 'isActive',
          in: 'query',
          required: false,
          description: 'Filter by active flag. Omit for all Charge Items.',
          schema: { type: 'boolean' },
        },
      ],
    }),
    '/api/v1/charge-items/{id}': itemOperations({
      tag: 'Charge Item',
      entity: 'Charge Item',
      schemaName: 'ChargeItem',
      updateSchemaName: 'UpdateChargeItemRequest',
      example: {
        name: 'General Consultation',
        code: 'CONS',
        category: 'CONSULTATION',
        unitPrice: 500,
        description: 'Standard outpatient consultation fee',
        isActive: true,
      },
      parameters: [numberIdPathParameter('Charge Item')],
      security: [{ cookieAuth: [] }],
      operationErrorResponses: {
        ...authenticatedErrorResponses,
        '409': {
          description: 'The new name or code already exists in the Tenant.',
          content: jsonContent(schemaRef('ValidationError'), {
            message: 'Charge item name General Consultation already exists.',
            errors: ['Charge item name General Consultation already exists.'],
          }),
        },
      },
    }),
    '/api/v1/invoices': {
      get: {
        tags: ['Invoice'],
        summary: 'List Invoices',
        description:
          'Returns a paginated list of Invoices in the active Tenant, newest first. The tenantId is resolved from the active authenticated Session.',
        security: [{ cookieAuth: [] }],
        parameters: [
          ...listParameters,
          {
            name: 'status',
            in: 'query',
            required: false,
            description:
              'Filter by one or more Invoice Statuses (comma-separated). Example: DRAFT,FINALIZED,PARTIALLY_PAID for open Invoices.',
            schema: { type: 'string' },
          },
          {
            name: 'patientId',
            in: 'query',
            required: false,
            description: 'Filter to one Patient.',
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          ...authenticatedListErrorResponses,
          '200': {
            description: 'Paginated Invoice list.',
            content: jsonContent(paginatedSchema('InvoiceListItem'), {
              data: [invoiceListItemExample],
              meta: { total: 1, totalPages: 1, pageSize: 10, pageNumber: 1 },
            }),
          },
        },
      },
      post: {
        tags: ['Invoice'],
        summary: 'Create Invoice',
        description:
          'Creates a Draft Invoice for a Patient, optionally linked to a Visit or an Admission (not both). The tenantId is resolved from the active authenticated Session.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateInvoiceRequest', {
          patientId: 7,
          admissionId: 9,
          notes: 'Inpatient episode billing',
        }),
        responses: {
          ...authenticatedErrorResponses,
          '201': {
            description: 'Draft Invoice created.',
            content: jsonContent(dataEnvelopeSchema('Invoice'), {
              data: {
                ...invoiceResponseExample,
                status: 'DRAFT',
                subtotal: 0,
                discountAmount: 0,
                grandTotal: 0,
                amountPaid: 0,
                balanceDue: 0,
                finalizedAt: null,
                lines: [],
                payments: [],
              },
            }),
          },
          '400': {
            description: 'Invalid body, or the Visit/Admission does not belong to the Patient.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'An Invoice can link to a Visit or an Admission, not both.',
              errors: ['An Invoice can link to a Visit or an Admission, not both.'],
            }),
          },
          '409': {
            description: 'The linked encounter does not belong to the Patient.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Visit V-1001 does not belong to patient MRN-0007.',
              errors: ['Visit V-1001 does not belong to patient MRN-0007.'],
            }),
          },
        },
      },
    },
    '/api/v1/invoices/{id}': {
      get: {
        tags: ['Invoice'],
        summary: 'Get Invoice',
        description: 'Returns one Invoice with its lines and payments resolved.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Invoice')],
        responses: {
          ...authenticatedErrorResponses,
          '200': {
            description: 'Invoice found.',
            content: jsonContent(dataEnvelopeSchema('Invoice'), { data: invoiceResponseExample }),
          },
        },
      },
      put: {
        tags: ['Invoice'],
        summary: 'Update Draft Invoice',
        description:
          'Replaces the flat Discount and notes on a Draft Invoice in full — the same full-replace semantics as every other update endpoint in this API (e.g. Ward, Charge Item). Send the current value for a field to leave it unchanged; an omitted discountAmount resets to 0 and omitted/blank notes clear. Only Draft Invoices may be edited.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Invoice')],
        requestBody: requestBody('UpdateDraftInvoiceRequest', {
          discountAmount: 500,
          notes: 'Concession approved by front office',
        }),
        responses: {
          ...authenticatedErrorResponses,
          '200': {
            description: 'Draft Invoice updated.',
            content: jsonContent(dataEnvelopeSchema('Invoice'), { data: invoiceResponseExample }),
          },
          '409': {
            description: 'The Invoice is not a Draft, or the Discount exceeds the subtotal.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Discount 6000 exceeds the invoice subtotal 5000.',
              errors: ['Discount 6000 exceeds the invoice subtotal 5000.'],
            }),
          },
        },
      },
      delete: {
        tags: ['Invoice'],
        summary: 'Delete Invoice',
        description: 'Soft-deletes a Draft or Void Invoice. Finalized Invoices cannot be removed.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Invoice')],
        responses: {
          ...authenticatedErrorResponses,
          '204': { description: 'Invoice deleted.' },
          '409': {
            description: 'The Invoice has been finalized and cannot be removed.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Invoice INV-1042 cannot be removed once finalized.',
              errors: ['Invoice INV-1042 cannot be removed once finalized.'],
            }),
          },
        },
      },
    },
    '/api/v1/invoices/{id}/lines': {
      post: {
        tags: ['Invoice'],
        summary: 'Add Invoice Line',
        description:
          'Adds a line to a Draft Invoice from a Charge Item. The line snapshots the Charge Item description and unit price; an optional price override may be supplied. Recomputes the Invoice totals.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Invoice')],
        requestBody: requestBody('AddInvoiceLineRequest', {
          chargeItemId: 3,
          quantity: 1,
          unitPrice: 500,
        }),
        responses: {
          ...authenticatedErrorResponses,
          '201': {
            description: 'Line added; the updated Invoice is returned.',
            content: jsonContent(dataEnvelopeSchema('Invoice'), { data: invoiceResponseExample }),
          },
          '409': {
            description: 'The Invoice is not a Draft, or the Charge Item is inactive.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Charge item CONS is inactive.',
              errors: ['Charge item CONS is inactive.'],
            }),
          },
        },
      },
    },
    '/api/v1/invoices/{id}/lines/{lineId}': {
      delete: {
        tags: ['Invoice'],
        summary: 'Remove Invoice Line',
        description:
          'Removes a line from a Draft Invoice and recomputes totals, clamping the Discount down if the subtotal drops below it.',
        security: [{ cookieAuth: [] }],
        parameters: [
          numberIdPathParameter('Invoice'),
          namedNumberPathParameter('lineId', 'Invoice Line'),
        ],
        responses: {
          ...authenticatedErrorResponses,
          '204': { description: 'Line removed.' },
          '409': {
            description: 'The Invoice is not a Draft.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Invoice INV-1042 can only be edited while in Draft.',
              errors: ['Invoice INV-1042 can only be edited while in Draft.'],
            }),
          },
        },
      },
    },
    '/api/v1/invoices/{id}/finalize': {
      post: {
        tags: ['Invoice'],
        summary: 'Finalize Invoice',
        description:
          'Closes a Draft Invoice for editing, moving it to FINALIZED (or straight to PAID when the grand total is zero). Requires at least one line.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Invoice')],
        responses: {
          ...authenticatedErrorResponses,
          '200': {
            description: 'Invoice finalized.',
            content: jsonContent(dataEnvelopeSchema('Invoice'), { data: invoiceResponseExample }),
          },
          '409': {
            description: 'The Invoice is not a Draft, or it has no lines to finalize.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Invoice INV-1042 has no lines to finalize.',
              errors: ['Invoice INV-1042 has no lines to finalize.'],
            }),
          },
        },
      },
    },
    '/api/v1/invoices/{id}/void': {
      post: {
        tags: ['Invoice'],
        summary: 'Void Invoice',
        description:
          'Voids a Draft or Finalized Invoice that carries no Payments. Requires a reason.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Invoice')],
        requestBody: requestBody('VoidInvoiceRequest', { voidReason: 'Duplicate bill' }),
        responses: {
          ...authenticatedErrorResponses,
          '200': {
            description: 'Invoice voided.',
            content: jsonContent(dataEnvelopeSchema('Invoice'), {
              data: {
                ...invoiceResponseExample,
                status: 'VOID',
                voidedAt: '2026-07-18T10:00:00.000Z',
                voidReason: 'Duplicate bill',
                amountPaid: 0,
                balanceDue: 15000,
                payments: [],
              },
            }),
          },
          '409': {
            description: 'The Invoice already carries Payments and cannot be voided.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Invoice INV-1042 cannot be voided after payments are recorded.',
              errors: ['Invoice INV-1042 cannot be voided after payments are recorded.'],
            }),
          },
        },
      },
    },
    '/api/v1/invoices/{id}/payments': {
      get: {
        tags: ['Payment'],
        summary: 'List Payments',
        description: 'Returns the Payments recorded against one Invoice, oldest first.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Invoice')],
        responses: {
          ...authenticatedErrorResponses,
          '200': {
            description: 'Payments for the Invoice.',
            content: jsonContent(
              {
                type: 'object',
                properties: { data: { type: 'array', items: schemaRef('Payment') } },
              },
              { data: [paymentResponseExample] }
            ),
          },
        },
      },
      post: {
        tags: ['Payment'],
        summary: 'Record Payment',
        description:
          'Records an append-only Payment against a Finalized (or Partially Paid) Invoice. Partial Payments are allowed; the Payment can never exceed the balance due. Flips the Invoice status to PARTIALLY_PAID or PAID.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Invoice')],
        requestBody: requestBody('RecordPaymentRequest', {
          amount: 5000,
          method: 'UPI',
          reference: 'UPI-8842013',
        }),
        responses: {
          ...authenticatedErrorResponses,
          '201': {
            description: 'Payment recorded; the updated Invoice and the receipt are returned.',
            content: jsonContent(
              {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      invoice: schemaRef('Invoice'),
                      payment: schemaRef('Payment'),
                    },
                  },
                },
              },
              { data: { invoice: invoiceResponseExample, payment: paymentResponseExample } }
            ),
          },
          '409': {
            description:
              'The Invoice is not open for payment, or the amount exceeds the balance due.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Payment amount 5000 exceeds the balance due 3000 on invoice INV-1042.',
              errors: ['Payment amount 5000 exceeds the balance due 3000 on invoice INV-1042.'],
            }),
          },
        },
      },
    },
    '/api/v1/invoices/{id}/bed-charges': {
      post: {
        tags: ['Invoice'],
        summary: 'Generate Bed-Day Charges',
        description:
          'Derives Bed-Day Charge lines from the linked discharged Admission’s occupancy history and replaces any existing BED_AUTO lines on the Draft Invoice. Segments whose Bed has no daily rate are skipped and reported as warnings.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Invoice')],
        responses: {
          ...authenticatedErrorResponses,
          '200': {
            description: 'Bed-Day Charges generated; the updated Invoice, count, and warnings.',
            content: jsonContent(
              {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      invoice: schemaRef('Invoice'),
                      linesAdded: { type: 'integer', minimum: 0 },
                      warnings: { type: 'array', items: { type: 'string' } },
                    },
                  },
                },
              },
              {
                data: {
                  invoice: invoiceResponseExample,
                  linesAdded: 1,
                  warnings: ['Bed GEN-04 has no daily rate configured; segment skipped.'],
                },
              }
            ),
          },
          '409': {
            description:
              'The Invoice is not a Draft, is not linked to an Admission, or the Admission is not discharged.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Admission ADM-1001 is not discharged yet.',
              errors: ['Admission ADM-1001 is not discharged yet.'],
            }),
          },
        },
      },
    },
    '/api/v1/beds': {
      get: {
        tags: ['Bed'],
        summary: 'List Beds',
        description:
          'Returns a paginated list of Beds in the active Tenant with their Ward and optional Room resolved. The tenantId is resolved from the active authenticated Session.',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'wardId',
            in: 'query',
            required: false,
            description: 'Filter to one Ward.',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'status',
            in: 'query',
            required: false,
            description: 'Filter by Bed Status.',
            schema: schemaRef('BedStatus'),
          },
          ...listParameters,
        ],
        responses: {
          '200': {
            description: 'Paginated Bed list.',
            content: jsonContent(paginatedSchema('Bed'), {
              data: [bedExample],
              meta: { total: 1, totalPages: 1, pageSize: 10, pageNumber: 1 },
            }),
          },
          ...authenticatedListErrorResponses,
        },
      },
      post: {
        tags: ['Bed'],
        summary: 'Create Bed',
        description:
          'Creates a Bed in a Ward. Bed Numbers are unique within their Ward, compared case-insensitively. OCCUPIED is system-managed by Admissions and cannot be set manually.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateBedRequest', {
          bedNumber: 'ICU-01',
          wardId: 3,
          roomId: 4,
          status: 'AVAILABLE',
        }),
        responses: {
          '201': {
            description: 'Bed created.',
            content: jsonContent(dataEnvelopeSchema('Bed'), { data: bedExample }),
          },
          '400': {
            description: 'The request body is invalid or names the OCCUPIED status.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Validation failed',
              errors: ['Bed status OCCUPIED cannot be set manually.'],
            }),
          },
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '409': {
            description:
              'The Ward or Room is invalid, or the Bed Number already exists in the Ward.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: "Bed number 'ICU-01' already exists in ward ICU.",
              errors: ["Bed number 'ICU-01' already exists in ward ICU."],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/beds/board': {
      get: {
        tags: ['Bed'],
        summary: 'Get the Bed Board',
        description:
          'Returns every Bed in the active Tenant grouped by Ward, with the occupying Patient and Admission for each Occupied Bed. This is the ward-wise occupancy view.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Ward-grouped Bed occupancy.',
            content: jsonContent(
              {
                type: 'object',
                required: ['data'],
                properties: { data: { type: 'array', items: schemaRef('BedBoardWard') } },
              },
              { data: bedBoardExample }
            ),
          },
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/beds/{id}': {
      get: {
        tags: ['Bed'],
        summary: 'Get Bed',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Bed')],
        responses: {
          '200': {
            description: 'Bed found.',
            content: jsonContent(dataEnvelopeSchema('Bed'), { data: bedExample }),
          },
          ...authenticatedErrorResponses,
        },
      },
      put: {
        tags: ['Bed'],
        summary: 'Update Bed',
        description:
          'Updates a Bed. An occupied Bed cannot be edited: its status is managed by Admission lifecycle events.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Bed')],
        requestBody: requestBody('UpdateBedRequest', {
          bedNumber: 'ICU-01',
          wardId: 3,
          status: 'MAINTENANCE',
          notes: 'Ventilator service due',
        }),
        responses: {
          '200': {
            description: 'Bed updated.',
            content: jsonContent(dataEnvelopeSchema('Bed'), { data: bedExample }),
          },
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '409': {
            description: 'The Bed is occupied, a reference is invalid, or the Bed Number is taken.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Bed ICU-01 is occupied and its status is managed by admissions.',
              errors: ['Bed ICU-01 is occupied and its status is managed by admissions.'],
            }),
          },
          '400': responseRef('ValidationFailed'),
          '500': responseRef('InternalServerError'),
        },
      },
      delete: {
        tags: ['Bed'],
        summary: 'Delete Bed',
        description: 'Soft deletes a Bed. An occupied Bed cannot be removed.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Bed')],
        responses: {
          '204': { description: 'Bed deleted.' },
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '409': {
            description: 'The Bed is occupied by an Active Admission.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Bed ICU-01 cannot be removed while occupied.',
              errors: ['Bed ICU-01 cannot be removed while occupied.'],
            }),
          },
          '400': responseRef('ValidationFailed'),
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/admissions': {
      get: {
        tags: ['Admission'],
        summary: 'List Admissions',
        description:
          'Lists Admissions in the active Tenant, most recently admitted first. With no status or patientId filter the census defaults to Active Admissions; a patientId filter reads that Patient\u2019s full admission history.',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            description: 'Filter by Admission Status. Defaults to ADMITTED when omitted.',
            schema: schemaRef('AdmissionStatus'),
          },
          {
            name: 'wardId',
            in: 'query',
            required: false,
            description: 'Filter to one Ward via the current Bed.',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'doctorId',
            in: 'query',
            required: false,
            description: 'Filter to one admitting Doctor.',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'patientId',
            in: 'query',
            required: false,
            description:
              "Filter to one Patient's admission history. Suppresses the ADMITTED default.",
            schema: { type: 'integer', minimum: 1 },
          },
          ...listParameters,
        ],
        responses: {
          '200': {
            description: 'The inpatient census.',
            content: jsonContent(paginatedSchema('Admission'), {
              data: [admissionExample],
              meta: { total: 1, totalPages: 1, pageSize: 10, pageNumber: 1 },
            }),
          },
          ...authenticatedListErrorResponses,
        },
      },
      post: {
        tags: ['Admission'],
        summary: 'Admit a Patient',
        description:
          'Creates an Admission in the active Tenant. The target Bed must be Available or Reserved and moves to Occupied in the same transaction; the server assigns the Admission Number. The Patient must be a Registered Patient who is active and must not already have an Active Admission. An optional visitId records the source OPD Visit.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('AdmitPatientRequest', {
          patientId: 42,
          doctorId: 7,
          admissionTypeId: 1,
          bedId: 9,
          visitId: 7,
          admissionReason: 'Chest pain, observation',
          expectedDischargeDate: '20-07-2026',
        }),
        responses: {
          '201': {
            description: 'Admission created and Bed occupied.',
            content: jsonContent(dataEnvelopeSchema('Admission'), { data: admissionExample }),
          },
          '400': responseRef('ValidationFailed'),
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '409': {
            description:
              'A referenced record is invalid, the Bed is not available, the Patient is provisional or inactive, or the Patient already has an Active Admission.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Patient 42 already has an active admission.',
              errors: ['Patient 42 already has an active admission.'],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/admissions/{id}': {
      get: {
        tags: ['Admission'],
        summary: 'Get Admission',
        description: 'Returns one Admission with its Bed Transfer history embedded.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Admission')],
        responses: {
          '200': {
            description: 'Admission found.',
            content: jsonContent(dataEnvelopeSchema('AdmissionDetail'), {
              data: { ...admissionExample, transfers: [] },
            }),
          },
          ...authenticatedErrorResponses,
        },
      },
      put: {
        tags: ['Admission'],
        summary: 'Update Admission',
        description:
          'Updates the admission reason, remarks, and Expected Discharge Date of an Active Admission. Closed Admissions are immutable.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Admission')],
        requestBody: requestBody('UpdateAdmissionRequest', {
          admissionReason: 'Observation',
          remarks: 'Stable overnight',
          expectedDischargeDate: '21-07-2026',
        }),
        responses: {
          '200': {
            description: 'Admission updated.',
            content: jsonContent(dataEnvelopeSchema('Admission'), { data: admissionExample }),
          },
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '409': {
            description: 'The Admission is discharged or cancelled.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Admission ADM-1001 is closed and cannot be edited.',
              errors: ['Admission ADM-1001 is closed and cannot be edited.'],
            }),
          },
          '400': responseRef('ValidationFailed'),
          '500': responseRef('InternalServerError'),
        },
      },
      delete: {
        tags: ['Admission'],
        summary: 'Delete Admission',
        description:
          'Soft deletes an Admission as an administrative correction. Deleting an Active Admission frees its Bed exactly as discharging does.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Admission')],
        responses: {
          '204': { description: 'Admission deleted.' },
          ...authenticatedErrorResponses,
        },
      },
    },
    '/api/v1/admissions/{id}/transfer': {
      post: {
        tags: ['Admission'],
        summary: 'Transfer an Admission to another Bed',
        description:
          'Moves an Active Admission to another Bed: the target Bed must be Available or Reserved and becomes Occupied, the previous Bed is released, and the movement is recorded in the Bed Transfer history \u2014 all in one transaction.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Admission')],
        requestBody: requestBody('TransferBedRequest', {
          toBedId: 10,
          reason: 'Closer to the nursing station',
        }),
        responses: {
          '200': {
            description: 'Admission transferred.',
            content: jsonContent(dataEnvelopeSchema('Admission'), { data: admissionExample }),
          },
          '400': responseRef('ValidationFailed'),
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '409': {
            description:
              'The Admission is not active, the target Bed is unavailable, or it is the current Bed.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Admission ADM-1001 is already in bed ICU-01.',
              errors: ['Admission ADM-1001 is already in bed ICU-01.'],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/admissions/{id}/discharge': {
      post: {
        tags: ['Admission'],
        summary: 'Discharge an Admission',
        description:
          'Ends an Active Admission with a Discharge Disposition and optional Discharge Summary, releasing the Bed in the same transaction. A discharged Admission is immutable.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Admission')],
        requestBody: requestBody('DischargeAdmissionRequest', {
          dischargeDisposition: 'ROUTINE',
          dischargeSummary: 'Recovered well. Follow-up in two weeks.',
        }),
        responses: {
          '200': {
            description: 'Admission discharged and Bed released.',
            content: jsonContent(dataEnvelopeSchema('Admission'), {
              data: {
                ...admissionExample,
                status: 'DISCHARGED',
                dischargedAt: '2026-07-20T10:00:00.000Z',
                dischargeDisposition: 'ROUTINE',
                dischargeSummary: 'Recovered well. Follow-up in two weeks.',
              },
            }),
          },
          '400': responseRef('ValidationFailed'),
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '409': {
            description: 'The Admission is not in the Admitted status.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Admission ADM-1001 cannot be discharged from its current status.',
              errors: ['Admission ADM-1001 cannot be discharged from its current status.'],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/admissions/{id}/cancel': {
      post: {
        tags: ['Admission'],
        summary: 'Cancel an Admission',
        description:
          'Cancels an Active Admission that was created in error or where the Patient left before care, releasing the Bed. A reason is required.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Admission')],
        requestBody: requestBody('CancelAdmissionRequest', {
          cancellationReason: 'Admitted in error',
        }),
        responses: {
          '200': {
            description: 'Admission cancelled and Bed released.',
            content: jsonContent(dataEnvelopeSchema('Admission'), {
              data: {
                ...admissionExample,
                status: 'CANCELLED',
                cancelledAt: '2026-07-17T08:00:00.000Z',
                cancellationReason: 'Admitted in error',
              },
            }),
          },
          '400': responseRef('ValidationFailed'),
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': responseRef('NotFound'),
          '409': {
            description: 'The Admission is not in the Admitted status.',
            content: jsonContent(schemaRef('ValidationError'), {
              message: 'Admission ADM-1001 cannot be cancelled from its current status.',
              errors: ['Admission ADM-1001 cannot be cancelled from its current status.'],
            }),
          },
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/clinical-masters/diagnosis-codes': collectionOperations({
      tag: 'Diagnosis Code',
      entity: 'Diagnosis Code',
      summaryEntity: 'Diagnosis Codes',
      schemaName: 'DiagnosisCode',
      createSchemaName: 'CreateDiagnosisCodeRequest',
      example: {
        code: 'I10',
        title: 'Essential (primary) hypertension',
        category: 'Circulatory system',
      },
      security: [{ cookieAuth: [] }],
      listErrorResponses: authenticatedListErrorResponses,
      mutationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/clinical-masters/diagnosis-codes/{id}': itemOperations({
      tag: 'Diagnosis Code',
      entity: 'Diagnosis Code',
      schemaName: 'DiagnosisCode',
      updateSchemaName: 'UpdateDiagnosisCodeRequest',
      example: {
        code: 'I10',
        title: 'Essential (primary) hypertension',
        category: 'Circulatory system',
      },
      parameters: [numberIdPathParameter('Diagnosis Code')],
      security: [{ cookieAuth: [] }],
      operationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/clinical-masters/allergens': collectionOperations({
      tag: 'Allergen',
      entity: 'Allergen',
      summaryEntity: 'Allergens',
      schemaName: 'Allergen',
      createSchemaName: 'CreateAllergenRequest',
      example: {
        name: 'Penicillin',
        code: 'PEN',
        category: 'drug',
      },
      security: [{ cookieAuth: [] }],
      listErrorResponses: authenticatedListErrorResponses,
      mutationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/clinical-masters/allergens/{id}': itemOperations({
      tag: 'Allergen',
      entity: 'Allergen',
      schemaName: 'Allergen',
      updateSchemaName: 'UpdateAllergenRequest',
      example: {
        name: 'Penicillin',
        code: 'PEN',
        category: 'drug',
      },
      parameters: [numberIdPathParameter('Allergen')],
      security: [{ cookieAuth: [] }],
      operationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/clinical-masters/note-types': collectionOperations({
      tag: 'Clinical Note Type',
      entity: 'Clinical Note Type',
      summaryEntity: 'Clinical Note Types',
      schemaName: 'ClinicalNoteType',
      createSchemaName: 'CreateClinicalNoteTypeRequest',
      example: {
        name: 'Progress Note',
        code: 'PROG',
        description: 'Daily progress note documenting patient status.',
      },
      security: [{ cookieAuth: [] }],
      listErrorResponses: authenticatedListErrorResponses,
      mutationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/clinical-masters/note-types/{id}': itemOperations({
      tag: 'Clinical Note Type',
      entity: 'Clinical Note Type',
      schemaName: 'ClinicalNoteType',
      updateSchemaName: 'UpdateClinicalNoteTypeRequest',
      example: {
        name: 'Progress Note',
        code: 'PROG',
        description: 'Daily progress note documenting patient status.',
      },
      parameters: [numberIdPathParameter('Clinical Note Type')],
      security: [{ cookieAuth: [] }],
      operationErrorResponses: authenticatedErrorResponses,
    }),
    '/api/v1/patients/{id}/allergies': patientRecordCollectionOperations({
      tag: 'Patient Allergy',
      entity: 'Patient Allergy',
      summaryEntity: 'Patient Allergies',
      schemaName: 'PatientAllergy',
      createSchemaName: 'CreatePatientAllergyRequest',
      requestExample: {
        allergenId: 12,
        reaction: 'Hives and facial swelling',
        severity: 'severe',
        status: 'active',
        notedOn: '2026-03-01',
        notes: 'Reaction documented during intake.',
      },
      responseExample: patientAllergyExample,
    }),
    '/api/v1/patients/{id}/allergies/{allergyId}': patientRecordItemOperations({
      tag: 'Patient Allergy',
      entity: 'Patient Allergy',
      schemaName: 'PatientAllergy',
      updateSchemaName: 'UpdatePatientAllergyRequest',
      recordParam: 'allergyId',
      requestExample: {
        substance: 'Shellfish',
        reaction: 'Anaphylaxis',
        severity: 'severe',
        status: 'active',
      },
      responseExample: patientAllergyExample,
    }),
    '/api/v1/patients/{id}/problems': patientRecordCollectionOperations({
      tag: 'Patient Problem',
      entity: 'Patient Problem',
      summaryEntity: 'Patient Problems',
      schemaName: 'PatientProblem',
      createSchemaName: 'CreatePatientProblemRequest',
      requestExample: {
        diagnosisCodeId: 5,
        title: 'Essential (primary) hypertension',
        clinicalStatus: 'active',
        onsetDate: '2025-11-15',
      },
      responseExample: patientProblemExample,
    }),
    '/api/v1/patients/{id}/problems/{problemId}': patientRecordItemOperations({
      tag: 'Patient Problem',
      entity: 'Patient Problem',
      schemaName: 'PatientProblem',
      updateSchemaName: 'UpdatePatientProblemRequest',
      recordParam: 'problemId',
      requestExample: {
        title: 'Essential (primary) hypertension',
        clinicalStatus: 'resolved',
        resolvedDate: '2026-06-01',
      },
      responseExample: patientProblemExample,
    }),
    '/api/v1/patients/{id}/vitals': patientRecordCollectionOperations({
      tag: 'Patient Vital Sign',
      entity: 'Patient Vital Sign',
      summaryEntity: 'Patient Vital Signs',
      schemaName: 'PatientVitalSign',
      createSchemaName: 'CreatePatientVitalSignRequest',
      requestExample: {
        recordedAt: '2026-03-01T09:30:00Z',
        heightCm: 170,
        weightKg: 70,
        systolic: 120,
        diastolic: 80,
        pulseBpm: 72,
        respRate: 16,
        temperatureC: 36.8,
        spo2: 98,
        painScore: 2,
      },
      responseExample: patientVitalSignExample,
    }),
    '/api/v1/patients/{id}/vitals/{vitalId}': patientRecordItemOperations({
      tag: 'Patient Vital Sign',
      entity: 'Patient Vital Sign',
      schemaName: 'PatientVitalSign',
      updateSchemaName: 'UpdatePatientVitalSignRequest',
      recordParam: 'vitalId',
      requestExample: {
        heightCm: 170,
        weightKg: 72,
        systolic: 118,
        diastolic: 78,
        pulseBpm: 68,
      },
      responseExample: patientVitalSignExample,
    }),
    '/api/v1/patients/{id}/medications': patientRecordCollectionOperations({
      tag: 'Patient Medication',
      entity: 'Patient Medication',
      summaryEntity: 'Patient Medications',
      schemaName: 'PatientMedication',
      createSchemaName: 'CreatePatientMedicationRequest',
      requestExample: {
        drugName: 'Metformin',
        dose: '500 mg',
        route: 'oral',
        frequency: 'BID',
        status: 'active',
        startDate: '2026-01-10',
      },
      responseExample: patientMedicationExample,
    }),
    '/api/v1/patients/{id}/medications/{medicationId}': patientRecordItemOperations({
      tag: 'Patient Medication',
      entity: 'Patient Medication',
      schemaName: 'PatientMedication',
      updateSchemaName: 'UpdatePatientMedicationRequest',
      recordParam: 'medicationId',
      requestExample: {
        drugName: 'Metformin',
        dose: '1000 mg',
        route: 'oral',
        frequency: 'BID',
        status: 'stopped',
        startDate: '2026-01-10',
        endDate: '2026-05-20',
      },
      responseExample: patientMedicationExample,
    }),
    '/api/v1/patients/{id}/notes': patientRecordCollectionOperations({
      tag: 'Clinical Note',
      entity: 'Clinical Note',
      summaryEntity: 'Clinical Notes',
      schemaName: 'ClinicalNote',
      createSchemaName: 'CreateClinicalNoteRequest',
      requestExample: {
        noteTypeId: 3,
        subjective: 'Patient reports a productive cough for three days with mild fever.',
        objective: 'Temp 37.8C, chest clear on auscultation, throat mildly erythematous.',
        assessment: 'Acute upper respiratory infection.',
        plan: 'Supportive care, fluids, paracetamol as needed. Review in 5 days if not improving.',
      },
      responseExample: clinicalNoteExample,
    }),
    '/api/v1/patients/{id}/notes/{noteId}': patientRecordItemOperations({
      tag: 'Clinical Note',
      entity: 'Clinical Note',
      schemaName: 'ClinicalNote',
      updateSchemaName: 'UpdateClinicalNoteRequest',
      recordParam: 'noteId',
      requestExample: {
        noteTypeId: 3,
        subjective: 'Cough improving, no fever since yesterday.',
        assessment: 'Resolving URTI.',
        plan: 'Continue supportive care.',
      },
      responseExample: clinicalNoteExample,
    }),
    '/api/v1/patients/{id}/notes/{noteId}/sign': {
      post: {
        tags: ['Clinical Note'],
        summary: 'Sign Clinical Note',
        description:
          'Signs a draft Clinical Note for the Patient in the active Tenant, setting status to "signed" and stamping signedAt. A signed note is immutable — subsequent updates are rejected with 409 Conflict, and re-signing an already-signed note returns 409 Conflict.',
        security: [{ cookieAuth: [] }],
        parameters: [
          numberIdPathParameter('Patient'),
          namedNumberPathParameter('noteId', 'Clinical Note'),
        ],
        responses: {
          '200': {
            description: 'Clinical Note signed.',
            content: jsonContent(dataEnvelopeSchema('ClinicalNote'), {
              data: signedClinicalNoteExample,
            }),
          },
          ...authenticatedErrorResponses,
        },
      },
    },
    '/api/v1/patients/{id}/chart': {
      get: {
        tags: ['Patient'],
        summary: 'Get Patient Chart',
        description:
          'Returns the aggregated Patient Chart for one Patient in the active Tenant — Allergies, Problem List, Vital Signs, Medications, and Clinical Notes in a single payload for the chart initial load. Each collection is capped at its most-recent 100 records; the per-record endpoints remain the source of truth for pagination and writes. The tenantId is resolved from the active authenticated Session.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Patient')],
        responses: {
          '200': {
            description: 'Patient Chart.',
            content: jsonContent(dataEnvelopeSchema('PatientChart'), {
              data: {
                allergies: [patientAllergyExample],
                problems: [patientProblemExample],
                vitalSigns: [patientVitalSignExample],
                medications: [patientMedicationExample],
                clinicalNotes: [clinicalNoteExample],
              },
            }),
          },
          ...authenticatedErrorResponses,
        },
      },
    },
    '/api/v1/work-orders': {
      get: {
        tags: ['Work Order'],
        summary: 'List Work Orders',
        description:
          'Returns a newest-first paginated list of non-deleted Work Orders for the active Tenant. The tenantId is resolved from the active authenticated Session. Rows embed live Work Order Type, Priority, Status, and Asset values; completed history remains visible after an Asset is soft-deleted.',
        security: [{ cookieAuth: [] }],
        parameters: [
          parameterRef('Page'),
          parameterRef('Limit'),
          parameterRef('Query'),
          parameterRef('WorkOrderTypeId'),
          parameterRef('WorkOrderPriorityId'),
          parameterRef('WorkOrderStatusId'),
          parameterRef('WorkOrderAssetId'),
        ],
        responses: {
          '200': {
            description: 'Paginated Work Order list.',
            content: jsonContent(paginatedSchema('WorkOrder'), {
              data: [workOrderExample],
              meta: {
                total: 1,
                totalPages: 1,
                pageSize: 10,
                pageNumber: 1,
              },
            }),
          },
          '400': workOrderValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
      post: {
        tags: ['Work Order'],
        summary: 'Create Work Order',
        description:
          'Creates a Work Order in the active Tenant. The tenantId comes from the authenticated Session. The server atomically generates the permanent tenant-scoped code and derives completedOn from the selected Work Order Status Category; client-supplied code, completedOn, and tenantId fields are ignored.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateWorkOrderRequest', workOrderRequestExample),
        responses: {
          '201': {
            description: 'Work Order created with a server-generated code.',
            content: jsonContent(dataEnvelopeSchema('WorkOrder'), {
              data: workOrderExample,
            }),
          },
          '400': workOrderValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '409': workOrderConflict,
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/work-orders/summary': {
      get: {
        tags: ['Work Order'],
        summary: 'Summarize Work Orders',
        description:
          'Returns tenant-wide Work Order counts for the maintenance stat cards. The tenantId is resolved from the active authenticated Session. Active means the Work Order Status Category is not Completed; Overdue is an explicitly assigned Category, not a due-date calculation. Due next 7 days uses the half-open range from PostgreSQL current_date through current_date + 7 days, follows the configured database session timezone, and excludes Completed Work Orders. Completed (30d) uses completedOn within the preceding rolling 30 days.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Work Order summary counts.',
            content: jsonContent(dataEnvelopeSchema('WorkOrderSummary'), {
              data: {
                activeCount: 8,
                overdueCount: 2,
                dueNext7DaysCount: 3,
                completedLast30dCount: 5,
              },
            }),
          },
          '400': responseRef('ValidationFailed'),
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/assets': {
      get: {
        tags: ['Asset'],
        summary: 'List Assets',
        description:
          'Returns a paginated list of active Assets for the active Tenant. The tenantId is resolved from the active authenticated Session. Each Asset embeds its resolved Asset Category, Asset Status, and optional Asset Condition summaries for badge rendering.',
        security: [{ cookieAuth: [] }],
        parameters: [
          parameterRef('Page'),
          parameterRef('Limit'),
          parameterRef('Query'),
          parameterRef('AssetCategoryId'),
          parameterRef('AssetStatusId'),
        ],
        responses: {
          '200': {
            description: 'Paginated Asset list.',
            content: jsonContent(paginatedSchema('Asset'), {
              data: [assetExample],
              meta: {
                total: 1,
                totalPages: 1,
                pageSize: 10,
                pageNumber: 1,
              },
            }),
          },
          '400': assetValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
      post: {
        tags: ['Asset'],
        summary: 'Create Asset',
        description:
          'Creates an Asset in the active Tenant. The tenantId is resolved from the active authenticated Session; categoryId, statusId, and conditionId must reference Asset Masters in the same Tenant.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateAssetRequest', assetRequestExample),
        responses: {
          '201': {
            description: 'Asset created.',
            content: jsonContent(dataEnvelopeSchema('Asset'), {
              data: assetExample,
            }),
          },
          '400': assetValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '409': assetConflict,
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/assets/summary': {
      get: {
        tags: ['Asset'],
        summary: 'Summarize Assets',
        description:
          'Returns tenant-wide Asset metrics for the Asset Overview dashboard. The tenantId is resolved from the active authenticated Session. All metrics exclude soft-deleted Assets. Total assets includes Retired Assets. Portfolio value is the sum of currentValue in the Tenant Reporting Currency, with an unrecorded currentValue contributing zero. Out of service means the Asset Status code is MAINT or REPAIR. Assets by category includes every active Asset Category, including categories with no Assets, ordered by name.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Asset summary metrics.',
            content: jsonContent(dataEnvelopeSchema('AssetSummary'), {
              data: {
                totalAssets: 16,
                portfolioValue: 12100000,
                outOfServiceCount: 3,
                byCategory: [
                  {
                    categoryId: 1,
                    name: 'Diagnostic Imaging',
                    color: '#2563EB',
                    count: 3,
                  },
                  {
                    categoryId: 6,
                    name: 'Mobility & Furniture',
                    color: '#16A34A',
                    count: 0,
                  },
                ],
              },
            }),
          },
          '400': responseRef('ValidationFailed'),
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/assets/{id}': {
      get: {
        tags: ['Asset'],
        summary: 'Get Asset',
        description:
          'Returns one active Asset by ID from the active Tenant. Assets from other Tenants are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [idPathParameter('Asset')],
        responses: {
          '200': {
            description: 'Asset found.',
            content: jsonContent(dataEnvelopeSchema('Asset'), {
              data: assetExample,
            }),
          },
          ...assetErrorResponses,
        },
      },
      put: {
        tags: ['Asset'],
        summary: 'Update Asset',
        description:
          'Updates one active Asset in the active Tenant. The tenantId is resolved from the active authenticated Session; categoryId, statusId, and conditionId must reference Asset Masters in the same Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [idPathParameter('Asset')],
        requestBody: requestBody('UpdateAssetRequest', assetRequestExample),
        responses: {
          '200': {
            description: 'Asset updated.',
            content: jsonContent(dataEnvelopeSchema('Asset'), {
              data: assetExample,
            }),
          },
          '400': assetValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': assetNotFound,
          '409': assetConflict,
          '500': responseRef('InternalServerError'),
        },
      },
      delete: {
        tags: ['Asset'],
        summary: 'Delete Asset',
        description:
          'Soft-deletes one active Asset in the active Tenant. Deletion is rejected while the Asset has an Active Work Order; completed maintenance history remains listable after deletion.',
        security: [{ cookieAuth: [] }],
        parameters: [idPathParameter('Asset')],
        responses: {
          '204': { description: 'Asset deleted.' },
          ...assetErrorResponses,
        },
      },
    },
    '/api/v1/patients': {
      get: {
        tags: ['Patient'],
        summary: 'List Patients',
        description:
          'Returns a paginated list of active Patients for the active Tenant. The tenantId is resolved from the active authenticated Session. Search matches first name, middle name, last name, MRN, and phone. Each Patient embeds its resolved State, Country, Nationality, Language, and Religion summaries.',
        security: [{ cookieAuth: [] }],
        parameters: [
          ...listParameters,
          parameterRef('PatientGender'),
          parameterRef('PatientIsActive'),
        ],
        responses: {
          '200': {
            description: 'Paginated Patient list.',
            content: jsonContent(paginatedSchema('Patient'), {
              data: [patientExample],
              meta: { total: 1, totalPages: 1, pageSize: 10, pageNumber: 1 },
            }),
          },
          '400': patientValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
      post: {
        tags: ['Patient'],
        summary: 'Register Patient',
        description:
          'Registers a new Patient (Patient Registration) in the active Tenant. The tenantId is resolved from the active authenticated Session. The server allocates the Medical Record Number (MRN); clients never send it. stateId, countryId, nationalityId, languageId, and religionId must reference existing records; stateId requires countryId and the State must belong to that Country. govtIdType and govtIdNumber must be provided together and are unique per Tenant when present.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreatePatientRequest', patientRequestExample),
        responses: {
          '201': {
            description: 'Patient registered.',
            content: jsonContent(dataEnvelopeSchema('Patient'), {
              data: patientExample,
            }),
          },
          '400': patientValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '409': patientConflict,
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/patients/{id}': {
      get: {
        tags: ['Patient'],
        summary: 'Get Patient',
        description:
          'Returns one active Patient by ID from the active Tenant. Patients from other Tenants are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Patient')],
        responses: {
          '200': {
            description: 'Patient found.',
            content: jsonContent(dataEnvelopeSchema('Patient'), {
              data: patientExample,
            }),
          },
          ...patientErrorResponses,
        },
      },
      put: {
        tags: ['Patient'],
        summary: 'Update Patient',
        description:
          'Fully replaces the editable Patient fields in the active Tenant. The Medical Record Number (MRN) is immutable and is not part of the request body. Reference and government ID rules are the same as registration.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Patient')],
        requestBody: requestBody('UpdatePatientRequest', patientRequestExample),
        responses: {
          '200': {
            description: 'Patient updated.',
            content: jsonContent(dataEnvelopeSchema('Patient'), {
              data: patientExample,
            }),
          },
          ...patientErrorResponses,
        },
      },
      delete: {
        tags: ['Patient'],
        summary: 'Delete Patient',
        description: 'Soft-deletes one active Patient in the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Patient')],
        responses: {
          '204': { description: 'Patient deleted.' },
          ...patientErrorResponses,
        },
      },
    },
    '/api/v1/patients/{id}/deactivate': {
      patch: {
        tags: ['Patient'],
        summary: 'Deactivate Patient',
        description: 'Marks the Patient inactive in the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Patient')],
        responses: {
          '200': {
            description: 'Patient deactivated.',
            content: jsonContent(dataEnvelopeSchema('Patient'), { data: patientExample }),
          },
          '400': patientValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': patientNotFound,
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/patients/{id}/reactivate': {
      patch: {
        tags: ['Patient'],
        summary: 'Reactivate Patient',
        description: 'Marks the Patient active in the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Patient')],
        responses: {
          '200': {
            description: 'Patient reactivated.',
            content: jsonContent(dataEnvelopeSchema('Patient'), { data: patientExample }),
          },
          '400': patientValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '404': patientNotFound,
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/assets/categories': {
      get: {
        tags: ['Asset Category'],
        summary: 'List Asset Category Masters',
        description:
          'Returns a paginated list of Asset Category Masters for the active Tenant. The tenantId is resolved from the active authenticated Session.',
        security: [{ cookieAuth: [] }],
        parameters: listParameters,
        responses: {
          '200': {
            description: 'Paginated Asset Category Master list.',
            content: jsonContent(paginatedSchema('AssetCategory'), {
              data: [assetCategoryExample],
              meta: {
                total: 1,
                totalPages: 1,
                pageSize: 10,
                pageNumber: 1,
              },
            }),
          },
          '400': assetCategoryValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
      post: {
        tags: ['Asset Category'],
        summary: 'Create Asset Category',
        description:
          'Creates an Asset Category Master in the active Tenant. The tenantId is resolved from the active authenticated Session and request code is normalized to uppercase.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateAssetCategoryRequest', assetCategoryRequestExample),
        responses: {
          '201': {
            description: 'Asset Category created.',
            content: jsonContent(dataEnvelopeSchema('AssetCategory'), {
              data: assetCategoryExample,
            }),
          },
          ...assetCategoryErrorResponses,
        },
      },
    },
    '/api/v1/assets/categories/{id}': {
      get: {
        tags: ['Asset Category'],
        summary: 'Get Asset Category',
        description:
          'Returns one active Asset Category Master by ID from the active Tenant. Asset Categories from other Tenants are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Asset Category')],
        responses: {
          '200': {
            description: 'Asset Category found.',
            content: jsonContent(dataEnvelopeSchema('AssetCategory'), {
              data: assetCategoryExample,
            }),
          },
          ...assetCategoryErrorResponses,
        },
      },
      put: {
        tags: ['Asset Category'],
        summary: 'Update Asset Category',
        description:
          'Updates one active Asset Category Master in the active Tenant. The tenantId is resolved from the active authenticated Session and request code is normalized to uppercase.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Asset Category')],
        requestBody: requestBody('UpdateAssetCategoryRequest', assetCategoryRequestExample),
        responses: {
          '200': {
            description: 'Asset Category updated.',
            content: jsonContent(dataEnvelopeSchema('AssetCategory'), {
              data: assetCategoryExample,
            }),
          },
          ...assetCategoryErrorResponses,
        },
      },
      delete: {
        tags: ['Asset Category'],
        summary: 'Delete Asset Category',
        description: 'Soft-deletes one active Asset Category Master in the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Asset Category')],
        responses: {
          '204': { description: 'Asset Category deleted.' },
          ...assetCategoryErrorResponses,
        },
      },
    },
    '/api/v1/assets/statuses': {
      get: {
        tags: ['Asset Status'],
        summary: 'List Asset Status Masters',
        description:
          'Returns a paginated list of Asset Status Masters for the active Tenant. The tenantId is resolved from the active authenticated Session.',
        security: [{ cookieAuth: [] }],
        parameters: listParameters,
        responses: {
          '200': {
            description: 'Paginated Asset Status Master list.',
            content: jsonContent(paginatedSchema('AssetStatus'), {
              data: [assetStatusExample],
              meta: {
                total: 1,
                totalPages: 1,
                pageSize: 10,
                pageNumber: 1,
              },
            }),
          },
          '400': assetStatusValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
      post: {
        tags: ['Asset Status'],
        summary: 'Create Asset Status',
        description:
          'Creates an Asset Status Master in the active Tenant. The tenantId is resolved from the active authenticated Session and request code is normalized to uppercase.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateAssetStatusRequest', assetStatusRequestExample),
        responses: {
          '201': {
            description: 'Asset Status created.',
            content: jsonContent(dataEnvelopeSchema('AssetStatus'), {
              data: assetStatusExample,
            }),
          },
          ...assetStatusErrorResponses,
        },
      },
    },
    '/api/v1/assets/statuses/{id}': {
      get: {
        tags: ['Asset Status'],
        summary: 'Get Asset Status',
        description:
          'Returns one active Asset Status Master by ID from the active Tenant. Asset Statuses from other Tenants are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Asset Status')],
        responses: {
          '200': {
            description: 'Asset Status found.',
            content: jsonContent(dataEnvelopeSchema('AssetStatus'), {
              data: assetStatusExample,
            }),
          },
          ...assetStatusErrorResponses,
        },
      },
      put: {
        tags: ['Asset Status'],
        summary: 'Update Asset Status',
        description:
          'Updates one active Asset Status Master in the active Tenant. The tenantId is resolved from the active authenticated Session and request code is normalized to uppercase.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Asset Status')],
        requestBody: requestBody('UpdateAssetStatusRequest', assetStatusRequestExample),
        responses: {
          '200': {
            description: 'Asset Status updated.',
            content: jsonContent(dataEnvelopeSchema('AssetStatus'), {
              data: assetStatusExample,
            }),
          },
          ...assetStatusErrorResponses,
        },
      },
      delete: {
        tags: ['Asset Status'],
        summary: 'Delete Asset Status',
        description: 'Soft-deletes one active Asset Status Master in the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Asset Status')],
        responses: {
          '204': { description: 'Asset Status deleted.' },
          ...assetStatusErrorResponses,
        },
      },
    },
    '/api/v1/assets/conditions': {
      get: {
        tags: ['Asset Condition'],
        summary: 'List Asset Condition Masters',
        description:
          'Returns a paginated list of Asset Condition Masters for the active Tenant. The tenantId is resolved from the active authenticated Session.',
        security: [{ cookieAuth: [] }],
        parameters: listParameters,
        responses: {
          '200': {
            description: 'Paginated Asset Condition Master list.',
            content: jsonContent(paginatedSchema('AssetCondition'), {
              data: [assetConditionExample],
              meta: {
                total: 1,
                totalPages: 1,
                pageSize: 10,
                pageNumber: 1,
              },
            }),
          },
          '400': assetConditionValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
      post: {
        tags: ['Asset Condition'],
        summary: 'Create Asset Condition',
        description:
          'Creates an Asset Condition Master in the active Tenant. The tenantId is resolved from the active authenticated Session and request code is normalized to uppercase.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateAssetConditionRequest', assetConditionRequestExample),
        responses: {
          '201': {
            description: 'Asset Condition created.',
            content: jsonContent(dataEnvelopeSchema('AssetCondition'), {
              data: assetConditionExample,
            }),
          },
          ...assetConditionErrorResponses,
        },
      },
    },
    '/api/v1/assets/conditions/{id}': {
      get: {
        tags: ['Asset Condition'],
        summary: 'Get Asset Condition',
        description:
          'Returns one active Asset Condition Master by ID from the active Tenant. Asset Conditions from other Tenants are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Asset Condition')],
        responses: {
          '200': {
            description: 'Asset Condition found.',
            content: jsonContent(dataEnvelopeSchema('AssetCondition'), {
              data: assetConditionExample,
            }),
          },
          ...assetConditionErrorResponses,
        },
      },
      put: {
        tags: ['Asset Condition'],
        summary: 'Update Asset Condition',
        description:
          'Updates one active Asset Condition Master in the active Tenant. The tenantId is resolved from the active authenticated Session and request code is normalized to uppercase.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Asset Condition')],
        requestBody: requestBody('UpdateAssetConditionRequest', assetConditionRequestExample),
        responses: {
          '200': {
            description: 'Asset Condition updated.',
            content: jsonContent(dataEnvelopeSchema('AssetCondition'), {
              data: assetConditionExample,
            }),
          },
          ...assetConditionErrorResponses,
        },
      },
      delete: {
        tags: ['Asset Condition'],
        summary: 'Delete Asset Condition',
        description: 'Soft-deletes one active Asset Condition Master in the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Asset Condition')],
        responses: {
          '204': { description: 'Asset Condition deleted.' },
          ...assetConditionErrorResponses,
        },
      },
    },
    '/api/v1/work-orders/types': {
      get: {
        tags: ['Work Order Type'],
        summary: 'List Work Order Type Masters',
        description:
          'Returns a paginated list of Work Order Type Masters for the active Tenant. The tenantId is resolved from the active authenticated Session.',
        security: [{ cookieAuth: [] }],
        parameters: listParameters,
        responses: {
          '200': {
            description: 'Paginated Work Order Type Master list.',
            content: jsonContent(paginatedSchema('WorkOrderType'), {
              data: [workOrderTypeExample],
              meta: {
                total: 1,
                totalPages: 1,
                pageSize: 10,
                pageNumber: 1,
              },
            }),
          },
          '400': workOrderTypeValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
      post: {
        tags: ['Work Order Type'],
        summary: 'Create Work Order Type',
        description:
          'Creates a Work Order Type Master in the active Tenant. The tenantId is resolved from the active authenticated Session and request code is normalized to uppercase.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateWorkOrderTypeRequest', workOrderTypeRequestExample),
        responses: {
          '201': {
            description: 'Work Order Type created.',
            content: jsonContent(dataEnvelopeSchema('WorkOrderType'), {
              data: workOrderTypeExample,
            }),
          },
          ...workOrderTypeErrorResponses,
        },
      },
    },
    '/api/v1/work-orders/types/{id}': {
      get: {
        tags: ['Work Order Type'],
        summary: 'Get Work Order Type',
        description:
          'Returns one active Work Order Type Master by ID from the active Tenant. Work Order Types from other Tenants are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Work Order Type')],
        responses: {
          '200': {
            description: 'Work Order Type found.',
            content: jsonContent(dataEnvelopeSchema('WorkOrderType'), {
              data: workOrderTypeExample,
            }),
          },
          ...workOrderTypeErrorResponses,
        },
      },
      put: {
        tags: ['Work Order Type'],
        summary: 'Update Work Order Type',
        description:
          'Updates one active Work Order Type Master in the active Tenant. The tenantId is resolved from the active authenticated Session and request code is normalized to uppercase.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Work Order Type')],
        requestBody: requestBody('UpdateWorkOrderTypeRequest', workOrderTypeRequestExample),
        responses: {
          '200': {
            description: 'Work Order Type updated.',
            content: jsonContent(dataEnvelopeSchema('WorkOrderType'), {
              data: workOrderTypeExample,
            }),
          },
          ...workOrderTypeErrorResponses,
        },
      },
      delete: {
        tags: ['Work Order Type'],
        summary: 'Delete Work Order Type',
        description:
          'Soft-deletes one active Work Order Type Master in the active Tenant. Deletion is rejected while any non-deleted Work Order references it.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Work Order Type')],
        responses: {
          '204': { description: 'Work Order Type deleted.' },
          ...workOrderTypeErrorResponses,
        },
      },
    },
    '/api/v1/work-orders/priorities': {
      get: {
        tags: ['Work Order Priority'],
        summary: 'List Work Order Priority Masters',
        description:
          'Returns a paginated list of Work Order Priority Masters for the active Tenant. The tenantId is resolved from the active authenticated Session.',
        security: [{ cookieAuth: [] }],
        parameters: listParameters,
        responses: {
          '200': {
            description: 'Paginated Work Order Priority Master list.',
            content: jsonContent(paginatedSchema('WorkOrderPriority'), {
              data: [workOrderPriorityExample],
              meta: {
                total: 1,
                totalPages: 1,
                pageSize: 10,
                pageNumber: 1,
              },
            }),
          },
          '400': workOrderPriorityValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
      post: {
        tags: ['Work Order Priority'],
        summary: 'Create Work Order Priority',
        description:
          'Creates a Work Order Priority Master in the active Tenant. The tenantId is resolved from the active authenticated Session and request code is normalized to uppercase.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateWorkOrderPriorityRequest', workOrderPriorityRequestExample),
        responses: {
          '201': {
            description: 'Work Order Priority created.',
            content: jsonContent(dataEnvelopeSchema('WorkOrderPriority'), {
              data: workOrderPriorityExample,
            }),
          },
          ...workOrderPriorityErrorResponses,
        },
      },
    },
    '/api/v1/work-orders/priorities/{id}': {
      get: {
        tags: ['Work Order Priority'],
        summary: 'Get Work Order Priority',
        description:
          'Returns one active Work Order Priority Master by ID from the active Tenant. Work Order Priorities from other Tenants are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Work Order Priority')],
        responses: {
          '200': {
            description: 'Work Order Priority found.',
            content: jsonContent(dataEnvelopeSchema('WorkOrderPriority'), {
              data: workOrderPriorityExample,
            }),
          },
          ...workOrderPriorityErrorResponses,
        },
      },
      put: {
        tags: ['Work Order Priority'],
        summary: 'Update Work Order Priority',
        description:
          'Updates one active Work Order Priority Master in the active Tenant. The tenantId is resolved from the active authenticated Session and request code is normalized to uppercase.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Work Order Priority')],
        requestBody: requestBody('UpdateWorkOrderPriorityRequest', workOrderPriorityRequestExample),
        responses: {
          '200': {
            description: 'Work Order Priority updated.',
            content: jsonContent(dataEnvelopeSchema('WorkOrderPriority'), {
              data: workOrderPriorityExample,
            }),
          },
          ...workOrderPriorityErrorResponses,
        },
      },
      delete: {
        tags: ['Work Order Priority'],
        summary: 'Delete Work Order Priority',
        description:
          'Soft-deletes one active Work Order Priority Master in the active Tenant. Deletion is rejected while any non-deleted Work Order references it.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Work Order Priority')],
        responses: {
          '204': { description: 'Work Order Priority deleted.' },
          ...workOrderPriorityErrorResponses,
        },
      },
    },
    '/api/v1/work-orders/statuses': {
      get: {
        tags: ['Work Order Status'],
        summary: 'List Work Order Status Masters',
        description:
          'Returns an alphabetically sorted, paginated list of active Work Order Status Masters for the active Tenant. The tenantId is resolved from the active authenticated Session.',
        security: [{ cookieAuth: [] }],
        parameters: listParameters,
        responses: {
          '200': {
            description: 'Paginated Work Order Status Master list.',
            content: jsonContent(paginatedSchema('WorkOrderStatus'), {
              data: [workOrderStatusExample],
              meta: {
                total: 1,
                totalPages: 1,
                pageSize: 10,
                pageNumber: 1,
              },
            }),
          },
          '400': workOrderStatusValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
      post: {
        tags: ['Work Order Status'],
        summary: 'Create Work Order Status',
        description:
          'Creates a tenant-defined Work Order Status in the active Tenant. The tenantId is resolved from the active authenticated Session, request code is normalized to uppercase, and isSystem is always controlled by the server.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateWorkOrderStatusRequest', workOrderStatusRequestExample),
        responses: {
          '201': {
            description: 'Work Order Status created.',
            content: jsonContent(dataEnvelopeSchema('WorkOrderStatus'), {
              data: { ...workOrderStatusExample, isSystem: false },
            }),
          },
          ...workOrderStatusErrorResponses,
        },
      },
    },
    '/api/v1/work-orders/statuses/{id}': {
      get: {
        tags: ['Work Order Status'],
        summary: 'Get Work Order Status',
        description:
          'Returns one active Work Order Status Master by ID from the active Tenant. Work Order Statuses from other Tenants are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Work Order Status')],
        responses: {
          '200': {
            description: 'Work Order Status found.',
            content: jsonContent(dataEnvelopeSchema('WorkOrderStatus'), {
              data: workOrderStatusExample,
            }),
          },
          ...workOrderStatusErrorResponses,
        },
      },
      put: {
        tags: ['Work Order Status'],
        summary: 'Update Work Order Status',
        description:
          'Updates one active Work Order Status Master in the active Tenant. System Work Order Status names, colors, and descriptions may be customized, but their codes and categories are immutable. A tenant-created Status category cannot change while any non-deleted Work Order references it. Request code is normalized to uppercase.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Work Order Status')],
        requestBody: requestBody('UpdateWorkOrderStatusRequest', workOrderStatusRequestExample),
        responses: {
          '200': {
            description: 'Work Order Status updated.',
            content: jsonContent(dataEnvelopeSchema('WorkOrderStatus'), {
              data: workOrderStatusExample,
            }),
          },
          ...workOrderStatusErrorResponses,
        },
      },
      delete: {
        tags: ['Work Order Status'],
        summary: 'Delete Work Order Status',
        description:
          'Soft-deletes one active tenant-defined Work Order Status. System Work Order Statuses and Statuses referenced by any non-deleted Work Order cannot be deleted.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Work Order Status')],
        responses: {
          '204': { description: 'Work Order Status deleted.' },
          ...workOrderStatusErrorResponses,
        },
      },
    },
    '/api/v1/rooms/types': {
      get: {
        tags: ['Room Type'],
        summary: 'List Room Type Masters',
        description:
          'Returns a paginated list of Room Type Masters for the active Tenant. The tenantId is resolved from the active authenticated Session.',
        security: [{ cookieAuth: [] }],
        parameters: listParameters,
        responses: {
          '200': {
            description: 'Paginated Room Type Master list.',
            content: jsonContent(paginatedSchema('RoomType'), {
              data: [roomTypeExample],
              meta: { total: 1, totalPages: 1, pageSize: 10, pageNumber: 1 },
            }),
          },
          '400': roomTypeValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
      post: {
        tags: ['Room Type'],
        summary: 'Create Room Type',
        description:
          'Creates a Room Type Master in the active Tenant. The tenantId is resolved from the active authenticated Session and the request code is normalized to uppercase.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateRoomTypeRequest', roomTypeRequestExample),
        responses: {
          '201': {
            description: 'Room Type created.',
            content: jsonContent(dataEnvelopeSchema('RoomType'), { data: roomTypeExample }),
          },
          ...roomTypeErrorResponses,
        },
      },
    },
    '/api/v1/rooms/types/{id}': {
      get: {
        tags: ['Room Type'],
        summary: 'Get Room Type',
        description:
          'Returns one active Room Type Master by ID from the active Tenant. Room Types from other Tenants are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Room Type')],
        responses: {
          '200': {
            description: 'Room Type found.',
            content: jsonContent(dataEnvelopeSchema('RoomType'), { data: roomTypeExample }),
          },
          ...roomTypeErrorResponses,
        },
      },
      put: {
        tags: ['Room Type'],
        summary: 'Update Room Type',
        description:
          'Updates one active Room Type Master in the active Tenant. The tenantId is resolved from the active authenticated Session and the request code is normalized to uppercase.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Room Type')],
        requestBody: requestBody('UpdateRoomTypeRequest', roomTypeRequestExample),
        responses: {
          '200': {
            description: 'Room Type updated.',
            content: jsonContent(dataEnvelopeSchema('RoomType'), { data: roomTypeExample }),
          },
          ...roomTypeErrorResponses,
        },
      },
      delete: {
        tags: ['Room Type'],
        summary: 'Delete Room Type',
        description:
          'Soft-deletes one active Room Type Master in the active Tenant. Deletion is rejected while any non-deleted Room is assigned to the Room Type.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Room Type')],
        responses: {
          '204': { description: 'Room Type deleted.' },
          ...roomTypeErrorResponses,
        },
      },
    },
    '/api/v1/rooms': {
      get: {
        tags: ['Room'],
        summary: 'List Rooms',
        description:
          'Returns a paginated list of Rooms for the active Tenant, each with its Room Type resolved. Supports free-text search over room number, floor, wing, facility, and department, plus Room Status and Room Type filters.',
        security: [{ cookieAuth: [] }],
        parameters: [...listParameters, parameterRef('RoomTypeId'), parameterRef('RoomStatus')],
        responses: {
          '200': {
            description: 'Paginated Room list.',
            content: jsonContent(paginatedSchema('Room'), {
              data: [roomExample],
              meta: { total: 1, totalPages: 1, pageSize: 10, pageNumber: 1 },
            }),
          },
          '400': roomValidationFailed,
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
      post: {
        tags: ['Room'],
        summary: 'Create Room',
        description:
          'Creates a Room in the active Tenant. The tenantId is resolved from the active authenticated Session. The room number must be unique within the Tenant (case-insensitive) and the Room Type must exist in the same Tenant.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateRoomRequest', roomRequestExample),
        responses: {
          '201': {
            description: 'Room created.',
            content: jsonContent(dataEnvelopeSchema('Room'), { data: roomExample }),
          },
          ...roomErrorResponses,
        },
      },
    },
    '/api/v1/rooms/summary': {
      get: {
        tags: ['Room'],
        summary: 'Get Room summary',
        description:
          'Returns Room occupancy totals for the active Tenant: Room and Bed counts, counts grouped by Room Status and Room Type, and the occupancy rate as the percentage of Rooms in the OCCUPIED status. A Tenant with no Rooms reports a zero occupancy rate.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Room summary for the active Tenant.',
            content: jsonContent(dataEnvelopeSchema('RoomSummary'), { data: roomSummaryExample }),
          },
          '400': responseRef('ValidationFailed'),
          '401': responseRef('Unauthorized'),
          '403': responseRef('Forbidden'),
          '500': responseRef('InternalServerError'),
        },
      },
    },
    '/api/v1/rooms/{id}': {
      get: {
        tags: ['Room'],
        summary: 'Get Room',
        description:
          'Returns one active Room by ID from the active Tenant, with its Room Type resolved. Rooms from other Tenants are treated as not found.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Room')],
        responses: {
          '200': {
            description: 'Room found.',
            content: jsonContent(dataEnvelopeSchema('Room'), { data: roomExample }),
          },
          ...roomErrorResponses,
        },
      },
      put: {
        tags: ['Room'],
        summary: 'Update Room',
        description:
          'Updates one active Room in the active Tenant, including its Room Status. The room number must remain unique within the Tenant (case-insensitive) and the Room Type must exist in the same Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Room')],
        requestBody: requestBody('UpdateRoomRequest', roomRequestExample),
        responses: {
          '200': {
            description: 'Room updated.',
            content: jsonContent(dataEnvelopeSchema('Room'), { data: roomExample }),
          },
          ...roomErrorResponses,
        },
      },
      delete: {
        tags: ['Room'],
        summary: 'Delete Room',
        description:
          'Soft-deletes one active Room in the active Tenant. Deletion is rejected while the Room is in the OCCUPIED Room Status.',
        security: [{ cookieAuth: [] }],
        parameters: [numberIdPathParameter('Room')],
        responses: {
          '204': { description: 'Room deleted.' },
          ...roomErrorResponses,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token',
        description: 'BetterAuth session cookie used by requireAuth.',
      },
    },
    parameters: {
      Page: {
        name: 'page',
        in: 'query',
        required: false,
        description: 'Page number for paginated list endpoints.',
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      Limit: {
        name: 'limit',
        in: 'query',
        required: false,
        description: 'Page size for paginated list endpoints.',
        schema: { type: 'integer', minimum: 1, maximum: 999, default: 10 },
      },
      Query: {
        name: 'query',
        in: 'query',
        required: false,
        description: 'Search text for list endpoints that implement query filtering.',
        schema: { type: 'string' },
      },
      Search: {
        name: 'search',
        in: 'query',
        required: false,
        description: 'Alias for query on list endpoints that implement search filtering.',
        schema: { type: 'string' },
      },
      AssetCategoryId: {
        name: 'categoryId',
        in: 'query',
        required: false,
        description: 'Filters Assets by Asset Category identifier in the active Tenant.',
        schema: { type: 'integer', minimum: 1 },
      },
      AssetStatusId: {
        name: 'statusId',
        in: 'query',
        required: false,
        description: 'Filters Assets by Asset Status identifier in the active Tenant.',
        schema: { type: 'integer', minimum: 1 },
      },
      PatientGender: {
        name: 'gender',
        in: 'query',
        required: false,
        description: 'Filters Patients by gender.',
        schema: { type: 'string', enum: ['male', 'female', 'other', 'unknown'] },
      },
      PatientIsActive: {
        name: 'isActive',
        in: 'query',
        required: false,
        description: 'Filters Patients by active status.',
        schema: { type: 'boolean' },
      },
      WorkOrderTypeId: {
        name: 'typeId',
        in: 'query',
        required: false,
        description: 'Filters Work Orders by Work Order Type in the active Tenant.',
        schema: { type: 'integer', minimum: 1 },
      },
      WorkOrderPriorityId: {
        name: 'priorityId',
        in: 'query',
        required: false,
        description: 'Filters Work Orders by Work Order Priority in the active Tenant.',
        schema: { type: 'integer', minimum: 1 },
      },
      WorkOrderStatusId: {
        name: 'statusId',
        in: 'query',
        required: false,
        description: 'Filters Work Orders by Work Order Status in the active Tenant.',
        schema: { type: 'integer', minimum: 1 },
      },
      WorkOrderAssetId: {
        name: 'assetId',
        in: 'query',
        required: false,
        description: 'Filters Work Orders by Asset in the active Tenant.',
        schema: { type: 'integer', minimum: 1 },
      },
      CountryId: {
        name: 'countryId',
        in: 'query',
        required: false,
        description: 'Filters State Global References by Country.',
        schema: { type: 'integer', minimum: 1 },
      },
      PermissionModule: {
        name: 'module',
        in: 'query',
        required: false,
        description: 'Filters the Permission Catalogue by module.',
        schema: { type: 'string', minLength: 1, maxLength: 50 },
        examples: {
          identityAccess: { value: 'identity-access' },
          appointmentMasters: { value: 'appointment-masters' },
        },
      },
      StaffRoleId: {
        name: 'roleId',
        in: 'query',
        required: false,
        description: 'Filters Staff to those assigned the given Role in the active Tenant.',
        schema: { type: 'integer', minimum: 1 },
      },
      StaffStatus: {
        name: 'status',
        in: 'query',
        required: false,
        description:
          'Filters Staff by activation state. Omit to return both active and inactive Staff.',
        schema: { type: 'string', enum: ['active', 'inactive'] },
      },
      RoomTypeId: {
        name: 'roomTypeId',
        in: 'query',
        required: false,
        description: 'Filters Rooms by Room Type in the active Tenant.',
        schema: { type: 'integer', minimum: 1 },
      },
      RoomStatus: {
        name: 'status',
        in: 'query',
        required: false,
        description:
          'Filters Rooms by Room Status. Unrecognized values are ignored and all Rooms are returned.',
        schema: schemaRef('RoomStatus'),
      },
    },
    schemas: {
      PaginationMeta: {
        type: 'object',
        required: ['total', 'pageNumber', 'pageSize', 'totalPages'],
        properties: {
          total: { type: 'integer', minimum: 0 },
          pageNumber: { type: 'integer', minimum: 1 },
          pageSize: { type: 'integer', minimum: 1, maximum: 999 },
          totalPages: { type: 'integer', minimum: 0 },
        },
      },
      ValidationError: {
        type: 'object',
        required: ['message', 'errors'],
        properties: {
          message: { type: 'string', examples: ['Validation failed'] },
          errors: { type: 'array', items: { type: 'string' }, examples: [['Name is required']] },
        },
      },
      InvalidJsonError: {
        type: 'object',
        required: ['message'],
        properties: { message: { type: 'string', examples: ['Request body must be valid JSON'] } },
      },
      UnauthorizedError: {
        type: 'object',
        required: ['message'],
        properties: { message: { type: 'string', examples: ['Unauthorized'] } },
      },
      ForbiddenError: {
        type: 'object',
        required: ['message'],
        properties: { message: { type: 'string', examples: ['Forbidden'] } },
      },
      UnprocessableEntityError: {
        type: 'object',
        required: ['message'],
        properties: {
          message: {
            type: 'string',
            examples: [
              'System roles cannot be deleted.',
              'Role has active assignments.',
              'Users must have at least one role.',
              'Cannot revoke the current session. Use sign-out instead.',
            ],
          },
        },
      },
      NotFoundError: {
        type: 'object',
        required: ['message'],
        properties: {
          message: {
            type: 'string',
            examples: [
              'Country not found',
              'Tenant not found',
              'Appointment Type not found',
              'Staff not found',
              'Role not found',
              'Permission not found',
              'Permission Assignment not found',
              'Role Assignment not found',
              'Session not found',
            ],
          },
          errors: { type: 'array', items: { type: 'string' } },
        },
      },
      ConflictError: {
        type: 'object',
        required: ['message', 'errors'],
        properties: {
          message: {
            type: 'string',
            examples: [
              'Conflict',
              'A user with this email already exists.',
              'A tenant with this name already exists.',
            ],
          },
          errors: {
            type: 'array',
            items: { type: 'string' },
            examples: [
              ['Country code IN already exists.'],
              ['A user with this email already exists.'],
              ['A tenant with this name already exists.'],
              ['Staff code DOC-001 already exists.'],
              ['Role code WARD_MGR already exists.'],
            ],
          },
        },
      },
      InternalServerError: {
        type: 'object',
        required: ['message'],
        properties: { message: { type: 'string', examples: ['Internal Server Error'] } },
      },
      SigninRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1, maxLength: 128, writeOnly: true },
          rememberMe: {
            type: 'boolean',
            default: false,
            description: 'When true, keeps the Session active after the browser closes.',
          },
        },
      },
      SigninResult: {
        type: 'object',
        required: ['tenant'],
        properties: {
          tenant: schemaRef('Tenant'),
        },
      },
      SigninError: {
        type: 'object',
        required: ['message', 'errors'],
        properties: {
          message: {
            type: 'string',
            examples: [
              'Invalid email or password',
              'No active Tenant available for this user.',
              'Multiple active Tenants available for this user. Tenant selection is required.',
            ],
          },
          errors: {
            type: 'array',
            items: { type: 'string' },
            examples: [
              ['Invalid email or password'],
              ['No active Tenant available for this user.'],
              ['Multiple active Tenants available for this user. Tenant selection is required.'],
            ],
          },
        },
      },
      SignupRequest: {
        type: 'object',
        required: ['tenantName', 'ownerName', 'ownerEmail', 'password'],
        properties: {
          tenantName: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Canonical Tenant display name. Workspace is user-facing copy only.',
          },
          ownerName: { type: 'string', minLength: 1, maxLength: 100 },
          ownerEmail: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 128, writeOnly: true },
        },
      },
      SignupResult: {
        type: 'object',
        required: ['tenant'],
        properties: {
          tenant: schemaRef('Tenant'),
        },
      },
      OnboardTenantResult: {
        type: 'object',
        required: ['tenant'],
        properties: {
          tenant: schemaRef('Tenant'),
        },
      },
      UpdateTenantRequest: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          logo: { type: 'string', format: 'uri', maxLength: 2048 },
          timeZone: {
            type: 'string',
            description: 'Tenant operational IANA time zone used for local scheduling rules.',
            example: 'Asia/Kolkata',
          },
        },
      },
      Tenant: {
        type: 'object',
        required: [
          'id',
          'name',
          'slug',
          'logo',
          'isActive',
          'timeZone',
          'isOnboarded',
          'createdAt',
        ],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string', maxLength: 60, pattern: '^[a-z0-9-]+$' },
          logo: { type: ['string', 'null'], format: 'uri' },
          isActive: { type: 'boolean' },
          timeZone: {
            type: 'string',
            description: 'Tenant operational IANA time zone used for local scheduling rules.',
            example: 'Asia/Kolkata',
          },
          isOnboarded: {
            type: 'boolean',
            description: 'True once Tenant Onboarding has installed the baseline configuration.',
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CurrentUserStaffProfile: {
        type: 'object',
        description:
          'Staff-profile fields for the current user in the Active Tenant. Null when the user has no Staff profile, e.g. a Tenant Owner.',
        required: ['staffCode', 'designation', 'gender', 'dateOfBirth', 'isActive'],
        properties: {
          staffCode: { type: ['string', 'null'], maxLength: 20 },
          designation: { type: ['string', 'null'], maxLength: 100 },
          gender: {
            type: ['string', 'null'],
            enum: ['Male', 'Female', 'Other', 'Prefer not to say', null],
          },
          dateOfBirth: { type: ['string', 'null'], format: 'date' },
          isActive: { type: 'boolean' },
        },
      },
      CurrentUserIdentity: {
        type: 'object',
        required: ['id', 'name', 'email', 'image', 'phone', 'emailVerified', 'staffProfile'],
        properties: {
          id: { type: 'string', description: 'BetterAuth user ID.' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          image: { type: ['string', 'null'], format: 'uri' },
          phone: { type: ['string', 'null'] },
          emailVerified: { type: 'boolean' },
          staffProfile: {
            oneOf: [schemaRef('CurrentUserStaffProfile'), { type: 'null' }],
          },
        },
      },
      CurrentUserTenant: {
        type: 'object',
        description: 'The Active Tenant resolved from the Session.',
        required: ['id', 'name', 'slug', 'isActive'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string', maxLength: 60, pattern: '^[a-z0-9-]+$' },
          isActive: { type: 'boolean' },
        },
      },
      CurrentUserRoleSummary: {
        type: 'object',
        description: 'Lean Role reference for a Role assigned to the current user.',
        required: ['id', 'name', 'code'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
          code: { type: 'string' },
        },
      },
      CurrentUserMembership: {
        type: 'object',
        description: 'BetterAuth organization membership authority for the Active Tenant.',
        required: ['role'],
        properties: {
          role: {
            type: 'string',
            description:
              'Membership authority, e.g. owner, admin, or member. owner/admin grant the full Permission Catalogue as Effective Permissions.',
          },
        },
      },
      CurrentUser: {
        type: 'object',
        required: ['user', 'tenant', 'roles', 'permissions', 'membership'],
        properties: {
          user: schemaRef('CurrentUserIdentity'),
          tenant: schemaRef('CurrentUserTenant'),
          roles: {
            type: 'array',
            description:
              "The current user's assigned Roles in the Active Tenant. Empty for a Tenant Owner, who holds authority through membership rather than Role Assignments.",
            items: schemaRef('CurrentUserRoleSummary'),
          },
          permissions: {
            type: 'array',
            description:
              'Effective Permissions as Permission Keys (resource:action), de-duplicated and sorted.',
            items: { type: 'string' },
          },
          membership: schemaRef('CurrentUserMembership'),
        },
      },
      CreateStaffRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'roleIds'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: {
            type: 'string',
            minLength: 8,
            maxLength: 128,
            writeOnly: true,
            description: 'Initial Staff password.',
          },
          roleIds: {
            type: 'array',
            minItems: 1,
            items: { type: 'integer', minimum: 1 },
            description:
              'Active Role identifiers from the active Tenant. At least one Role is required when creating Staff.',
          },
          phone: { type: 'string' },
          staffCode: {
            type: 'string',
            maxLength: 20,
            description:
              'Tenant-scoped Staff code. Unique among non-deleted Staff profiles in the active Tenant.',
          },
          designation: { type: 'string', maxLength: 100 },
          gender: { type: 'string', enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
          dateOfBirth: { type: 'string', format: 'date' },
        },
      },
      UpdateStaffRequest: {
        type: 'object',
        minProperties: 1,
        description: 'Email and password are intentionally not accepted by this endpoint.',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          phone: { type: ['string', 'null'] },
          staffCode: {
            type: ['string', 'null'],
            maxLength: 20,
            description:
              'Tenant-scoped Staff code. Unique among non-deleted Staff profiles in the active Tenant.',
          },
          designation: { type: ['string', 'null'], maxLength: 100 },
          gender: {
            type: ['string', 'null'],
            enum: ['Male', 'Female', 'Other', 'Prefer not to say', null],
          },
          dateOfBirth: { type: ['string', 'null'], format: 'date' },
        },
      },
      Staff: {
        type: 'object',
        required: [
          'id',
          'name',
          'email',
          'phone',
          'staffCode',
          'designation',
          'gender',
          'dateOfBirth',
          'isActive',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: {
            type: 'string',
            description: 'BetterAuth user ID. The Staff profile row ID is internal.',
          },
          name: { type: 'string' },
          email: {
            type: 'string',
            format: 'email',
            description: 'Immutable Staff email address.',
          },
          phone: { type: ['string', 'null'] },
          staffCode: { type: ['string', 'null'], maxLength: 20 },
          designation: { type: ['string', 'null'], maxLength: 100 },
          gender: {
            type: ['string', 'null'],
            enum: ['Male', 'Female', 'Other', 'Prefer not to say', null],
          },
          dateOfBirth: { type: ['string', 'null'], format: 'date' },
          isActive: { type: 'boolean' },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      StaffRoleSummary: {
        type: 'object',
        required: ['id', 'name'],
        description: 'Lean Role reference embedded on each Staff row in the list response.',
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
        },
      },
      StaffWithRoles: {
        allOf: [
          schemaRef('Staff'),
          {
            type: 'object',
            required: ['roles'],
            properties: {
              roles: {
                type: 'array',
                description: "The Staff member's assigned Roles in the active Tenant.",
                items: schemaRef('StaffRoleSummary'),
              },
            },
          },
        ],
      },
      Session: {
        type: 'object',
        required: ['id', 'ipAddress', 'userAgent', 'createdAt', 'expiresAt', 'isCurrent'],
        properties: {
          id: {
            type: 'string',
            description: 'BetterAuth Session identifier. The raw Session token is never exposed.',
          },
          ipAddress: { type: ['string', 'null'] },
          userAgent: { type: ['string', 'null'] },
          createdAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
          isCurrent: {
            type: 'boolean',
            description: 'True when this is the Session making the request.',
          },
        },
      },
      SessionListResponse: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: { type: 'array', items: schemaRef('Session') },
          meta: {
            type: 'object',
            required: ['total'],
            properties: {
              total: { type: 'integer', minimum: 0 },
            },
          },
        },
      },
      CreateRoleRequest: {
        type: 'object',
        required: ['name', 'code'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          code: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
            description: 'Tenant-scoped Role code. The API normalizes this value to uppercase.',
          },
          description: { type: 'string' },
        },
      },
      UpdateRoleRequest: {
        type: 'object',
        minProperties: 1,
        description: 'Role code is intentionally not accepted by this endpoint.',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: ['string', 'null'] },
        },
      },
      Role: {
        allOf: [
          schemaRef('CreateRoleRequest'),
          {
            type: 'object',
            required: [
              'id',
              'tenantId',
              'name',
              'code',
              'description',
              'isSystem',
              'createdOn',
              'modifiedOn',
              'assignedStaffCount',
              'permissionAssignmentCount',
            ],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: { type: 'string', minLength: 1 },
              description: { type: ['string', 'null'] },
              isSystem: {
                type: 'boolean',
                description:
                  'True for system-provided Roles. Tenant Provisioning does not create default Roles.',
              },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
              assignedStaffCount: {
                type: 'integer',
                minimum: 0,
                description: 'Number of non-deleted Staff with this Role Assignment.',
              },
              permissionAssignmentCount: {
                type: 'integer',
                minimum: 0,
                description: 'Number of active Permission Assignments on this Role.',
              },
            },
          },
        ],
      },
      AssignRolePermissionsRequest: {
        type: 'object',
        required: ['permissionIds'],
        properties: {
          permissionIds: {
            type: 'array',
            minItems: 1,
            items: { type: 'integer', minimum: 1 },
            description: 'Active Permission identifiers to assign. Duplicate IDs are ignored.',
          },
        },
      },
      SetRolePermissionsRequest: {
        type: 'object',
        required: ['permissionIds'],
        properties: {
          permissionIds: {
            type: 'array',
            items: { type: 'integer', minimum: 1 },
            description:
              'Active Permission identifiers that should become the complete Permission Assignment set for the Role. An empty array clears all assignments.',
          },
        },
      },
      AssignedPermission: {
        type: 'object',
        required: ['id', 'module', 'resource', 'action', 'name', 'description'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          module: { type: 'string', maxLength: 50 },
          resource: { type: 'string', maxLength: 50 },
          action: {
            type: 'string',
            maxLength: 20,
            enum: [
              'read',
              'create',
              'update',
              'delete',
              'deactivate',
              'reactivate',
              'assign',
              'replace',
              'remove',
              'revoke',
            ],
          },
          name: {
            type: 'string',
            maxLength: 100,
            description: 'Canonical Permission key in <resource>:<action> format.',
          },
          description: { type: ['string', 'null'] },
        },
      },
      AssignUserRolesRequest: {
        type: 'object',
        required: ['roleIds'],
        properties: {
          roleIds: {
            type: 'array',
            minItems: 1,
            items: { type: 'integer', minimum: 1 },
            description:
              'Active Role identifiers to assign to the Staff member. Duplicate IDs are ignored.',
          },
        },
      },
      PermissionListItem: {
        type: 'object',
        required: ['id', 'name', 'resource', 'action', 'description'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: {
            type: 'string',
            maxLength: 100,
            description: 'Canonical Permission key in <resource>:<action> format.',
          },
          resource: { type: 'string', maxLength: 50 },
          action: {
            type: 'string',
            maxLength: 20,
            enum: [
              'read',
              'create',
              'update',
              'delete',
              'deactivate',
              'reactivate',
              'assign',
              'replace',
              'remove',
              'revoke',
            ],
          },
          description: { type: ['string', 'null'] },
        },
      },
      PermissionCatalogue: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            description: 'Active Permissions grouped by module.',
            additionalProperties: {
              type: 'array',
              items: schemaRef('PermissionListItem'),
            },
          },
        },
      },
      Permission: {
        type: 'object',
        required: [
          'id',
          'module',
          'resource',
          'action',
          'name',
          'description',
          'isActive',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          module: { type: 'string', maxLength: 50 },
          resource: { type: 'string', maxLength: 50 },
          action: {
            type: 'string',
            maxLength: 20,
            enum: [
              'read',
              'create',
              'update',
              'delete',
              'deactivate',
              'reactivate',
              'assign',
              'replace',
              'remove',
              'revoke',
            ],
          },
          name: {
            type: 'string',
            maxLength: 100,
            description: 'Canonical Permission key in <resource>:<action> format.',
          },
          description: { type: ['string', 'null'] },
          isActive: { type: 'boolean' },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      CreateCountryRequest: namedCodeCreateSchema('Country'),
      UpdateCountryRequest: namedCodeCreateSchema('Country'),
      Country: namedCodeSchema('Country'),
      CreateLanguageRequest: namedCodeCreateSchema('Language'),
      UpdateLanguageRequest: namedCodeCreateSchema('Language'),
      Language: namedCodeSchema('Language'),
      CreateNationalityRequest: namedCodeCreateSchema('Nationality'),
      UpdateNationalityRequest: namedCodeCreateSchema('Nationality'),
      Nationality: namedCodeSchema('Nationality'),
      CreateReligionRequest: namedCodeCreateSchema('Religion'),
      UpdateReligionRequest: namedCodeCreateSchema('Religion'),
      Religion: namedCodeSchema('Religion'),
      CreateSpecialtyRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          code: {
            type: ['string', 'null'],
            maxLength: 10,
            description:
              'Optional Tenant-scoped Specialty code. Non-empty values are trimmed and normalized to uppercase; null, blank, and omitted values are stored as null.',
          },
          description: {
            type: ['string', 'null'],
            description: 'Optional Specialty description. Blank values are stored as null.',
          },
        },
      },
      UpdateSpecialtyRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          code: {
            type: ['string', 'null'],
            maxLength: 10,
            description:
              'Optional Tenant-scoped Specialty code. Non-empty values are trimmed and normalized to uppercase; null, blank, omitted values clear the code.',
          },
          description: {
            type: ['string', 'null'],
            description:
              'Optional Specialty description. Null, blank, and omitted values clear it.',
          },
        },
      },
      Specialty: {
        allOf: [
          schemaRef('CreateSpecialtyRequest'),
          {
            type: 'object',
            required: ['id', 'tenantId', 'name', 'code', 'description', 'createdOn', 'modifiedOn'],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the authenticated Session.',
              },
              code: { type: ['string', 'null'], maxLength: 10 },
              description: { type: ['string', 'null'] },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      CreateDoctorRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'email', 'password', 'specialtyId'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 128, writeOnly: true },
          gender: {
            type: 'string',
            enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
          },
          dateOfBirth: { type: 'string', format: 'date' },
          staffCode: { type: 'string', maxLength: 20 },
          designation: { type: 'string', maxLength: 100 },
          specialtyId: { type: 'integer', minimum: 1 },
          registrationNumber: { type: 'string', maxLength: 100 },
          qualifications: { type: 'string' },
        },
        description:
          'Creates the Staff and Doctor aggregate. roleIds and tenantId are intentionally not accepted.',
      },
      UpdateDoctorRequest: {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          gender: {
            oneOf: [
              {
                type: 'string',
                enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
              },
              { type: 'null' },
            ],
          },
          dateOfBirth: { type: ['string', 'null'], format: 'date' },
          staffCode: { type: ['string', 'null'], maxLength: 20 },
          designation: { type: ['string', 'null'], maxLength: 100 },
          specialtyId: { type: 'integer', minimum: 1 },
          registrationNumber: { type: ['string', 'null'], maxLength: 100 },
          qualifications: { type: ['string', 'null'] },
        },
        description: 'Email, password, roleIds, and tenantId are intentionally not accepted.',
      },
      Doctor: {
        type: 'object',
        required: [
          'id',
          'userId',
          'tenantId',
          'name',
          'email',
          'phone',
          'gender',
          'dateOfBirth',
          'staffCode',
          'designation',
          'specialtyId',
          'specialtyName',
          'registrationNumber',
          'qualifications',
          'isActive',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          userId: { type: 'string', minLength: 1 },
          tenantId: {
            type: 'string',
            minLength: 1,
            description: 'Tenant identifier resolved from the authenticated Session.',
          },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          phone: { type: ['string', 'null'] },
          gender: {
            oneOf: [
              {
                type: 'string',
                enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
              },
              { type: 'null' },
            ],
          },
          dateOfBirth: { type: ['string', 'null'], format: 'date' },
          staffCode: { type: ['string', 'null'], maxLength: 20 },
          designation: { type: ['string', 'null'], maxLength: 100 },
          specialtyId: { type: 'integer', minimum: 1 },
          specialtyName: { type: ['string', 'null'], minLength: 1, maxLength: 100 },
          registrationNumber: { type: ['string', 'null'], maxLength: 100 },
          qualifications: { type: ['string', 'null'] },
          isActive: {
            type: 'boolean',
            description:
              'Coupled active state shared with the underlying Staff identity and login.',
          },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      CreateStateRequest: {
        type: 'object',
        required: ['name', 'countryId'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          countryId: { type: 'integer', minimum: 1 },
        },
      },
      UpdateStateRequest: {
        type: 'object',
        required: ['name', 'countryId'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          countryId: { type: 'integer', minimum: 1 },
        },
      },
      StateCountry: {
        type: 'object',
        required: ['id', 'name', 'code'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
          code: { type: 'string' },
        },
      },
      State: {
        type: 'object',
        required: ['id', 'name', 'countryId', 'country', 'createdOn', 'modifiedOn'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
          countryId: { type: 'integer', minimum: 1 },
          country: schemaRef('StateCountry'),
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      CreateAppointmentTypeRequest: appointmentMasterCreateSchema('Appointment Type', true),
      UpdateAppointmentTypeRequest: appointmentMasterCreateSchema('Appointment Type', true),
      AppointmentType: appointmentMasterSchema('CreateAppointmentTypeRequest'),
      CreateVisitTypeRequest: appointmentMasterCreateSchema('Visit Type', true),
      UpdateVisitTypeRequest: appointmentMasterCreateSchema('Visit Type', true),
      VisitType: appointmentMasterSchema('CreateVisitTypeRequest'),
      VisitStatus: {
        type: 'string',
        enum: ['CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'],
        description:
          'Lifecycle state of a Visit. A fixed system-defined set, not a Tenant-scoped Master.',
      },
      CheckInVisitRequest: {
        type: 'object',
        required: ['visitTypeId'],
        description:
          'Send exactly one of: appointmentId (Appointment check-in), or patientId together with doctorId (Walk-in Visit).',
        properties: {
          visitTypeId: {
            type: 'integer',
            minimum: 1,
            description: 'VisitType classifying the Visit.',
          },
          appointmentId: {
            type: 'integer',
            minimum: 1,
            description:
              'Appointment being fulfilled. Must be scheduled for today in the Tenant Time Zone and be in a Scheduled or Confirmed status. The Patient and Doctor are taken from it.',
          },
          patientId: {
            type: 'integer',
            minimum: 1,
            description: 'Walk-in only. Must be a Registered, active Patient.',
          },
          doctorId: {
            type: 'integer',
            minimum: 1,
            description: 'Walk-in only. Must be an active Doctor.',
          },
          chiefComplaint: { type: ['string', 'null'], maxLength: 500 },
          remarks: { type: ['string', 'null'] },
          documents: {
            type: 'array',
            maxItems: 20,
            description:
              'Optional documents already uploaded to Blob (via POST /api/v1/visits/documents), attached to the Visit as it is created.',
            items: schemaRef('VisitDocumentMetadata'),
          },
        },
      },
      UpdateVisitRequest: {
        type: 'object',
        properties: {
          chiefComplaint: { type: ['string', 'null'], maxLength: 500 },
          remarks: { type: ['string', 'null'] },
        },
      },
      CancelVisitRequest: {
        type: 'object',
        required: ['cancellationReason'],
        properties: {
          cancellationReason: { type: 'string', minLength: 1, maxLength: 255 },
        },
      },
      VisitPatientSummary: {
        type: 'object',
        required: ['id', 'mrn', 'firstName', 'lastName', 'phone'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          mrn: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string' },
        },
      },
      VisitDoctorSummary: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
        },
      },
      VisitTypeSummary: {
        type: 'object',
        required: ['id', 'name', 'code'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
          code: { type: 'string' },
        },
      },
      VisitAppointmentSummary: {
        type: 'object',
        required: ['id', 'bookingNumber'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          bookingNumber: { type: 'string', example: 'APT-1042' },
        },
      },
      VisitDocumentMetadata: {
        type: 'object',
        required: ['fileName', 'fileUrl', 'contentType', 'fileSize'],
        description:
          'Metadata for a file already uploaded to Blob. Returned by the upload endpoint and sent back to persist the document against a Visit.',
        properties: {
          fileName: { type: 'string', maxLength: 255, example: 'referral.pdf' },
          fileUrl: {
            type: 'string',
            format: 'uri',
            maxLength: 2048,
            description: 'Public Blob URL returned by the upload endpoint.',
            example:
              'https://abc123.public.blob.vercel-storage.com/tenants/org_apollo/visit-documents/referral-x1y2.pdf',
          },
          contentType: { type: 'string', maxLength: 150, example: 'application/pdf' },
          fileSize: {
            type: 'integer',
            minimum: 1,
            description: 'File size in bytes. At most 4.5MB.',
            example: 20480,
          },
        },
      },
      VisitDocument: {
        type: 'object',
        required: ['id', 'visitId', 'fileName', 'fileUrl', 'contentType', 'fileSize', 'createdOn'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          visitId: { type: 'integer', minimum: 1 },
          fileName: { type: 'string', example: 'referral.pdf' },
          fileUrl: { type: 'string', format: 'uri' },
          contentType: { type: 'string', example: 'application/pdf' },
          fileSize: { type: 'integer', minimum: 1, example: 20480 },
          createdOn: { type: 'string', format: 'date-time' },
        },
      },
      Visit: {
        type: 'object',
        required: [
          'id',
          'tenantId',
          'visitNumber',
          'status',
          'visitDate',
          'queueToken',
          'patient',
          'doctor',
          'visitType',
          'appointment',
          'checkedInAt',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          tenantId: {
            type: 'string',
            description: 'Tenant identifier resolved from the active authenticated Session.',
          },
          visitNumber: {
            type: 'string',
            description: 'Permanent Tenant-scoped identifier assigned by the server.',
            example: 'VST-1001',
          },
          status: schemaRef('VisitStatus'),
          visitDate: {
            type: 'string',
            description: 'Tenant-local date of Check-in, in DD-MM-YYYY format.',
            example: '16-07-2026',
          },
          queueToken: {
            type: 'integer',
            minimum: 1,
            description: 'Ordering number within the Doctor queue for this Tenant-local day.',
          },
          patient: schemaRef('VisitPatientSummary'),
          doctor: schemaRef('VisitDoctorSummary'),
          visitType: schemaRef('VisitTypeSummary'),
          appointment: {
            oneOf: [schemaRef('VisitAppointmentSummary'), { type: 'null' }],
            description: 'The fulfilled Appointment, or null for a Walk-in Visit.',
          },
          chiefComplaint: { type: ['string', 'null'] },
          remarks: { type: ['string', 'null'] },
          checkedInAt: { type: 'string', format: 'date-time' },
          consultationStartedAt: { type: ['string', 'null'], format: 'date-time' },
          completedAt: { type: ['string', 'null'], format: 'date-time' },
          cancelledAt: { type: ['string', 'null'], format: 'date-time' },
          cancellationReason: { type: ['string', 'null'] },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      CreateWardRequest: appointmentMasterCreateSchema('Ward', true),
      UpdateWardRequest: appointmentMasterCreateSchema('Ward', true),
      Ward: appointmentMasterSchema('CreateWardRequest'),
      CreateAdmissionTypeRequest: appointmentMasterCreateSchema('Admission Type', true),
      UpdateAdmissionTypeRequest: appointmentMasterCreateSchema('Admission Type', true),
      AdmissionType: appointmentMasterSchema('CreateAdmissionTypeRequest'),
      ChargeItemCategory: {
        type: 'string',
        enum: ['CONSULTATION', 'PROCEDURE', 'INVESTIGATION', 'BED', 'CONSUMABLE', 'OTHER'],
        description: 'Fixed classification of a Charge Item.',
      },
      CreateChargeItemRequest: {
        type: 'object',
        required: ['name', 'code', 'category', 'unitPrice'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 150 },
          code: {
            type: 'string',
            minLength: 1,
            maxLength: 20,
            description: 'Charge Item code. The API normalizes this value to uppercase.',
          },
          category: schemaRef('ChargeItemCategory'),
          unitPrice: {
            type: 'number',
            minimum: 0,
            description: 'Unit price in the Tenant currency, rounded to two decimals.',
          },
          description: { type: ['string', 'null'], description: 'Charge Item description.' },
          isActive: {
            type: 'boolean',
            default: true,
            description: 'Whether the Charge Item is available for new Invoice Lines.',
          },
        },
      },
      UpdateChargeItemRequest: { $ref: '#/components/schemas/CreateChargeItemRequest' },
      ChargeItem: {
        allOf: [
          schemaRef('CreateChargeItemRequest'),
          {
            type: 'object',
            required: [
              'id',
              'tenantId',
              'name',
              'code',
              'category',
              'unitPrice',
              'isActive',
              'description',
              'createdOn',
              'modifiedOn',
            ],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the active authenticated Session.',
              },
              description: { type: ['string', 'null'] },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      InvoiceStatus: {
        type: 'string',
        enum: ['DRAFT', 'FINALIZED', 'PARTIALLY_PAID', 'PAID', 'VOID'],
        description: 'Lifecycle state of an Invoice. A fixed system-defined set.',
      },
      InvoiceLineSource: {
        type: 'string',
        enum: ['MANUAL', 'BED_AUTO'],
        description:
          'How the line was created: MANUAL (added by a cashier) or BED_AUTO (generated Bed-Day Charge).',
      },
      PaymentMethod: {
        type: 'string',
        enum: ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'],
        description: 'Tender used for a Payment. A fixed system-defined set; excludes insurance.',
      },
      InvoiceLine: {
        type: 'object',
        required: [
          'id',
          'invoiceId',
          'chargeItemId',
          'description',
          'quantity',
          'unitPrice',
          'amount',
          'source',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          invoiceId: { type: 'integer', minimum: 1 },
          chargeItemId: {
            type: ['integer', 'null'],
            description: 'Provenance Charge Item; null on generated Bed-Day Charge lines.',
          },
          description: { type: 'string', description: 'Snapshot taken when the line was added.' },
          quantity: { type: 'integer', minimum: 1 },
          unitPrice: { type: 'number', minimum: 0 },
          amount: {
            type: 'number',
            minimum: 0,
            description: 'quantity × unitPrice, rounded to 2dp.',
          },
          source: schemaRef('InvoiceLineSource'),
        },
      },
      Payment: {
        type: 'object',
        required: [
          'id',
          'invoiceId',
          'receiptNumber',
          'amount',
          'method',
          'reference',
          'notes',
          'receivedAt',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          invoiceId: { type: 'integer', minimum: 1 },
          receiptNumber: {
            type: 'string',
            description: 'Tenant-scoped receipt number, e.g. RCP-2010.',
          },
          amount: { type: 'number', exclusiveMinimum: 0 },
          method: schemaRef('PaymentMethod'),
          reference: { type: ['string', 'null'] },
          notes: { type: ['string', 'null'] },
          receivedAt: { type: 'string', format: 'date-time' },
        },
      },
      InvoicePatientSummary: {
        type: 'object',
        required: ['id', 'mrn', 'firstName', 'lastName'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          mrn: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
        },
      },
      InvoiceVisitSummary: {
        type: ['object', 'null'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          visitNumber: { type: 'string' },
        },
      },
      InvoiceAdmissionSummary: {
        type: ['object', 'null'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          admissionNumber: { type: 'string' },
        },
      },
      Invoice: {
        type: 'object',
        required: [
          'id',
          'tenantId',
          'invoiceNumber',
          'status',
          'subtotal',
          'discountAmount',
          'grandTotal',
          'amountPaid',
          'balanceDue',
          'notes',
          'finalizedAt',
          'voidedAt',
          'voidReason',
          'createdOn',
          'modifiedOn',
          'patient',
          'visit',
          'admission',
          'lines',
          'payments',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          tenantId: {
            type: 'string',
            minLength: 1,
            description: 'Tenant identifier resolved from the active authenticated Session.',
          },
          invoiceNumber: {
            type: 'string',
            description: 'Tenant-scoped invoice number, e.g. INV-1042.',
          },
          status: schemaRef('InvoiceStatus'),
          subtotal: { type: 'number', minimum: 0, description: 'Sum of line amounts.' },
          discountAmount: {
            type: 'number',
            minimum: 0,
            description: 'Flat invoice-level discount.',
          },
          grandTotal: { type: 'number', minimum: 0, description: 'subtotal − discountAmount.' },
          amountPaid: { type: 'number', minimum: 0 },
          balanceDue: { type: 'number', description: 'grandTotal − amountPaid. Always derived.' },
          notes: { type: ['string', 'null'] },
          finalizedAt: { type: ['string', 'null'], format: 'date-time' },
          voidedAt: { type: ['string', 'null'], format: 'date-time' },
          voidReason: { type: ['string', 'null'] },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
          patient: schemaRef('InvoicePatientSummary'),
          visit: schemaRef('InvoiceVisitSummary'),
          admission: schemaRef('InvoiceAdmissionSummary'),
          lines: { type: 'array', items: schemaRef('InvoiceLine') },
          payments: { type: 'array', items: schemaRef('Payment') },
        },
      },
      InvoiceListItem: {
        type: 'object',
        required: [
          'id',
          'invoiceNumber',
          'status',
          'grandTotal',
          'amountPaid',
          'balanceDue',
          'createdOn',
          'patient',
          'visit',
          'admission',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          invoiceNumber: { type: 'string' },
          status: schemaRef('InvoiceStatus'),
          grandTotal: { type: 'number', minimum: 0 },
          amountPaid: { type: 'number', minimum: 0 },
          balanceDue: { type: 'number' },
          createdOn: { type: 'string', format: 'date-time' },
          patient: schemaRef('InvoicePatientSummary'),
          visit: schemaRef('InvoiceVisitSummary'),
          admission: schemaRef('InvoiceAdmissionSummary'),
        },
      },
      CreateInvoiceRequest: {
        type: 'object',
        required: ['patientId'],
        properties: {
          patientId: { type: 'integer', minimum: 1 },
          visitId: {
            type: ['integer', 'null'],
            minimum: 1,
            description: 'Optional source Visit. Mutually exclusive with admissionId.',
          },
          admissionId: {
            type: ['integer', 'null'],
            minimum: 1,
            description: 'Optional source Admission. Mutually exclusive with visitId.',
          },
          notes: { type: ['string', 'null'] },
        },
      },
      UpdateDraftInvoiceRequest: {
        type: 'object',
        properties: {
          discountAmount: {
            type: 'number',
            minimum: 0,
            description:
              'Flat discount, at most the subtotal. This is a full-replace field: omitting it resets the Discount to 0, it does not preserve the current value.',
          },
          notes: {
            type: ['string', 'null'],
            description:
              'Full-replace field: omitting it (or sending null/empty) clears any existing notes, it does not preserve the current value.',
          },
        },
      },
      AddInvoiceLineRequest: {
        type: 'object',
        required: ['chargeItemId', 'quantity'],
        properties: {
          chargeItemId: { type: 'integer', minimum: 1 },
          quantity: { type: 'integer', minimum: 1 },
          unitPrice: {
            type: 'number',
            minimum: 0,
            description: 'Optional price override. Defaults to the Charge Item unit price.',
          },
        },
      },
      VoidInvoiceRequest: {
        type: 'object',
        required: ['voidReason'],
        properties: {
          voidReason: { type: 'string', minLength: 1, maxLength: 255 },
        },
      },
      RecordPaymentRequest: {
        type: 'object',
        required: ['amount', 'method'],
        properties: {
          amount: { type: 'number', exclusiveMinimum: 0 },
          method: schemaRef('PaymentMethod'),
          reference: { type: ['string', 'null'], maxLength: 100 },
          notes: { type: ['string', 'null'], maxLength: 255 },
          receivedAt: {
            type: ['string', 'null'],
            format: 'date-time',
            description: 'Optional; defaults to now. May not be in the future.',
          },
        },
      },
      BedStatus: {
        type: 'string',
        enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'],
        description:
          'Operational state of a Bed. A fixed system-defined set; OCCUPIED is system-managed and set only by Admission lifecycle events.',
      },
      CreateBedRequest: {
        type: 'object',
        required: ['bedNumber', 'wardId'],
        properties: {
          bedNumber: {
            type: 'string',
            minLength: 1,
            maxLength: 20,
            description: 'Unique within the Ward, compared case-insensitively.',
            example: 'ICU-01',
          },
          wardId: { type: 'integer', minimum: 1 },
          roomId: {
            type: ['integer', 'null'],
            minimum: 1,
            description: 'Optional physical Room containing the Bed.',
          },
          status: {
            type: 'string',
            enum: ['AVAILABLE', 'RESERVED', 'MAINTENANCE'],
            default: 'AVAILABLE',
            description: 'OCCUPIED cannot be set manually.',
          },
          notes: { type: ['string', 'null'], maxLength: 500 },
        },
      },
      UpdateBedRequest: schemaRef('CreateBedRequest'),
      BedWardSummary: {
        type: 'object',
        required: ['id', 'name', 'code'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
          code: { type: 'string' },
        },
      },
      BedRoomSummary: {
        type: 'object',
        required: ['id', 'roomNumber'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          roomNumber: { type: 'string', example: '301-A' },
        },
      },
      Bed: {
        type: 'object',
        required: [
          'id',
          'tenantId',
          'bedNumber',
          'wardId',
          'status',
          'ward',
          'room',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          tenantId: {
            type: 'string',
            description: 'Tenant identifier resolved from the active authenticated Session.',
          },
          bedNumber: { type: 'string', example: 'ICU-01' },
          wardId: { type: 'integer', minimum: 1 },
          roomId: { type: ['integer', 'null'] },
          status: schemaRef('BedStatus'),
          notes: { type: ['string', 'null'] },
          ward: schemaRef('BedWardSummary'),
          room: {
            oneOf: [schemaRef('BedRoomSummary'), { type: 'null' }],
            description: 'The containing Room, or null when the Bed is not room-linked.',
          },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      BedBoardOccupant: {
        type: 'object',
        required: ['mrn', 'patientId', 'lastName', 'firstName', 'admissionId', 'admissionNumber'],
        properties: {
          mrn: { type: 'string', example: 'MRN-1042' },
          patientId: { type: 'integer', minimum: 1 },
          lastName: { type: 'string' },
          firstName: { type: 'string' },
          admissionId: { type: 'integer', minimum: 1 },
          admissionNumber: { type: 'string', example: 'ADM-1001' },
        },
      },
      BedBoardBed: {
        type: 'object',
        required: ['id', 'bedNumber', 'status', 'roomNumber', 'occupant'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          bedNumber: { type: 'string' },
          status: schemaRef('BedStatus'),
          roomNumber: { type: ['string', 'null'] },
          occupant: {
            oneOf: [schemaRef('BedBoardOccupant'), { type: 'null' }],
            description: 'The occupying Patient and Admission, or null for a free Bed.',
          },
        },
      },
      BedBoardWard: {
        type: 'object',
        required: ['wardId', 'wardName', 'wardCode', 'beds'],
        properties: {
          wardId: { type: 'integer', minimum: 1 },
          wardName: { type: 'string', example: 'ICU' },
          wardCode: { type: 'string', example: 'ICU' },
          beds: { type: 'array', items: schemaRef('BedBoardBed') },
        },
      },
      AdmissionStatus: {
        type: 'string',
        enum: ['ADMITTED', 'DISCHARGED', 'CANCELLED'],
        description:
          'Lifecycle state of an Admission. A fixed system-defined set, not a Tenant-scoped Master.',
      },
      DischargeDisposition: {
        type: 'string',
        enum: ['ROUTINE', 'LAMA', 'TRANSFERRED', 'DECEASED', 'ABSCONDED'],
        description: 'System-defined outcome of a Discharge. LAMA is leave against medical advice.',
      },
      AdmitPatientRequest: {
        type: 'object',
        required: ['patientId', 'doctorId', 'admissionTypeId', 'bedId'],
        properties: {
          patientId: { type: 'integer', minimum: 1 },
          doctorId: { type: 'integer', minimum: 1, description: 'Admitting Doctor.' },
          admissionTypeId: { type: 'integer', minimum: 1 },
          bedId: {
            type: 'integer',
            minimum: 1,
            description: 'Target Bed. Must be Available or Reserved.',
          },
          visitId: {
            type: 'integer',
            minimum: 1,
            description:
              'Optional source OPD Visit. Must belong to the same Patient and not be cancelled.',
          },
          admissionReason: { type: ['string', 'null'], maxLength: 500 },
          remarks: { type: ['string', 'null'] },
          expectedDischargeDate: {
            type: ['string', 'null'],
            description: 'Expected Discharge Date in DD-MM-YYYY format.',
            example: '20-07-2026',
          },
        },
      },
      UpdateAdmissionRequest: {
        type: 'object',
        properties: {
          admissionReason: { type: ['string', 'null'], maxLength: 500 },
          remarks: { type: ['string', 'null'] },
          expectedDischargeDate: {
            type: ['string', 'null'],
            description: 'Expected Discharge Date in DD-MM-YYYY format.',
            example: '21-07-2026',
          },
        },
      },
      TransferBedRequest: {
        type: 'object',
        required: ['toBedId'],
        properties: {
          toBedId: {
            type: 'integer',
            minimum: 1,
            description: 'Target Bed. Must be Available or Reserved.',
          },
          reason: { type: ['string', 'null'], maxLength: 255 },
        },
      },
      DischargeAdmissionRequest: {
        type: 'object',
        required: ['dischargeDisposition'],
        properties: {
          dischargeDisposition: schemaRef('DischargeDisposition'),
          dischargeSummary: { type: ['string', 'null'] },
        },
      },
      CancelAdmissionRequest: {
        type: 'object',
        required: ['cancellationReason'],
        properties: {
          cancellationReason: { type: 'string', minLength: 1, maxLength: 255 },
        },
      },
      AdmissionPatientSummary: schemaRef('VisitPatientSummary'),
      AdmissionDoctorSummary: schemaRef('VisitDoctorSummary'),
      AdmissionTypeSummary: {
        type: 'object',
        required: ['id', 'name', 'code'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
          code: { type: 'string' },
        },
      },
      AdmissionBedSummary: {
        type: 'object',
        required: ['id', 'bedNumber'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          bedNumber: { type: 'string', example: 'ICU-01' },
        },
      },
      AdmissionVisitSummary: {
        type: 'object',
        required: ['id', 'visitNumber'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          visitNumber: { type: 'string', example: 'VST-1001' },
        },
      },
      Admission: {
        type: 'object',
        required: [
          'id',
          'tenantId',
          'admissionNumber',
          'status',
          'patient',
          'doctor',
          'admissionType',
          'bed',
          'ward',
          'visit',
          'admittedAt',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          tenantId: {
            type: 'string',
            description: 'Tenant identifier resolved from the active authenticated Session.',
          },
          admissionNumber: {
            type: 'string',
            description: 'Permanent Tenant-scoped identifier assigned by the server.',
            example: 'ADM-1001',
          },
          status: schemaRef('AdmissionStatus'),
          admissionReason: { type: ['string', 'null'] },
          remarks: { type: ['string', 'null'] },
          expectedDischargeDate: {
            type: ['string', 'null'],
            description: 'Expected Discharge Date in DD-MM-YYYY format.',
            example: '20-07-2026',
          },
          admittedAt: { type: 'string', format: 'date-time' },
          dischargedAt: { type: ['string', 'null'], format: 'date-time' },
          dischargeDisposition: {
            oneOf: [schemaRef('DischargeDisposition'), { type: 'null' }],
            description: 'Set at Discharge; null while Admitted or Cancelled.',
          },
          dischargeSummary: { type: ['string', 'null'] },
          cancelledAt: { type: ['string', 'null'], format: 'date-time' },
          cancellationReason: { type: ['string', 'null'] },
          patient: schemaRef('AdmissionPatientSummary'),
          doctor: schemaRef('AdmissionDoctorSummary'),
          admissionType: schemaRef('AdmissionTypeSummary'),
          bed: {
            allOf: [schemaRef('AdmissionBedSummary')],
            description: 'The current Bed; transfers update it.',
          },
          ward: schemaRef('BedWardSummary'),
          visit: {
            oneOf: [schemaRef('AdmissionVisitSummary'), { type: 'null' }],
            description: 'The source OPD Visit, or null for a direct Admission.',
          },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      AdmissionBedTransferEntry: {
        type: 'object',
        required: ['id', 'reason', 'transferredAt', 'fromBed', 'toBed'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          reason: { type: ['string', 'null'] },
          transferredAt: { type: 'string', format: 'date-time' },
          fromBed: schemaRef('AdmissionBedSummary'),
          toBed: schemaRef('AdmissionBedSummary'),
        },
      },
      AdmissionDetail: {
        allOf: [
          schemaRef('Admission'),
          {
            type: 'object',
            required: ['transfers'],
            properties: {
              transfers: {
                type: 'array',
                items: schemaRef('AdmissionBedTransferEntry'),
                description: 'Bed Transfer history, oldest first.',
              },
            },
          },
        ],
      },
      CreateAppointmentReasonRequest: appointmentMasterCreateSchema('Appointment Reason', true),
      UpdateAppointmentReasonRequest: appointmentMasterCreateSchema('Appointment Reason', true),
      AppointmentReason: appointmentMasterSchema('CreateAppointmentReasonRequest'),
      CreateAppointmentModeRequest: appointmentMasterCreateSchema('Appointment Mode'),
      UpdateAppointmentModeRequest: appointmentMasterCreateSchema('Appointment Mode'),
      AppointmentMode: appointmentMasterSchema('CreateAppointmentModeRequest'),
      CreateDoctorRotaRequest: {
        type: 'object',
        required: ['name', 'fromTime', 'toTime'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          fromTime: {
            type: 'string',
            pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
            description: 'Start time in 24-hour HH:mm format.',
          },
          toTime: {
            type: 'string',
            pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
            description: 'End time in 24-hour HH:mm format. Must be after fromTime.',
          },
        },
      },
      UpdateDoctorRotaRequest: schemaRef('CreateDoctorRotaRequest'),
      DoctorRota: {
        allOf: [
          schemaRef('CreateDoctorRotaRequest'),
          {
            type: 'object',
            required: ['id', 'tenantId', 'isActive', 'createdOn', 'modifiedOn'],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the active authenticated Session.',
              },
              isActive: { type: 'boolean' },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      CreateDoctorScheduleRequest: {
        type: 'object',
        required: ['rotaIds', 'slotInMinute', 'slotFromDate', 'slotToDate'],
        properties: {
          doctorId: { type: 'integer', minimum: 1 },
          clinicianLicenseId: {
            type: 'integer',
            minimum: 1,
            description: 'Legacy alias accepted for doctorId.',
          },
          rotaIds: { type: 'array', items: { type: 'integer', minimum: 1 }, minItems: 1 },
          slotInMinute: {
            oneOf: [
              { type: 'integer', minimum: 1, maximum: 1440 },
              { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
            ],
            description: 'Slot duration as minutes or legacy HH:mm duration.',
          },
          slotFromDate: { type: 'string', format: 'date' },
          slotToDate: { type: 'string', format: 'date' },
        },
      },
      UpdateDoctorScheduleRequest: {
        type: 'object',
        properties: {
          doctorScheduleId: { type: 'integer', minimum: 1 },
          clinicianScheduleId: {
            type: 'integer',
            minimum: 1,
            description: 'Legacy alias accepted for doctorScheduleId.',
          },
          doctorId: { type: 'integer', minimum: 1 },
          clinicianLicenseId: {
            type: 'integer',
            minimum: 1,
            description: 'Legacy alias accepted for doctorId.',
          },
          rotaIds: { type: 'array', items: { type: 'integer', minimum: 1 }, minItems: 1 },
          rotaType: { type: 'string', enum: ['new', 'remove'] },
          slotInMinute: {
            oneOf: [
              { type: 'integer', minimum: 1, maximum: 1440 },
              { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
            ],
          },
          slotFromDate: { type: 'string', format: 'date' },
          slotToDate: { type: 'string', format: 'date' },
        },
      },
      DoctorScheduleRotaDetail: {
        type: 'object',
        required: ['rotaId', 'rotaName', 'rotaTime', 'fromTime', 'toTime'],
        properties: {
          rotaId: { type: 'integer', minimum: 1 },
          rotaName: { type: 'string' },
          rotaTime: { type: 'string' },
          fromTime: { type: 'string' },
          toTime: { type: 'string' },
        },
      },
      DoctorSchedule: {
        type: 'object',
        required: [
          'id',
          'tenantId',
          'doctorId',
          'isActive',
          'slotFromDate',
          'slotToDate',
          'slotInMinute',
          'slotDurationMinutes',
          'rotaDetails',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          tenantId: {
            type: 'string',
            minLength: 1,
            description: 'Tenant identifier resolved from the active authenticated Session.',
          },
          doctorId: { type: 'integer', minimum: 1 },
          isActive: { type: 'boolean' },
          slotFromDate: { type: 'string', format: 'date' },
          slotToDate: { type: 'string', format: 'date' },
          slotInMinute: { type: 'string' },
          slotDurationMinutes: { type: 'integer', minimum: 1 },
          rotaDetails: {
            type: 'array',
            items: schemaRef('DoctorScheduleRotaDetail'),
          },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      DoctorSlot: {
        type: 'object',
        required: ['slot', 'slotTime', 'slotStatus'],
        properties: {
          slot: { type: 'integer', minimum: 1 },
          slotTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          slotStatus: { type: 'string', enum: ['Available', 'Booked'] },
        },
      },
      DoctorSlotRota: {
        type: 'object',
        required: ['doctorRotaId', 'rotaName', 'duration', 'slots'],
        properties: {
          doctorRotaId: { type: 'integer', minimum: 1 },
          rotaName: { type: 'string' },
          duration: { type: 'integer', minimum: 1 },
          slots: { type: 'array', items: schemaRef('DoctorSlot') },
        },
      },
      DoctorSlotDate: {
        type: 'object',
        required: ['slotDate', 'status', 'rotas'],
        properties: {
          slotDate: { type: 'string', format: 'date' },
          status: { type: 'string', enum: ['Available'] },
          rotas: { type: 'array', items: schemaRef('DoctorSlotRota') },
        },
      },
      CreateAppointmentStatusRequest: {
        type: 'object',
        required: ['name', 'code', 'category'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          code: stringCodeProperty(
            'Appointment Status code. The API normalizes this value to uppercase.'
          ),
          category: {
            type: 'string',
            enum: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
            description:
              'Lifecycle category used by the backend. The protected Scheduled system status is selected automatically by Appointment creation.',
          },
          description: { type: ['string', 'null'], description: 'Appointment Status description.' },
        },
      },
      UpdateAppointmentStatusRequest: schemaRef('CreateAppointmentStatusRequest'),
      AppointmentStatus: {
        allOf: [
          schemaRef('CreateAppointmentStatusRequest'),
          {
            type: 'object',
            required: [
              'id',
              'tenantId',
              'name',
              'code',
              'category',
              'isSystem',
              'description',
              'createdOn',
              'modifiedOn',
            ],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the active authenticated Session.',
              },
              isSystem: {
                type: 'boolean',
                description: 'True for protected system lifecycle statuses seeded for the Tenant.',
              },
              description: { type: ['string', 'null'] },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      ProvisionalPatientInput: {
        type: 'object',
        required: ['firstName', 'lastName', 'phone'],
        additionalProperties: false,
        description:
          'Minimum Patient details accepted when booking by phone before full registration. gender and dateOfBirth are optional here, unlike full Patient registration.',
        properties: {
          firstName: { type: 'string', minLength: 1, maxLength: 100 },
          middleName: { type: 'string', maxLength: 100 },
          lastName: { type: 'string', minLength: 1, maxLength: 100 },
          gender: { type: 'string', enum: ['male', 'female', 'other', 'unknown'] },
          dateOfBirth: {
            type: 'string',
            format: 'date',
            description: 'Must not be in the future.',
          },
          bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
          maritalStatus: {
            type: 'string',
            enum: ['single', 'married', 'divorced', 'widowed', 'other'],
          },
          phone: { type: 'string', minLength: 1, maxLength: 20 },
          alternatePhone: { type: 'string', maxLength: 20 },
          email: { type: 'string', format: 'email', maxLength: 255 },
          addressLine1: { type: 'string', maxLength: 255 },
          addressLine2: { type: 'string', maxLength: 255 },
          city: { type: 'string', maxLength: 100 },
          stateId: {
            type: 'integer',
            minimum: 1,
            description: 'Requires countryId to also be provided, and must belong to that Country.',
          },
          countryId: { type: 'integer', minimum: 1 },
          postalCode: { type: 'string', maxLength: 20 },
          nationalityId: { type: 'integer', minimum: 1 },
          languageId: { type: 'integer', minimum: 1, description: 'Preferred Language.' },
          religionId: { type: 'integer', minimum: 1 },
          govtIdType: {
            type: 'string',
            enum: ['passport', 'national-id', 'driving-license', 'other'],
            description: 'Must be provided together with govtIdNumber.',
          },
          govtIdNumber: { type: 'string', maxLength: 50 },
          emergencyContactName: { type: 'string', maxLength: 150 },
          emergencyContactRelationship: { type: 'string', maxLength: 50 },
          emergencyContactPhone: { type: 'string', maxLength: 20 },
        },
      },
      CreateAppointmentRequest: {
        type: 'object',
        required: [
          'doctorId',
          'appointmentModeId',
          'appointmentTypeId',
          'appointmentReasonId',
          'slotDate',
          'doctorRotaId',
          'slotTimes',
        ],
        additionalProperties: false,
        properties: {
          doctorId: { type: 'integer', minimum: 1, description: 'Doctor identifier.' },
          appointmentModeId: { type: 'integer', minimum: 1 },
          appointmentTypeId: { type: 'integer', minimum: 1 },
          appointmentReasonId: { type: 'integer', minimum: 1 },
          patientId: {
            type: 'integer',
            minimum: 1,
            description:
              'Existing active Patient identifier. Send exactly one of patientId or provisionalPatient.',
          },
          provisionalPatient: schemaRef('ProvisionalPatientInput'),
          slotDate: {
            type: 'string',
            pattern: '^\\d{2}-\\d{2}-\\d{4}$',
            description: 'Appointment slot date in DD-MM-YYYY format.',
            example: '31-12-2099',
          },
          doctorRotaId: { type: 'integer', minimum: 1 },
          slotTimes: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
            description:
              'Ordered HH:mm slot starts. All selected slots must be consecutive in the same DoctorRota.',
          },
          remarks: { type: 'string', maxLength: 1000 },
        },
        oneOf: [{ required: ['patientId'] }, { required: ['provisionalPatient'] }],
      },
      AppointmentReferenceSummary: {
        type: 'object',
        required: ['id', 'name', 'code'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
          code: { type: 'string' },
        },
      },
      AppointmentPatientSummary: {
        type: 'object',
        required: ['id', 'mrn', 'firstName', 'lastName', 'phone', 'registrationStatus'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          mrn: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string' },
          registrationStatus: { type: 'string', enum: ['provisional', 'registered'] },
        },
      },
      PotentialPatientMatch: {
        allOf: [
          schemaRef('AppointmentPatientSummary'),
          {
            type: 'object',
            required: ['isActive'],
            properties: { isActive: { type: 'boolean' } },
          },
        ],
      },
      AppointmentSlotBooking: {
        type: 'object',
        required: ['slotTime', 'status'],
        properties: {
          slotTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          status: { type: 'string', enum: ['Booked'] },
        },
      },
      Appointment: {
        type: 'object',
        required: [
          'id',
          'tenantId',
          'bookingNumber',
          'patient',
          'doctor',
          'appointmentMode',
          'appointmentType',
          'appointmentReason',
          'appointmentStatus',
          'slotDate',
          'rotaName',
          'slots',
          'remarks',
          'createdOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          tenantId: { type: 'string' },
          bookingNumber: { type: 'string', example: 'APT-1001' },
          patient: schemaRef('AppointmentPatientSummary'),
          doctor: {
            type: 'object',
            required: ['id', 'name'],
            properties: { id: { type: 'integer', minimum: 1 }, name: { type: 'string' } },
          },
          appointmentMode: schemaRef('AppointmentReferenceSummary'),
          appointmentType: schemaRef('AppointmentReferenceSummary'),
          appointmentReason: schemaRef('AppointmentReferenceSummary'),
          appointmentStatus: {
            allOf: [
              schemaRef('AppointmentReferenceSummary'),
              {
                type: 'object',
                required: ['category'],
                properties: {
                  category: {
                    type: 'string',
                    enum: [
                      'scheduled',
                      'confirmed',
                      'checked_in',
                      'completed',
                      'cancelled',
                      'no_show',
                    ],
                  },
                },
              },
            ],
          },
          slotDate: { type: 'string', pattern: '^\\d{2}-\\d{2}-\\d{4}$' },
          rotaName: { type: 'string' },
          slots: { type: 'array', items: schemaRef('AppointmentSlotBooking') },
          remarks: { type: ['string', 'null'] },
          createdOn: { type: 'string', format: 'date-time' },
        },
      },
      AppointmentConflictError: {
        allOf: [
          schemaRef('ConflictError'),
          {
            type: 'object',
            properties: {
              patientMatches: { type: 'array', items: schemaRef('PotentialPatientMatch') },
            },
          },
        ],
      },
      CreateDiagnosisCodeRequest: {
        type: 'object',
        required: ['code', 'title'],
        properties: {
          code: {
            type: 'string',
            minLength: 1,
            maxLength: 10,
            description: 'ICD-10 diagnosis code. The API normalizes this value to uppercase.',
          },
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            description: 'Human-readable diagnosis title.',
          },
          category: {
            type: 'string',
            maxLength: 100,
            description: 'Optional ICD chapter or grouping.',
          },
        },
      },
      UpdateDiagnosisCodeRequest: schemaRef('CreateDiagnosisCodeRequest'),
      DiagnosisCode: {
        allOf: [
          schemaRef('CreateDiagnosisCodeRequest'),
          {
            type: 'object',
            required: ['id', 'tenantId', 'code', 'title', 'category', 'createdOn', 'modifiedOn'],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the active authenticated Session.',
              },
              category: { type: ['string', 'null'] },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      CreateAllergenRequest: {
        type: 'object',
        required: ['name', 'code', 'category'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 150 },
          code: {
            type: 'string',
            minLength: 1,
            maxLength: 20,
            description: 'Allergen code. The API normalizes this value to uppercase.',
          },
          category: {
            type: 'string',
            enum: ['drug', 'food', 'environmental', 'other'],
            description: 'Allergen category.',
          },
        },
      },
      UpdateAllergenRequest: schemaRef('CreateAllergenRequest'),
      Allergen: {
        allOf: [
          schemaRef('CreateAllergenRequest'),
          {
            type: 'object',
            required: ['id', 'tenantId', 'name', 'code', 'category', 'createdOn', 'modifiedOn'],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the active authenticated Session.',
              },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      CreateClinicalNoteTypeRequest: {
        type: 'object',
        required: ['name', 'code'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          code: {
            type: 'string',
            minLength: 1,
            maxLength: 20,
            description: 'Clinical note type code. The API normalizes this value to uppercase.',
          },
          description: { type: ['string', 'null'], description: 'Clinical note type description.' },
        },
      },
      UpdateClinicalNoteTypeRequest: schemaRef('CreateClinicalNoteTypeRequest'),
      ClinicalNoteType: {
        allOf: [
          schemaRef('CreateClinicalNoteTypeRequest'),
          {
            type: 'object',
            required: ['id', 'tenantId', 'name', 'code', 'description', 'createdOn', 'modifiedOn'],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the active authenticated Session.',
              },
              description: { type: ['string', 'null'] },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      CreatePatientAllergyRequest: {
        type: 'object',
        required: ['severity'],
        description:
          'Either allergenId (a Tenant Allergen) or substance (free-text) must be supplied.',
        properties: {
          allergenId: {
            type: 'integer',
            minimum: 1,
            description: 'Tenant Allergen reference. Omit when using a free-text substance.',
          },
          substance: {
            type: 'string',
            maxLength: 150,
            description: 'Free-text substance. Omit when an allergenId is supplied.',
          },
          reaction: { type: 'string', maxLength: 255 },
          severity: { type: 'string', enum: ['mild', 'moderate', 'severe'] },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'resolved'],
            description: 'Clinical status. Defaults to "active".',
          },
          notedOn: { type: 'string', format: 'date' },
          notes: { type: 'string', maxLength: 2000 },
        },
      },
      UpdatePatientAllergyRequest: schemaRef('CreatePatientAllergyRequest'),
      PatientAllergy: {
        type: 'object',
        required: [
          'id',
          'tenantId',
          'patientId',
          'severity',
          'status',
          'recordedByUserId',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          tenantId: { type: 'string', minLength: 1 },
          patientId: { type: 'integer', minimum: 1 },
          allergenId: { type: ['integer', 'null'] },
          substance: { type: ['string', 'null'] },
          reaction: { type: ['string', 'null'] },
          severity: { type: 'string', enum: ['mild', 'moderate', 'severe'] },
          status: { type: 'string', enum: ['active', 'inactive', 'resolved'] },
          notedOn: { type: ['string', 'null'], format: 'date' },
          notes: { type: ['string', 'null'] },
          recordedByUserId: {
            type: 'string',
            description: 'Auth user id resolved from the Session that recorded this Allergy.',
          },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      CreatePatientProblemRequest: {
        type: 'object',
        description:
          'Either diagnosisCodeId or a free-text title must be supplied; when a code is given without a title, the code title is used. resolvedDate is only allowed when clinicalStatus is "resolved".',
        properties: {
          diagnosisCodeId: { type: 'integer', minimum: 1 },
          title: { type: 'string', maxLength: 255 },
          clinicalStatus: {
            type: 'string',
            enum: ['active', 'resolved', 'inactive'],
            description: 'Clinical status. Defaults to "active".',
          },
          onsetDate: { type: 'string', format: 'date' },
          resolvedDate: { type: 'string', format: 'date' },
          notes: { type: 'string', maxLength: 2000 },
        },
      },
      UpdatePatientProblemRequest: schemaRef('CreatePatientProblemRequest'),
      PatientProblem: {
        type: 'object',
        required: [
          'id',
          'tenantId',
          'patientId',
          'title',
          'clinicalStatus',
          'recordedByUserId',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          tenantId: { type: 'string', minLength: 1 },
          patientId: { type: 'integer', minimum: 1 },
          diagnosisCodeId: { type: ['integer', 'null'] },
          title: { type: 'string' },
          clinicalStatus: { type: 'string', enum: ['active', 'resolved', 'inactive'] },
          onsetDate: { type: ['string', 'null'], format: 'date' },
          resolvedDate: { type: ['string', 'null'], format: 'date' },
          notes: { type: ['string', 'null'] },
          recordedByUserId: { type: 'string' },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      CreatePatientVitalSignRequest: {
        type: 'object',
        description:
          'At least one measurement must be supplied. BMI is computed server-side when height and weight are both present and is not accepted in the request.',
        properties: {
          visitId: {
            type: 'integer',
            minimum: 1,
            description:
              'Optional Visit this observation was captured during. The Visit must belong to this Patient and still be Active (Checked In or In Consultation). Omit for a standalone observation.',
          },
          admissionId: {
            type: 'integer',
            minimum: 1,
            description:
              'Optional Admission this observation was captured during. The Admission must belong to this Patient and still be Admitted. A record may reference a Visit or an Admission, not both.',
          },
          recordedAt: { type: 'string', format: 'date-time' },
          heightCm: { type: 'number', minimum: 0, maximum: 300 },
          weightKg: { type: 'number', minimum: 0, maximum: 700 },
          systolic: { type: 'integer', minimum: 0, maximum: 400 },
          diastolic: { type: 'integer', minimum: 0, maximum: 400 },
          pulseBpm: { type: 'integer', minimum: 0, maximum: 400 },
          respRate: { type: 'integer', minimum: 0, maximum: 150 },
          temperatureC: { type: 'number', minimum: 20, maximum: 45 },
          spo2: { type: 'integer', minimum: 0, maximum: 100 },
          painScore: { type: 'integer', minimum: 0, maximum: 10 },
          notes: { type: 'string', maxLength: 2000 },
        },
      },
      UpdatePatientVitalSignRequest: schemaRef('CreatePatientVitalSignRequest'),
      PatientVitalSign: {
        type: 'object',
        required: [
          'id',
          'tenantId',
          'patientId',
          'recordedAt',
          'recordedByUserId',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          tenantId: { type: 'string', minLength: 1 },
          patientId: { type: 'integer', minimum: 1 },
          visitId: { type: ['integer', 'null'] },
          admissionId: { type: ['integer', 'null'] },
          recordedAt: { type: 'string', format: 'date-time' },
          heightCm: { type: ['number', 'null'] },
          weightKg: { type: ['number', 'null'] },
          bmi: {
            type: ['number', 'null'],
            description:
              'Computed server-side to one decimal place when height and weight present.',
          },
          systolic: { type: ['integer', 'null'] },
          diastolic: { type: ['integer', 'null'] },
          pulseBpm: { type: ['integer', 'null'] },
          respRate: { type: ['integer', 'null'] },
          temperatureC: { type: ['number', 'null'] },
          spo2: { type: ['integer', 'null'] },
          painScore: { type: ['integer', 'null'] },
          notes: { type: ['string', 'null'] },
          recordedByUserId: { type: 'string' },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      CreatePatientMedicationRequest: {
        type: 'object',
        required: ['drugName'],
        description: 'endDate, when present, must be on or after startDate.',
        properties: {
          drugName: { type: 'string', minLength: 1, maxLength: 200 },
          dose: { type: 'string', maxLength: 100 },
          route: { type: 'string', maxLength: 50 },
          frequency: { type: 'string', maxLength: 100 },
          status: {
            type: 'string',
            enum: ['active', 'stopped', 'completed'],
            description: 'Medication status. Defaults to "active".',
          },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          notes: { type: 'string', maxLength: 2000 },
        },
      },
      UpdatePatientMedicationRequest: schemaRef('CreatePatientMedicationRequest'),
      PatientMedication: {
        type: 'object',
        required: [
          'id',
          'tenantId',
          'patientId',
          'drugName',
          'status',
          'recordedByUserId',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          tenantId: { type: 'string', minLength: 1 },
          patientId: { type: 'integer', minimum: 1 },
          drugName: { type: 'string' },
          dose: { type: ['string', 'null'] },
          route: { type: ['string', 'null'] },
          frequency: { type: ['string', 'null'] },
          status: { type: 'string', enum: ['active', 'stopped', 'completed'] },
          startDate: { type: ['string', 'null'], format: 'date' },
          endDate: { type: ['string', 'null'], format: 'date' },
          notes: { type: ['string', 'null'] },
          recordedByUserId: { type: 'string' },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      CreateClinicalNoteRequest: {
        type: 'object',
        required: ['noteTypeId'],
        description:
          'At least one SOAP section (subjective, objective, assessment, plan) must be non-empty. Notes are created in "draft" status; author and recorder are resolved from the Session.',
        properties: {
          noteTypeId: { type: 'integer', minimum: 1 },
          visitId: {
            type: 'integer',
            minimum: 1,
            description:
              'Optional Visit this note was authored during. The Visit must belong to this Patient and still be Active (Checked In or In Consultation). Omit for a standalone note.',
          },
          admissionId: {
            type: 'integer',
            minimum: 1,
            description:
              'Optional Admission this note was authored during. The Admission must belong to this Patient and still be Admitted. A record may reference a Visit or an Admission, not both.',
          },
          subjective: { type: 'string', maxLength: 20000 },
          objective: { type: 'string', maxLength: 20000 },
          assessment: { type: 'string', maxLength: 20000 },
          plan: { type: 'string', maxLength: 20000 },
        },
      },
      UpdateClinicalNoteRequest: schemaRef('CreateClinicalNoteRequest'),
      ClinicalNote: {
        type: 'object',
        required: [
          'id',
          'tenantId',
          'patientId',
          'noteTypeId',
          'status',
          'authorUserId',
          'recordedByUserId',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          tenantId: { type: 'string', minLength: 1 },
          patientId: { type: 'integer', minimum: 1 },
          visitId: { type: ['integer', 'null'] },
          admissionId: { type: ['integer', 'null'] },
          noteTypeId: { type: 'integer', minimum: 1 },
          subjective: { type: ['string', 'null'] },
          objective: { type: ['string', 'null'] },
          assessment: { type: ['string', 'null'] },
          plan: { type: ['string', 'null'] },
          status: { type: 'string', enum: ['draft', 'signed'] },
          signedAt: {
            type: ['string', 'null'],
            format: 'date-time',
            description: 'Set when the note is signed; null while in draft.',
          },
          authorUserId: { type: 'string' },
          recordedByUserId: { type: 'string' },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      PatientChart: {
        type: 'object',
        required: ['allergies', 'problems', 'vitalSigns', 'medications', 'clinicalNotes'],
        description:
          'Aggregated clinical view of a single Patient. Not a stored entity — a composition over the clinical record types.',
        properties: {
          allergies: { type: 'array', items: schemaRef('PatientAllergy') },
          problems: { type: 'array', items: schemaRef('PatientProblem') },
          vitalSigns: { type: 'array', items: schemaRef('PatientVitalSign') },
          medications: { type: 'array', items: schemaRef('PatientMedication') },
          clinicalNotes: { type: 'array', items: schemaRef('ClinicalNote') },
        },
      },
      CreateAppointmentCancelledReasonRequest: appointmentMasterCreateSchema(
        'Appointment Cancelled Reason',
        true
      ),
      UpdateAppointmentCancelledReasonRequest: appointmentMasterCreateSchema(
        'Appointment Cancelled Reason',
        true
      ),
      AppointmentCancelledReason: appointmentMasterSchema(
        'CreateAppointmentCancelledReasonRequest'
      ),
      AssetMasterSummary: {
        type: 'object',
        required: ['id', 'name', 'color'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
          color: {
            type: 'string',
            pattern: '^#[0-9A-Fa-f]{6}$',
            description: 'Display color as a #RRGGBB hex value.',
          },
        },
      },
      CreateAssetRequest: {
        type: 'object',
        required: ['name', 'categoryId', 'statusId', 'serialNumber'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 150 },
          categoryId: { type: 'integer', minimum: 1 },
          statusId: { type: 'integer', minimum: 1 },
          conditionId: { type: 'integer', minimum: 1 },
          manufacturer: { type: 'string', maxLength: 150 },
          model: { type: 'string', maxLength: 150 },
          serialNumber: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Asset serial number. Must be unique per Tenant, case-insensitively.',
          },
          facility: {
            type: 'string',
            maxLength: 150,
            description: 'Free-text Facility location for now.',
          },
          department: {
            type: 'string',
            maxLength: 150,
            description: 'Free-text Department location for now.',
          },
          location: {
            type: 'string',
            maxLength: 200,
            description: 'Free-text physical location.',
          },
          custodian: {
            type: 'string',
            maxLength: 150,
            description: 'Free-text Custodian; omit when the Asset is unassigned.',
          },
          purchaseDate: { type: 'string', format: 'date' },
          warrantyExpiry: { type: 'string', format: 'date' },
          cost: { type: 'number', minimum: 0 },
          currentValue: { type: 'number', minimum: 0 },
          lastServiceDate: { type: 'string', format: 'date' },
          nextServiceDate: { type: 'string', format: 'date' },
          calibrationDate: { type: 'string', format: 'date' },
        },
      },
      UpdateAssetRequest: schemaRef('CreateAssetRequest'),
      Asset: {
        type: 'object',
        required: [
          'id',
          'tenantId',
          'name',
          'categoryId',
          'statusId',
          'conditionId',
          'manufacturer',
          'model',
          'serialNumber',
          'facility',
          'department',
          'location',
          'custodian',
          'purchaseDate',
          'warrantyExpiry',
          'cost',
          'currentValue',
          'lastServiceDate',
          'nextServiceDate',
          'calibrationDate',
          'category',
          'status',
          'condition',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          tenantId: {
            type: 'string',
            minLength: 1,
            description: 'Tenant identifier resolved from the active authenticated Session.',
          },
          name: { type: 'string', minLength: 1, maxLength: 150 },
          categoryId: { type: 'integer', minimum: 1 },
          statusId: { type: 'integer', minimum: 1 },
          conditionId: { type: ['integer', 'null'], minimum: 1 },
          manufacturer: { type: ['string', 'null'], maxLength: 150 },
          model: { type: ['string', 'null'], maxLength: 150 },
          serialNumber: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Asset serial number. Unique per Tenant, case-insensitively.',
          },
          facility: { type: ['string', 'null'], maxLength: 150 },
          department: { type: ['string', 'null'], maxLength: 150 },
          location: { type: ['string', 'null'], maxLength: 200 },
          custodian: { type: ['string', 'null'], maxLength: 150 },
          purchaseDate: { type: ['string', 'null'], format: 'date' },
          warrantyExpiry: { type: ['string', 'null'], format: 'date' },
          cost: { type: ['number', 'null'], minimum: 0 },
          currentValue: { type: ['number', 'null'], minimum: 0 },
          lastServiceDate: { type: ['string', 'null'], format: 'date' },
          nextServiceDate: { type: ['string', 'null'], format: 'date' },
          calibrationDate: { type: ['string', 'null'], format: 'date' },
          category: schemaRef('AssetMasterSummary'),
          status: schemaRef('AssetMasterSummary'),
          condition: {
            oneOf: [schemaRef('AssetMasterSummary'), { type: 'null' }],
          },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      PatientReferenceSummary: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
        },
      },
      PatientCountrySummary: {
        type: 'object',
        required: ['id', 'name', 'code'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
          code: { type: 'string' },
        },
      },
      CreatePatientRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'gender', 'dateOfBirth', 'phone'],
        properties: {
          firstName: { type: 'string', minLength: 1, maxLength: 100 },
          middleName: { type: 'string', maxLength: 100 },
          lastName: { type: 'string', minLength: 1, maxLength: 100 },
          gender: { type: 'string', enum: ['male', 'female', 'other', 'unknown'] },
          dateOfBirth: {
            type: 'string',
            format: 'date',
            description: 'Must not be in the future.',
          },
          bloodGroup: {
            type: 'string',
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
          },
          maritalStatus: {
            type: 'string',
            enum: ['single', 'married', 'divorced', 'widowed', 'other'],
          },
          preferredPaymentMethod: {
            type: 'string',
            enum: ['cash', 'insurance', 'self-pay', 'corporate'],
            description:
              'Default payment means for front-desk registration. A convenience hint only — actual insurance coverage is captured per Visit.',
          },
          phone: { type: 'string', minLength: 1, maxLength: 20 },
          alternatePhone: { type: 'string', maxLength: 20 },
          email: { type: 'string', format: 'email', maxLength: 255 },
          addressLine1: { type: 'string', maxLength: 255 },
          addressLine2: { type: 'string', maxLength: 255 },
          city: { type: 'string', maxLength: 100 },
          stateId: {
            type: 'integer',
            minimum: 1,
            description: 'Requires countryId to also be provided, and must belong to that Country.',
          },
          countryId: { type: 'integer', minimum: 1 },
          postalCode: { type: 'string', maxLength: 20 },
          nationalityId: { type: 'integer', minimum: 1 },
          languageId: { type: 'integer', minimum: 1, description: 'Preferred Language.' },
          religionId: { type: 'integer', minimum: 1 },
          govtIdType: {
            type: 'string',
            enum: ['passport', 'national-id', 'driving-license', 'other'],
            description: 'Must be provided together with govtIdNumber.',
          },
          govtIdNumber: {
            type: 'string',
            maxLength: 50,
            description:
              'Government ID number. Unique per Tenant (case-insensitive) together with govtIdType.',
          },
          emergencyContactName: { type: 'string', maxLength: 150 },
          emergencyContactRelationship: { type: 'string', maxLength: 50 },
          emergencyContactPhone: { type: 'string', maxLength: 20 },
        },
      },
      UpdatePatientRequest: schemaRef('CreatePatientRequest'),
      Patient: {
        type: 'object',
        required: [
          'id',
          'tenantId',
          'mrn',
          'firstName',
          'middleName',
          'lastName',
          'gender',
          'dateOfBirth',
          'registrationStatus',
          'bloodGroup',
          'maritalStatus',
          'preferredPaymentMethod',
          'phone',
          'alternatePhone',
          'email',
          'addressLine1',
          'addressLine2',
          'city',
          'stateId',
          'state',
          'countryId',
          'country',
          'postalCode',
          'nationalityId',
          'nationality',
          'languageId',
          'language',
          'religionId',
          'religion',
          'govtIdType',
          'govtIdNumber',
          'emergencyContactName',
          'emergencyContactRelationship',
          'emergencyContactPhone',
          'isActive',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          tenantId: {
            type: 'string',
            minLength: 1,
            description: 'Tenant identifier resolved from the active authenticated Session.',
          },
          mrn: {
            type: 'string',
            description:
              'Server-generated Medical Record Number, e.g. MRN-1042. Immutable after registration.',
          },
          firstName: { type: 'string', minLength: 1, maxLength: 100 },
          middleName: { type: ['string', 'null'], maxLength: 100 },
          lastName: { type: 'string', minLength: 1, maxLength: 100 },
          gender: {
            oneOf: [
              { type: 'string', enum: ['male', 'female', 'other', 'unknown'] },
              { type: 'null' },
            ],
          },
          dateOfBirth: { type: ['string', 'null'], format: 'date' },
          registrationStatus: {
            type: 'string',
            enum: ['provisional', 'registered'],
            description:
              'Server-controlled Patient registration state. Appointment booking may create provisional Patients.',
          },
          bloodGroup: {
            oneOf: [
              { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
              { type: 'null' },
            ],
          },
          maritalStatus: {
            oneOf: [
              { type: 'string', enum: ['single', 'married', 'divorced', 'widowed', 'other'] },
              { type: 'null' },
            ],
          },
          preferredPaymentMethod: {
            oneOf: [
              { type: 'string', enum: ['cash', 'insurance', 'self-pay', 'corporate'] },
              { type: 'null' },
            ],
          },
          phone: { type: 'string', minLength: 1, maxLength: 20 },
          alternatePhone: { type: ['string', 'null'], maxLength: 20 },
          email: { type: ['string', 'null'], format: 'email', maxLength: 255 },
          addressLine1: { type: ['string', 'null'], maxLength: 255 },
          addressLine2: { type: ['string', 'null'], maxLength: 255 },
          city: { type: ['string', 'null'], maxLength: 100 },
          stateId: { type: ['integer', 'null'], minimum: 1 },
          state: { oneOf: [schemaRef('PatientReferenceSummary'), { type: 'null' }] },
          countryId: { type: ['integer', 'null'], minimum: 1 },
          country: { oneOf: [schemaRef('PatientCountrySummary'), { type: 'null' }] },
          postalCode: { type: ['string', 'null'], maxLength: 20 },
          nationalityId: { type: ['integer', 'null'], minimum: 1 },
          nationality: { oneOf: [schemaRef('PatientReferenceSummary'), { type: 'null' }] },
          languageId: { type: ['integer', 'null'], minimum: 1 },
          language: { oneOf: [schemaRef('PatientReferenceSummary'), { type: 'null' }] },
          religionId: { type: ['integer', 'null'], minimum: 1 },
          religion: { oneOf: [schemaRef('PatientReferenceSummary'), { type: 'null' }] },
          govtIdType: {
            oneOf: [
              { type: 'string', enum: ['passport', 'national-id', 'driving-license', 'other'] },
              { type: 'null' },
            ],
          },
          govtIdNumber: { type: ['string', 'null'], maxLength: 50 },
          emergencyContactName: { type: ['string', 'null'], maxLength: 150 },
          emergencyContactRelationship: { type: ['string', 'null'], maxLength: 50 },
          emergencyContactPhone: { type: ['string', 'null'], maxLength: 20 },
          isActive: { type: 'boolean' },
          createdOn: { type: 'string', format: 'date-time' },
          modifiedOn: { type: 'string', format: 'date-time' },
        },
      },
      CreateWorkOrderRequest: {
        type: 'object',
        required: ['assetId', 'typeId', 'priorityId', 'statusId'],
        properties: {
          assetId: { type: 'integer', minimum: 1 },
          typeId: { type: 'integer', minimum: 1 },
          priorityId: { type: 'integer', minimum: 1 },
          statusId: {
            type: 'integer',
            minimum: 1,
            description:
              'Work Order Status in the active Tenant. A Completed-category Status records completion at the current server time.',
          },
          technician: {
            type: ['string', 'null'],
            maxLength: 150,
            description:
              'Free-text Work Order Technician; may identify internal Staff or an external service provider.',
          },
          dueDate: {
            type: ['string', 'null'],
            format: 'date',
            description: 'Planned due date. Null means no due date and never means On hold.',
          },
          note: { type: ['string', 'null'], description: 'Maintenance scope or fault note.' },
        },
      },
      WorkOrderAssetSummary: {
        type: 'object',
        required: ['id', 'name', 'model', 'serialNumber'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string', minLength: 1, maxLength: 150 },
          model: { type: ['string', 'null'], maxLength: 150 },
          serialNumber: { type: 'string', minLength: 1, maxLength: 100 },
        },
      },
      WorkOrderStatusSummary: {
        allOf: [
          schemaRef('AssetMasterSummary'),
          {
            type: 'object',
            required: ['category'],
            properties: {
              category: {
                type: 'string',
                enum: ['OPEN', 'IN_PROGRESS', 'SCHEDULED', 'COMPLETED', 'OVERDUE'],
              },
            },
          },
        ],
      },
      WorkOrder: {
        type: 'object',
        required: [
          'id',
          'tenantId',
          'code',
          'assetId',
          'typeId',
          'priorityId',
          'statusId',
          'technician',
          'dueDate',
          'completedOn',
          'note',
          'type',
          'priority',
          'status',
          'asset',
          'createdOn',
          'modifiedOn',
        ],
        properties: {
          id: { type: 'integer', minimum: 1 },
          tenantId: {
            type: 'string',
            minLength: 1,
            description: 'Tenant identifier resolved from the active authenticated Session.',
          },
          code: {
            type: 'string',
            pattern: '^WO-[0-9]{4,}$',
            readOnly: true,
            description: 'Permanent system-generated Work Order code, unique per Tenant.',
          },
          assetId: { type: 'integer', minimum: 1 },
          typeId: { type: 'integer', minimum: 1 },
          priorityId: { type: 'integer', minimum: 1 },
          statusId: { type: 'integer', minimum: 1 },
          technician: { type: ['string', 'null'], maxLength: 150 },
          dueDate: { type: ['string', 'null'], format: 'date' },
          completedOn: {
            type: ['string', 'null'],
            format: 'date-time',
            readOnly: true,
          },
          note: { type: ['string', 'null'] },
          type: schemaRef('AssetMasterSummary'),
          priority: schemaRef('AssetMasterSummary'),
          status: schemaRef('WorkOrderStatusSummary'),
          asset: schemaRef('WorkOrderAssetSummary'),
          createdOn: { type: 'string', format: 'date-time', readOnly: true },
          modifiedOn: { type: 'string', format: 'date-time', readOnly: true },
        },
      },
      WorkOrderSummary: {
        type: 'object',
        required: ['activeCount', 'overdueCount', 'dueNext7DaysCount', 'completedLast30dCount'],
        properties: {
          activeCount: {
            type: 'integer',
            minimum: 0,
            description:
              'Non-deleted Work Orders whose Work Order Status Category is not Completed. Includes Overdue Work Orders.',
          },
          overdueCount: {
            type: 'integer',
            minimum: 0,
            description:
              'Non-deleted Work Orders whose explicitly assigned Work Order Status Category is Overdue.',
          },
          dueNext7DaysCount: {
            type: 'integer',
            minimum: 0,
            description:
              'Non-deleted, non-Completed Work Orders with a due date in [PostgreSQL current_date, current_date + 7 days). The database session timezone defines current_date.',
          },
          completedLast30dCount: {
            type: 'integer',
            minimum: 0,
            description:
              'Non-deleted Work Orders in the Completed Category whose server-managed completedOn is within the preceding rolling 30 days.',
          },
        },
      },
      AssetCategoryCount: {
        type: 'object',
        required: ['categoryId', 'name', 'color', 'count'],
        properties: {
          categoryId: {
            type: 'integer',
            minimum: 1,
            description: 'Active Asset Category identifier.',
          },
          name: {
            type: 'string',
            description: 'Asset Category display name.',
          },
          color: {
            type: 'string',
            pattern: '^#[0-9A-Fa-f]{6}$',
            description: 'Asset Category display color.',
          },
          count: {
            type: 'integer',
            minimum: 0,
            description:
              'Number of non-deleted Assets assigned to the Asset Category. Zero-count active categories are included.',
          },
        },
      },
      AssetSummary: {
        type: 'object',
        required: ['totalAssets', 'portfolioValue', 'outOfServiceCount', 'byCategory'],
        properties: {
          totalAssets: {
            type: 'integer',
            minimum: 0,
            description:
              'Count of all non-deleted Assets in the active Tenant, including Retired Assets.',
          },
          portfolioValue: {
            type: 'number',
            minimum: 0,
            description:
              'Sum of coalesce(current_value, 0) across all non-deleted Assets in the Tenant Reporting Currency.',
          },
          outOfServiceCount: {
            type: 'integer',
            minimum: 0,
            description:
              'Count of non-deleted Assets whose joined Asset Status code is MAINT or REPAIR.',
          },
          byCategory: {
            type: 'array',
            description:
              'Every active Asset Category ordered by name, including categories with zero Assets.',
            items: schemaRef('AssetCategoryCount'),
          },
        },
      },
      CreateAssetCategoryRequest: {
        type: 'object',
        required: ['name', 'code', 'color'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          code: stringCodeProperty(
            'Asset Category code. The API normalizes this value to uppercase.'
          ),
          color: {
            type: 'string',
            pattern: '^#[0-9A-Fa-f]{6}$',
            description: 'Asset Category display color as a #RRGGBB hex value.',
          },
          description: { type: 'string', description: 'Asset Category description.' },
        },
      },
      UpdateAssetCategoryRequest: schemaRef('CreateAssetCategoryRequest'),
      AssetCategory: {
        allOf: [
          schemaRef('CreateAssetCategoryRequest'),
          {
            type: 'object',
            required: [
              'id',
              'tenantId',
              'name',
              'code',
              'color',
              'description',
              'createdOn',
              'modifiedOn',
            ],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the active authenticated Session.',
              },
              description: { type: ['string', 'null'] },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      CreateAssetStatusRequest: {
        type: 'object',
        required: ['name', 'code', 'color'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          code: stringCodeProperty(
            'Asset Status code. The API normalizes this value to uppercase.'
          ),
          color: {
            type: 'string',
            pattern: '^#[0-9A-Fa-f]{6}$',
            description: 'Asset Status display color as a #RRGGBB hex value.',
          },
          description: { type: 'string', description: 'Asset Status description.' },
        },
      },
      UpdateAssetStatusRequest: schemaRef('CreateAssetStatusRequest'),
      AssetStatus: {
        allOf: [
          schemaRef('CreateAssetStatusRequest'),
          {
            type: 'object',
            required: [
              'id',
              'tenantId',
              'name',
              'code',
              'color',
              'description',
              'createdOn',
              'modifiedOn',
            ],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the active authenticated Session.',
              },
              description: { type: ['string', 'null'] },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      CreateAssetConditionRequest: {
        type: 'object',
        required: ['name', 'code', 'color'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          code: stringCodeProperty(
            'Asset Condition code. The API normalizes this value to uppercase.'
          ),
          color: {
            type: 'string',
            pattern: '^#[0-9A-Fa-f]{6}$',
            description: 'Asset Condition display color as a #RRGGBB hex value.',
          },
          description: { type: 'string', description: 'Asset Condition description.' },
        },
      },
      UpdateAssetConditionRequest: schemaRef('CreateAssetConditionRequest'),
      AssetCondition: {
        allOf: [
          schemaRef('CreateAssetConditionRequest'),
          {
            type: 'object',
            required: [
              'id',
              'tenantId',
              'name',
              'code',
              'color',
              'description',
              'createdOn',
              'modifiedOn',
            ],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the active authenticated Session.',
              },
              description: { type: ['string', 'null'] },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      RoomStatus: {
        type: 'string',
        enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'CLEANING'],
        description: 'Operational state of a Room.',
      },
      CreateRoomTypeRequest: {
        type: 'object',
        required: ['name', 'code', 'color'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          code: stringCodeProperty('Room Type code. The API normalizes this value to uppercase.'),
          color: {
            type: 'string',
            pattern: '^#[0-9A-Fa-f]{6}$',
            description: 'Room Type display color as a #RRGGBB hex value.',
          },
          dailyRate: {
            type: ['number', 'null'],
            minimum: 0,
            maximum: 99999999.99,
            description:
              'Daily tariff for a Room of this Room Type, in the Tenant Reporting Currency. Omit when the Tenant does not price this Room Type.',
          },
          description: { type: ['string', 'null'], description: 'Room Type description.' },
        },
      },
      UpdateRoomTypeRequest: schemaRef('CreateRoomTypeRequest'),
      RoomType: {
        allOf: [
          schemaRef('CreateRoomTypeRequest'),
          {
            type: 'object',
            required: [
              'id',
              'tenantId',
              'name',
              'code',
              'color',
              'dailyRate',
              'description',
              'createdOn',
              'modifiedOn',
            ],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the active authenticated Session.',
              },
              dailyRate: { type: ['number', 'null'] },
              description: { type: ['string', 'null'] },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      CreateRoomRequest: {
        type: 'object',
        required: ['roomNumber', 'roomTypeId', 'status', 'bedCount'],
        properties: {
          roomNumber: {
            type: 'string',
            minLength: 1,
            maxLength: 20,
            description: 'Room number, unique within the Tenant and compared case-insensitively.',
          },
          roomTypeId: {
            type: 'integer',
            minimum: 1,
            description: 'Room Type Master in the same Tenant.',
          },
          status: schemaRef('RoomStatus'),
          bedCount: {
            type: 'integer',
            minimum: 1,
            maximum: 50,
            description: 'Number of Beds the Room holds.',
          },
          floor: { type: ['string', 'null'], maxLength: 20 },
          wing: { type: ['string', 'null'], maxLength: 50 },
          facility: { type: ['string', 'null'], maxLength: 150 },
          department: { type: ['string', 'null'], maxLength: 150 },
          notes: { type: ['string', 'null'], maxLength: 500 },
        },
      },
      UpdateRoomRequest: schemaRef('CreateRoomRequest'),
      Room: {
        allOf: [
          schemaRef('CreateRoomRequest'),
          {
            type: 'object',
            required: [
              'id',
              'tenantId',
              'roomNumber',
              'roomTypeId',
              'status',
              'bedCount',
              'floor',
              'wing',
              'facility',
              'department',
              'notes',
              'roomType',
              'createdOn',
              'modifiedOn',
            ],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the active authenticated Session.',
              },
              floor: { type: ['string', 'null'] },
              wing: { type: ['string', 'null'] },
              facility: { type: ['string', 'null'] },
              department: { type: ['string', 'null'] },
              notes: { type: ['string', 'null'] },
              roomType: {
                type: 'object',
                description: 'Room Type Master resolved for the Room.',
                required: ['id', 'name', 'code', 'color', 'dailyRate'],
                properties: {
                  id: { type: 'integer', minimum: 1 },
                  name: { type: 'string' },
                  code: { type: 'string' },
                  color: { type: 'string' },
                  dailyRate: { type: ['number', 'null'] },
                },
              },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      RoomSummary: {
        type: 'object',
        required: [
          'totalRooms',
          'totalBeds',
          'availableRooms',
          'occupancyRate',
          'byStatus',
          'byType',
        ],
        properties: {
          totalRooms: { type: 'integer', minimum: 0 },
          totalBeds: { type: 'integer', minimum: 0 },
          availableRooms: { type: 'integer', minimum: 0 },
          occupancyRate: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Percentage of Rooms in the OCCUPIED Room Status, rounded to one decimal.',
          },
          byStatus: {
            type: 'array',
            items: {
              type: 'object',
              required: ['status', 'count'],
              properties: {
                status: schemaRef('RoomStatus'),
                count: { type: 'integer', minimum: 0 },
              },
            },
          },
          byType: {
            type: 'array',
            items: {
              type: 'object',
              required: ['roomTypeId', 'name', 'color', 'count'],
              properties: {
                roomTypeId: { type: 'integer', minimum: 1 },
                name: { type: 'string' },
                color: { type: 'string' },
                count: { type: 'integer', minimum: 0 },
              },
            },
          },
        },
      },
      CreateWorkOrderTypeRequest: {
        type: 'object',
        required: ['name', 'code', 'color'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          code: stringCodeProperty(
            'Work Order Type code. The API normalizes this value to uppercase.'
          ),
          color: {
            type: 'string',
            pattern: '^#[0-9A-Fa-f]{6}$',
            description: 'Work Order Type display color as a #RRGGBB hex value.',
          },
          description: { type: 'string', description: 'Work Order Type description.' },
        },
      },
      UpdateWorkOrderTypeRequest: schemaRef('CreateWorkOrderTypeRequest'),
      WorkOrderType: {
        allOf: [
          schemaRef('CreateWorkOrderTypeRequest'),
          {
            type: 'object',
            required: [
              'id',
              'tenantId',
              'name',
              'code',
              'color',
              'description',
              'createdOn',
              'modifiedOn',
            ],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the active authenticated Session.',
              },
              description: { type: ['string', 'null'] },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      CreateWorkOrderPriorityRequest: {
        type: 'object',
        required: ['name', 'code', 'color'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          code: stringCodeProperty(
            'Work Order Priority code. The API normalizes this value to uppercase.'
          ),
          color: {
            type: 'string',
            pattern: '^#[0-9A-Fa-f]{6}$',
            description: 'Work Order Priority display color as a #RRGGBB hex value.',
          },
          description: { type: 'string', description: 'Work Order Priority description.' },
        },
      },
      UpdateWorkOrderPriorityRequest: schemaRef('CreateWorkOrderPriorityRequest'),
      WorkOrderPriority: {
        allOf: [
          schemaRef('CreateWorkOrderPriorityRequest'),
          {
            type: 'object',
            required: [
              'id',
              'tenantId',
              'name',
              'code',
              'color',
              'description',
              'createdOn',
              'modifiedOn',
            ],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the active authenticated Session.',
              },
              description: { type: ['string', 'null'] },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      CreateWorkOrderStatusRequest: {
        type: 'object',
        required: ['name', 'code', 'category', 'color'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          code: stringCodeProperty(
            'Work Order Status code. The API normalizes this value to uppercase.'
          ),
          category: {
            type: 'string',
            enum: ['OPEN', 'IN_PROGRESS', 'SCHEDULED', 'COMPLETED', 'OVERDUE'],
            description:
              'System-defined lifecycle meaning used for Work Order rules and reporting.',
          },
          color: {
            type: 'string',
            pattern: '^#[0-9A-Fa-f]{6}$',
            description: 'Work Order Status display color as a #RRGGBB hex value.',
          },
          description: { type: 'string', description: 'Work Order Status description.' },
        },
      },
      UpdateWorkOrderStatusRequest: schemaRef('CreateWorkOrderStatusRequest'),
      WorkOrderStatus: {
        allOf: [
          schemaRef('CreateWorkOrderStatusRequest'),
          {
            type: 'object',
            required: [
              'id',
              'tenantId',
              'name',
              'code',
              'category',
              'color',
              'description',
              'isSystem',
              'createdOn',
              'modifiedOn',
            ],
            properties: {
              id: { type: 'integer', minimum: 1 },
              tenantId: {
                type: 'string',
                minLength: 1,
                description: 'Tenant identifier resolved from the active authenticated Session.',
              },
              description: { type: ['string', 'null'] },
              isSystem: {
                type: 'boolean',
                readOnly: true,
                description: 'True for a System Work Order Status. Clients cannot set this field.',
              },
              createdOn: { type: 'string', format: 'date-time' },
              modifiedOn: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
    },
    responses: {
      ValidationFailed: {
        description: 'Validation failed or the request body is not valid JSON.',
        content: jsonContent(
          {
            oneOf: [schemaRef('ValidationError'), schemaRef('InvalidJsonError')],
          },
          { message: 'Validation failed', errors: ['Name is required'] }
        ),
      },
      Unauthorized: {
        description: 'Authentication failed.',
        content: jsonContent(schemaRef('UnauthorizedError'), { message: 'Unauthorized' }),
      },
      Forbidden: {
        description: 'Authenticated user is not allowed to perform this action.',
        content: jsonContent(schemaRef('ForbiddenError'), { message: 'Forbidden' }),
      },
      NotFound: {
        description: 'Entity was not found.',
        content: jsonContent(schemaRef('NotFoundError'), { message: 'Country not found' }),
      },
      Conflict: {
        description: 'Conflict with an existing active entity.',
        content: jsonContent(schemaRef('ConflictError'), {
          message: 'Conflict',
          errors: ['Staff code DOC-001 already exists.'],
        }),
      },
      UnprocessableEntity: {
        description: 'Request is valid but violates a domain rule.',
        content: jsonContent(schemaRef('UnprocessableEntityError'), {
          message: 'Users must have at least one role.',
        }),
      },
      InternalServerError: {
        description: 'Unexpected server error.',
        content: jsonContent(schemaRef('InternalServerError'), {
          message: 'Internal Server Error',
        }),
      },
    },
  },
} satisfies OpenApiDocument;
