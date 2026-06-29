export type DatabaseError = {
  code?: string;
  constraint?: string;
};

/**
 * Drizzle wraps driver errors in a `DrizzleQueryError` and exposes the
 * underlying Postgres error (carrying `code`, `constraint`, ...) on the `cause`
 * chain. Walk that chain and return the first object that has a Postgres error
 * `code`, so callers can inspect it regardless of how deeply it is wrapped.
 */
export function getDatabaseError(error: unknown): DatabaseError | undefined {
  let current: unknown = error;

  while (current && typeof current === 'object') {
    const candidate = current as { code?: unknown; cause?: unknown };

    if (typeof candidate.code === 'string') {
      return candidate as DatabaseError;
    }

    current = candidate.cause;
  }

  return undefined;
}

export function isUniqueConstraintViolation(error: unknown) {
  return getDatabaseError(error)?.code === '23505';
}
