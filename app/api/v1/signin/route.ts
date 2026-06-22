import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { SigninResponse } from './types';

import { signinCommand } from '@/app/api/lib/modules/auth/commands/signin-command';

function mutationMessage(status: number, errors: string[]) {
  if (status >= StatusCodes.INTERNAL_SERVER_ERROR) {
    return 'Internal Server Error';
  }

  if (errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

function appendSetCookies(response: NextResponse, setCookies: string[]) {
  for (const setCookie of setCookies) {
    response.headers.append('Set-Cookie', setCookie);
  }
}

export async function POST(request: NextRequest) {
  try {
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const result = await signinCommand(payload, request.headers);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      const message = mutationMessage(status, result.errors);

      if (status >= StatusCodes.INTERNAL_SERVER_ERROR) {
        return NextResponse.json({ message }, { status });
      }

      return NextResponse.json({ message, errors: result.errors }, { status });
    }

    const response = NextResponse.json<SigninResponse>({ data: { tenant: result.data.tenant } });

    appendSetCookies(response, result.data.setCookies);

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
