import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z
    .string({ message: 'Todo title is required' })
    .trim()
    .min(1, 'Todo title cannot be empty'),
  description: z.string().trim().default(''),
  isCompleted: z.boolean().default(false),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export type Todo = {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
};
