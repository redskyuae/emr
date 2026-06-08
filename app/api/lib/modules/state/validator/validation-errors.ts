import type { z } from 'zod';

export function formatValidationErrors(error: z.ZodError) {
  return error.issues.map((issue) => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}
