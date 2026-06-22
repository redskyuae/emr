import type { Todo } from '@/app/api/lib/modules/todo/schemas/todo-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListTodosResponse = Paginated<Todo>;

export type SaveTodoRequest = {
  title: string;
  description?: string;
  isCompleted?: boolean;
};

export type SaveTodoResponse = {
  data: Todo;
};
