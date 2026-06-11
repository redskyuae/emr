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
}: {
  tag: string;
  entity: string;
  summaryEntity: string;
  schemaName: string;
  createSchemaName: string;
  example: unknown;
  extraListParameters?: unknown[];
}) => ({
  get: {
    tags: [tag],
    summary: `List ${summaryEntity}`,
    description: `Returns a paginated list of ${summaryEntity}.`,
    parameters: [...listParameters, ...extraListParameters],
    responses: {
      '200': {
        description: `Paginated ${summaryEntity} list.`,
        content: jsonContent(paginatedSchema(schemaName)),
      },
      '400': responseRef('ValidationFailed'),
      '500': responseRef('InternalServerError'),
    },
  },
  post: {
    tags: [tag],
    summary: `Create ${entity}`,
    requestBody: requestBody(createSchemaName, example),
    responses: {
      '201': {
        description: `${entity} created.`,
        content: jsonContent(dataEnvelopeSchema(schemaName)),
      },
      ...errorResponses,
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
}: {
  tag: string;
  entity: string;
  schemaName: string;
  updateSchemaName: string;
  example: unknown;
  parameters?: unknown[];
}) => ({
  get: {
    tags: [tag],
    summary: `Get ${entity}`,
    parameters,
    responses: {
      '200': {
        description: `${entity} found.`,
        content: jsonContent(dataEnvelopeSchema(schemaName)),
      },
      ...errorResponses,
    },
  },
  put: {
    tags: [tag],
    summary: `Update ${entity}`,
    parameters,
    requestBody: requestBody(updateSchemaName, example),
    responses: {
      '200': {
        description: `${entity} updated.`,
        content: jsonContent(dataEnvelopeSchema(schemaName)),
      },
      ...errorResponses,
    },
  },
  delete: {
    tags: [tag],
    summary: `Delete ${entity}`,
    parameters,
    responses: {
      '204': { description: `${entity} deleted.` },
      ...errorResponses,
    },
  },
});

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
    extraListParameters: [parameterRef('TenantId')],
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
  required: ['tenantId', 'name', 'code'],
  properties: {
    tenantId: { type: 'string', minLength: 1, description: 'Tenant identifier.' },
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
        description: { type: ['string', 'null'] },
        createdOn: { type: 'string', format: 'date-time' },
        modifiedOn: { type: 'string', format: 'date-time' },
      },
    },
  ],
});

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
    { name: 'Tenant', description: 'Tenant management APIs.' },
    { name: 'Staff', description: 'Staff user management APIs for Tenant Admins.' },
    { name: 'Global Reference', description: 'Global Reference APIs shared by all Tenants.' },
    { name: 'Appointment Type', description: 'Appointment Type Master APIs.' },
    { name: 'Appointment Reason', description: 'Appointment Reason Master APIs.' },
    { name: 'Appointment Mode', description: 'Appointment Mode Master APIs.' },
    { name: 'Appointment Status', description: 'Appointment Status Master APIs.' },
    {
      name: 'Appointment Cancelled Reason',
      description: 'Appointment Cancelled Reason Master APIs.',
    },
    { name: 'Todo', description: 'Todo API examples.' },
  ],
  paths: {
    '/api/v1/tenants': {
      post: {
        tags: ['Tenant'],
        summary: 'Create Tenant',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateTenantRequest', {
          name: 'Apollo Hospitals',
          logo: 'https://example.com/logo.png',
        }),
        responses: {
          '201': {
            description: 'Tenant created.',
            content: jsonContent(dataEnvelopeSchema('Tenant'), {
              data: {
                id: 'org_123',
                name: 'Apollo Hospitals',
                slug: 'apollo-hospitals',
                logo: 'https://example.com/logo.png',
                isActive: true,
                createdAt: '2026-06-11T00:00:00.000Z',
              },
            }),
          },
          ...authenticatedErrorResponses,
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
    '/api/v1/users': {
      get: {
        tags: ['Staff'],
        summary: 'List Staff',
        description:
          'Returns a paginated list of non-deleted Staff profiles in the active Tenant. Requires the caller to be a Tenant Admin for the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [parameterRef('Page'), parameterRef('Limit'), parameterRef('Query')],
        responses: {
          '200': {
            description: 'Paginated Staff list.',
            content: jsonContent(paginatedSchema('Staff'), {
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
          'Creates a credentialed BetterAuth user, adds the user as a member of the active Tenant, and creates the Staff profile. The email address must not already exist anywhere in the system.',
        security: [{ cookieAuth: [] }],
        requestBody: requestBody('CreateStaffRequest', {
          name: 'Dr. Priya Sharma',
          email: 'priya.sharma@apollohospitals.com',
          password: 'ChangeMe123!',
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
    '/api/v1/appointments/types': appointmentMasterCollection({
      tag: 'Appointment Type',
      entity: 'Appointment Type',
      schemaName: 'AppointmentType',
      createSchemaName: 'CreateAppointmentTypeRequest',
      example: {
        tenantId: 'org_123',
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
        tenantId: 'org_123',
        name: 'Consultation',
        code: 'CONS',
        description: 'General consultation appointment',
      },
      parameters: [numberIdPathParameter('Appointment Type'), parameterRef('TenantId')],
    }),
    '/api/v1/appointments/reasons': appointmentMasterCollection({
      tag: 'Appointment Reason',
      entity: 'Appointment Reason',
      schemaName: 'AppointmentReason',
      createSchemaName: 'CreateAppointmentReasonRequest',
      example: {
        tenantId: 'org_123',
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
        tenantId: 'org_123',
        name: 'Fever',
        code: 'FEVER',
        description: 'Patient reports fever symptoms',
      },
      parameters: [numberIdPathParameter('Appointment Reason'), parameterRef('TenantId')],
    }),
    '/api/v1/appointments/modes': appointmentMasterCollection({
      tag: 'Appointment Mode',
      entity: 'Appointment Mode',
      schemaName: 'AppointmentMode',
      createSchemaName: 'CreateAppointmentModeRequest',
      example: {
        tenantId: 'org_123',
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
        tenantId: 'org_123',
        name: 'In Person',
        code: 'INP',
        description: 'Patient visits the Facility',
      },
      parameters: [numberIdPathParameter('Appointment Mode'), parameterRef('TenantId')],
    }),
    '/api/v1/appointments/statuses': appointmentMasterCollection({
      tag: 'Appointment Status',
      entity: 'Appointment Status',
      schemaName: 'AppointmentStatus',
      createSchemaName: 'CreateAppointmentStatusRequest',
      example: {
        tenantId: 'org_123',
        name: 'Scheduled',
        code: 'SCH',
        description: 'Appointment is scheduled',
      },
    }),
    '/api/v1/appointments/statuses/{id}': itemOperations({
      tag: 'Appointment Status',
      entity: 'Appointment Status',
      schemaName: 'AppointmentStatus',
      updateSchemaName: 'UpdateAppointmentStatusRequest',
      example: {
        tenantId: 'org_123',
        name: 'Scheduled',
        code: 'SCH',
        description: 'Appointment is scheduled',
      },
      parameters: [numberIdPathParameter('Appointment Status'), parameterRef('TenantId')],
    }),
    '/api/v1/appointments/cancelled-reasons': appointmentMasterCollection({
      tag: 'Appointment Cancelled Reason',
      entity: 'Appointment Cancelled Reason',
      schemaName: 'AppointmentCancelledReason',
      createSchemaName: 'CreateAppointmentCancelledReasonRequest',
      example: {
        tenantId: 'org_123',
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
        tenantId: 'org_123',
        name: 'Patient unavailable',
        code: 'PUNAV',
        description: 'Patient requested cancellation',
      },
      parameters: [numberIdPathParameter('Appointment Cancelled Reason'), parameterRef('TenantId')],
    }),
    '/api/v1/todo': {
      get: {
        tags: ['Todo'],
        summary: 'List Todo items',
        parameters: [parameterRef('Page'), parameterRef('Limit')],
        responses: {
          '200': {
            description: 'Paginated Todo list.',
            content: jsonContent(paginatedSchema('Todo')),
          },
          '500': responseRef('InternalServerError'),
        },
      },
      post: {
        tags: ['Todo'],
        summary: 'Create Todo item',
        requestBody: requestBody('CreateTodoRequest', {
          title: 'Call Patient',
          description: 'Confirm tomorrow appointment',
          isCompleted: false,
        }),
        responses: {
          '201': {
            description: 'Todo item created.',
            content: jsonContent(dataEnvelopeSchema('Todo')),
          },
          '400': responseRef('ValidationFailed'),
          '500': responseRef('InternalServerError'),
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
      TenantId: {
        name: 'tenantId',
        in: 'query',
        required: false,
        description:
          'Tenant identifier accepted by current Appointment Master routes until request-provided tenant IDs are removed.',
        schema: { type: 'string', minLength: 1 },
      },
      CountryId: {
        name: 'countryId',
        in: 'query',
        required: false,
        description: 'Filters State Global References by Country.',
        schema: { type: 'integer', minimum: 1 },
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
            examples: ['Conflict', 'A user with this email already exists.'],
          },
          errors: {
            type: 'array',
            items: { type: 'string' },
            examples: [
              ['Country code IN already exists.'],
              ['A user with this email already exists.'],
              ['Staff code DOC-001 already exists.'],
            ],
          },
        },
      },
      InternalServerError: {
        type: 'object',
        required: ['message'],
        properties: { message: { type: 'string', examples: ['Internal Server Error'] } },
      },
      CreateTenantRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          logo: { type: 'string', format: 'uri', maxLength: 2048 },
        },
      },
      UpdateTenantRequest: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          logo: { type: 'string', format: 'uri', maxLength: 2048 },
        },
      },
      Tenant: {
        type: 'object',
        required: ['id', 'name', 'slug', 'logo', 'isActive', 'createdAt'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string', maxLength: 60, pattern: '^[a-z0-9-]+$' },
          logo: { type: ['string', 'null'], format: 'uri' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateStaffRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
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
      CreateAppointmentReasonRequest: appointmentMasterCreateSchema('Appointment Reason', true),
      UpdateAppointmentReasonRequest: appointmentMasterCreateSchema('Appointment Reason', true),
      AppointmentReason: appointmentMasterSchema('CreateAppointmentReasonRequest'),
      CreateAppointmentModeRequest: appointmentMasterCreateSchema('Appointment Mode'),
      UpdateAppointmentModeRequest: appointmentMasterCreateSchema('Appointment Mode'),
      AppointmentMode: appointmentMasterSchema('CreateAppointmentModeRequest'),
      CreateAppointmentStatusRequest: appointmentMasterCreateSchema('Appointment Status', true),
      UpdateAppointmentStatusRequest: appointmentMasterCreateSchema('Appointment Status', true),
      AppointmentStatus: appointmentMasterSchema('CreateAppointmentStatusRequest'),
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
      CreateTodoRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string', default: '' },
          isCompleted: { type: 'boolean', default: false },
        },
      },
      Todo: {
        type: 'object',
        required: ['id', 'title', 'description', 'isCompleted'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          title: { type: 'string' },
          description: { type: 'string' },
          isCompleted: { type: 'boolean' },
        },
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
      InternalServerError: {
        description: 'Unexpected server error.',
        content: jsonContent(schemaRef('InternalServerError'), {
          message: 'Internal Server Error',
        }),
      },
    },
  },
} satisfies OpenApiDocument;
