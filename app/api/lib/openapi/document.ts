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
    'Asset serial number already exists, or a referenced Asset Master does not exist in the active Tenant.',
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
      description: 'Public signup API that provisions a Tenant and Tenant Owner.',
    },
    { name: 'Tenant', description: 'Tenant management APIs.' },
    { name: 'Staff', description: 'Staff user management APIs for Tenant Admins.' },
    { name: 'Session', description: 'Authenticated user Session management APIs.' },
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
    {
      name: 'Appointment Cancelled Reason',
      description: 'Appointment Cancelled Reason Master APIs.',
    },
    { name: 'Asset Category', description: 'Asset Category Master APIs.' },
    { name: 'Asset Status', description: 'Asset Status Master APIs.' },
    { name: 'Asset Condition', description: 'Asset Condition Master APIs.' },
    { name: 'Asset', description: 'Asset inventory APIs.' },
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
          'Creates the Tenant Owner user, provisions a Tenant, initializes required baseline configuration including default Appointment and Asset masters, signs the owner in, and sets the new Tenant as active.',
        requestBody: requestBody('SignupRequest', {
          tenantName: 'Apollo Hospitals',
          ownerName: 'Dr. Priya Raghavan',
          ownerEmail: 'priya.raghavan@apollo.example',
          password: 'StrongerPass123',
        }),
        responses: {
          '201': {
            description: 'Tenant provisioned and owner signed in.',
            content: jsonContent(dataEnvelopeSchema('SignupResult'), {
              data: {
                tenant: {
                  id: 'org_123',
                  name: 'Apollo Hospitals',
                  slug: 'apollo-hospitals',
                  logo: null,
                  isActive: true,
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
        description: 'Soft-deletes one active Asset in the active Tenant.',
        security: [{ cookieAuth: [] }],
        parameters: [idPathParameter('Asset')],
        responses: {
          '204': { description: 'Asset deleted.' },
          ...assetErrorResponses,
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
