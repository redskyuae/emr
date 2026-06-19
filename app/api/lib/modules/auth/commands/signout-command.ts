import { StatusCodes } from 'http-status-codes';

import { auth } from '@/app/lib/auth';
import { getSetCookies } from '@/app/api/lib/utils/auth-cookie-helpers';
import type { CommandResult } from '@/app/api/lib/utils/types';
import type { SignoutResult } from '../schemas/signout-schema';
import { validateSignout } from '../validator/signout-validator';

export async function signoutCommand(headers: unknown): Promise<CommandResult<SignoutResult>> {
  const validationResult = validateSignout(headers);

  if (!validationResult.success) {
    return validationResult;
  }

  try {
    const signOutResult = await auth.api.signOut({
      headers: validationResult.data.headers,
      returnHeaders: true,
    });

    return {
      success: true,
      data: {
        setCookies: getSetCookies(signOutResult.headers),
      },
    };
  } catch {
    return {
      success: false,
      errors: ['Sign out failed.'],
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
}
