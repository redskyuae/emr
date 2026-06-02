import type { CommandResult } from "../../../utils/utils";
import { todoRepository } from "../repository/todo-repository";
import type { Todo } from "../schemas/todo-schema";
import { validateCreateTodo } from "../validator/todo-validator";

export async function createTodoCommand(payload: unknown): Promise<CommandResult<Todo>> {
  const validationResult = validateCreateTodo(payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const createdTodo = await todoRepository.createTodo(validationResult.data);

  return { success: true, data: createdTodo };
}
