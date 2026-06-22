export function isUniqueConstraintViolation(error: unknown) {
  return (
    typeof error === 'object' && error !== null && (error as { code?: unknown }).code === '23505'
  );
}
