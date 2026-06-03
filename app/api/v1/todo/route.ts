import { type NextRequest, NextResponse } from 'next/server';

import { createTodoCommand } from '@/app/api/lib/modules/todo/commands/create-todo-command';
import { getTodosQuery } from '@/app/api/lib/modules/todo/queries/get-todos-query';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';
import type { Paginated } from '@/app/api/lib/utils/types';
import type { Todo } from '@/app/api/lib/modules/todo/schemas/todo-schema';

export type SaveTodoRequest = {
  title: string;
  description?: string;
  isCompleted?: boolean;
};

export type SaveTodoResponse = {
  data: {
    id: number;
    title: string;
    description: string;
    isCompleted: boolean;
  };
};

export async function GET(request: NextRequest) {
  try {
    const page = parsePositiveInteger(request.nextUrl.searchParams.get('page'), 1);
    const limit = parsePositiveInteger(request.nextUrl.searchParams.get('limit'), 10);

    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(999, Math.max(1, Math.floor(limit)));

    const queryResult = await getTodosQuery({ page: safePage, limit: safeLimit });

    if (!queryResult.success) {
      return NextResponse.json({ status: 500, message: 'Internal Server Error' });
    }

    if (!('total' in queryResult)) {
      return NextResponse.json({ status: 500, message: 'Internal Server Error' });
    }

    const { data, total } = queryResult;

    const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;

    return NextResponse.json<Paginated<Todo>>({
      data,
      meta: {
        total,
        totalPages,
        pageSize: safeLimit,
        pageNumber: safePage,
      },
    });
  } catch {
    return NextResponse.json({ status: 500, message: 'Internal Server Error' });
  }
}

export async function POST(request: NextRequest) {
  try {
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await createTodoCommand(payload);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json<SaveTodoResponse>({ data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json({ status: 500, message: 'Internal Server Error' });
  }
}
