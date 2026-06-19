import { StatusCodes } from 'http-status-codes';

import { auth } from '@/app/lib/auth';
import { createCookieHeader, getSetCookies } from '@/app/api/lib/utils/auth-cookie-helpers';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { authRepository } from '../repository/auth-repository';
import type { SigninResult } from '../schemas/signin-schema';
import { validateSignin } from '../validator/signin-validator';

type AuthApiError = {
  body?: {
    code?: unknown;
    message?: unknown;
  };
  message?: unknown;
  statusCode?: unknown;
};

function getAuthApiError(error: unknown): AuthApiError | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  return error as AuthApiError;
}

function getAuthSignInFailure(error: unknown): CommandResult<SigninResult> | undefined {
  const authError = getAuthApiError(error);

  if (!authError) {
    return undefined;
  }

  const code = authError.body?.code;
  const message =
    typeof authError.message === 'string'
      ? authError.message
      : typeof authError.body?.message === 'string'
        ? authError.body.message
        : undefined;
  const statusCode = typeof authError.statusCode === 'number' ? authError.statusCode : undefined;

  if (
    statusCode === StatusCodes.UNAUTHORIZED ||
    code === 'INVALID_EMAIL_OR_PASSWORD' ||
    message === 'Invalid email or password'
  ) {
    return {
      success: false,
      errors: ['Invalid email or password'],
      status: StatusCodes.UNAUTHORIZED,
    };
  }

  if (statusCode === StatusCodes.FORBIDDEN && message) {
    return { success: false, errors: [message], status: StatusCodes.FORBIDDEN };
  }

  return undefined;
}

async function cleanupSigninSession(cookieHeader: string) {
  try {
    await auth.api.signOut({ headers: new Headers({ cookie: cookieHeader }) });
  } catch {
    // Preserve the original sign-in failure; cleanup is best-effort.
  }
}

export async function signinCommand(
  payload: unknown,
  requestHeaders?: Headers
): Promise<CommandResult<SigninResult>> {
  const validationResult = validateSignin(payload);

  if (!validationResult.success) {
    return validationResult;
  }

  let signInCookieHeader: string | undefined;

  try {
    const signInResult = await auth.api.signInEmail({
      body: {
        email: validationResult.data.email,
        password: validationResult.data.password,
        rememberMe: validationResult.data.rememberMe,
      },
      headers: requestHeaders,
      returnHeaders: true,
    });

    const signInSetCookies = getSetCookies(signInResult.headers);
    signInCookieHeader = createCookieHeader(signInSetCookies);

    if (!signInCookieHeader) {
      throw new Error('Sign-in session cookie was not created.');
    }

    const activeTenants = await authRepository.listActiveTenantsForUser(
      signInResult.response.user.id
    );

    if (activeTenants.length === 0) {
      await cleanupSigninSession(signInCookieHeader);

      return {
        success: false,
        errors: ['No active Tenant available for this user.'],
        status: StatusCodes.FORBIDDEN,
      };
    }

    if (activeTenants.length > 1) {
      await cleanupSigninSession(signInCookieHeader);

      return {
        success: false,
        errors: ['Multiple active Tenants available for this user. Tenant selection is required.'],
        status: StatusCodes.CONFLICT,
      };
    }

    const [activeTenant] = activeTenants;
    const setActiveResult = await auth.api.setActiveOrganization({
      body: { organizationId: activeTenant.id },
      headers: new Headers({ cookie: signInCookieHeader }),
      returnHeaders: true,
    });
    const setActiveSetCookies = getSetCookies(setActiveResult.headers);

    return {
      success: true,
      data: {
        tenant: activeTenant,
        setCookies: [...signInSetCookies, ...setActiveSetCookies],
      },
    };
  } catch (error) {
    if (signInCookieHeader) {
      await cleanupSigninSession(signInCookieHeader);
    }

    const authFailure = getAuthSignInFailure(error);

    if (authFailure) {
      return authFailure;
    }

    throw error;
  }
}
