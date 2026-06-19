import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { signoutCommand } from '@/app/api/lib/modules/auth/commands/signout-command';

function appendSetCookies(response: NextResponse, setCookies: string[]) {
  for (const setCookie of setCookies) {
    response.headers.append('Set-Cookie', setCookie);
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await signoutCommand(request.headers);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    const response = new NextResponse(null, { status: StatusCodes.NO_CONTENT });
    appendSetCookies(response, result.data.setCookies);

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
