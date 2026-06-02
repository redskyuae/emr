import { todoRepository } from "../repository/todo-repository";

export async function getTodosQuery({ page, limit }: { page?: number; limit?: number } = {}) {
  return await todoRepository.getTodos({ page, limit });
}
