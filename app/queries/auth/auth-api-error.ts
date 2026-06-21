type AuthApiErrorBody = {
  message?: unknown;
  errors?: unknown;
};

export class AuthApiError extends Error {
  errors: string[];

  constructor(message: string, errors: string[] = [message]) {
    super(message);
    this.name = 'AuthApiError';
    this.errors = errors;
  }
}

function getStringErrors(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((error): error is string => typeof error === 'string' && error.length > 0);
}

export async function parseAuthApiError(response: Response, fallbackMessage: string) {
  let body: AuthApiErrorBody | undefined;

  try {
    body = (await response.json()) as AuthApiErrorBody;
  } catch {
    // Ignore invalid error payloads and fall back to the response status.
  }

  const message =
    typeof body?.message === 'string' && body.message.length > 0 ? body.message : fallbackMessage;
  const errors = getStringErrors(body?.errors);

  return new AuthApiError(message, errors.length > 0 ? errors : [message]);
}

export function getAuthMutationErrors(error: unknown) {
  if (!error) {
    return [];
  }

  if (error instanceof AuthApiError) {
    return error.errors;
  }

  if (error instanceof Error) {
    return [error.message];
  }

  return ['Something went wrong.'];
}
