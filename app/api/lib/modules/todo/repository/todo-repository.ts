import { asc, count } from 'drizzle-orm';

import { db } from '@/app/db';
import { todoTable } from '@/app/db/schema/todo';
import type { CreateTodoInput } from '../schemas/todo-schema';

async function createTodo(data: CreateTodoInput) {
  const [createdTodo] = await db
    .insert(todoTable)
    .values({
      title: data.title,
      description: data.description,
      isCompleted: data.isCompleted,
    })
    .returning({
      id: todoTable.id,
      title: todoTable.title,
      description: todoTable.description,
      isCompleted: todoTable.isCompleted,
    });

  return createdTodo;
}

async function getTodos({ page = 1, limit = 10 }: { page?: number; limit?: number } = {}) {
  const offset = (page - 1) * limit;

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: todoTable.id,
        title: todoTable.title,
        description: todoTable.description,
        isCompleted: todoTable.isCompleted,
      })
      .from(todoTable)
      .orderBy(asc(todoTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(todoTable),
  ]);

  return { data, total };
}

export const todoRepository = {
  createTodo,
  getTodos,
};
