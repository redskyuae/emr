import { todoRepository } from '../repository/todo-repository';
import { validateCreateTodo } from '../validator/create-todo-validator';
import { CommandResult } from '@/app/api/lib/utils/types';
import { Todo } from '@/app/api/lib/modules/todo/schemas/todo-schema';

export async function createTodoCommand(payload: unknown): Promise<CommandResult<Todo>> {
  const validationResult = validateCreateTodo(payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const createdTodo = await todoRepository.createTodo(validationResult.data);

  return { success: true, data: createdTodo };
}
