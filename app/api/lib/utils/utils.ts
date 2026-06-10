import type { z } from 'zod';

export function formatValidationErrors(error: z.ZodError) {
  return error.issues.map((issue) => issue.message);
}
