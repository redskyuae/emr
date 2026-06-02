import type { ValidationResult } from "../../../utils/utils";
import { createTodoSchema, type CreateTodoInput } from "../schemas/todo-schema";

export function validateCreateTodo(payload: unknown): ValidationResult<CreateTodoInput> {
  const result = createTodoSchema.safeParse(payload);

  if (!result.success) {
    const errors = result.error.issues.map((error) => `${error.path.join(".")}: ${error.message}`);
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}
