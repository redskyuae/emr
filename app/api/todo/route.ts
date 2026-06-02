import { type NextRequest, NextResponse } from "next/server";

import { createTodoCommand } from "../modules/todo/commands/create-todo-command";
import { getTodosQuery } from "../modules/todo/queries/get-todos-query";

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsedValue) || parsedValue < 1 ? fallback : parsedValue;
}

export async function GET(request: NextRequest) {
  const page = parsePositiveInteger(request.nextUrl.searchParams.get("page"), 1);
  const limit = Math.min(100, parsePositiveInteger(request.nextUrl.searchParams.get("limit"), 10));
  const { data, total } = await getTodosQuery({ page, limit });

  return NextResponse.json({
    data,
    pageSize: limit,
    pageNumber: page,
    totalItems: total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON" }, { status: 400 });
  }

  const result = await createTodoCommand(payload);

  if (!result.success) {
    return NextResponse.json({ message: "Validation failed", errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ data: result.data }, { status: 201 });
}
