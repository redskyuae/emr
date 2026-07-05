type ApiErrorBody = {
  message?: unknown;
  errors?: unknown;
};

export class ApiError extends Error {
  errors: string[];
  status?: number;

  constructor(message: string, errors: string[] = [message], status?: number) {
    super(message);
    this.name = 'ApiError';
    this.errors = errors;
    this.status = status;
  }
}

function getStringErrors(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((error): error is string => typeof error === 'string' && error.length > 0);
}

export async function parseApiError(response: Response, fallbackMessage: string) {
  let body: ApiErrorBody | undefined;

  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    // Ignore invalid error payloads and fall back to the response status.
  }

  const message =
    typeof body?.message === 'string' && body.message.length > 0 ? body.message : fallbackMessage;
  const errors = getStringErrors(body?.errors);

  return new ApiError(message, errors.length > 0 ? errors : [message], response.status);
}

export function getApiErrors(error: unknown) {
  if (!error) {
    return [];
  }

  if (error instanceof ApiError) {
    return error.errors;
  }

  if (error instanceof Error) {
    return [error.message];
  }

  return ['Something went wrong.'];
}

export function getApiErrorMessage(error: unknown) {
  return getApiErrors(error)[0] ?? 'Something went wrong.';
}
