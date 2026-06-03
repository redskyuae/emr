import { todoRepository } from '../repository/todo-repository';
import type { QueryResult } from '@/app/api/lib/utils/types';
import type { Todo } from '@/app/api/lib/modules/todo/schemas/todo-schema';

export async function getTodosQuery({
  page = 1,
  limit = 10,
}: { page?: number; limit?: number } = {}): Promise<QueryResult<Todo>> {
  const { data, total } = await todoRepository.getTodos({ page, limit });
  return { success: true, data, total };
}
