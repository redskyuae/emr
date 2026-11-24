import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { auth } from '@/app/lib/auth';
import { authRepository } from '../repository/auth-repository';
import { signinCommand } from './signin-command';

vi.mock('@/app/lib/auth', () => ({
  auth: {
    api: { signOut: vi.fn(), signInEmail: vi.fn(), setActiveOrganization: vi.fn() },
  },
}));

vi.mock('../repository/auth-repository', () => ({
  authRepository: { findSessionIdByToken: vi.fn(), listActiveTenantsForUser: vi.fn() },
}));

const authApi = vi.mocked(auth.api);
const repo = vi.mocked(authRepository);

const tenant = { id: 'tenant-1', name: 'Al Noor Hospital', isActive: true };
const sara = { id: 'user-1', name: 'Dr. Sara Ali', email: 'sara.ali@hospital.example' };
const credentials = { email: 'Sara.Ali@Hospital.example', password: 'correct-horse' };

function setCookieHeaders(cookie: string) {
  return new Headers({ 'set-cookie': `${cookie}; Path=/; HttpOnly` });
}

function signedIn(token: string | null) {
  authApi.signInEmail.mockResolvedValue({
    headers: setCookieHeaders('better-auth.session_token=token-abc'),
    response: { user: sara, token },
  } as never);
}

describe('signinCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signedIn('token-abc');
    repo.listActiveTenantsForUser.mockResolvedValue([tenant] as never);
    repo.findSessionIdByToken.mockResolvedValue('session-9');
    authApi.setActiveOrganization.mockResolvedValue({
      headers: setCookieHeaders('better-auth.active=tenant-1'),
    } as never);
  });

  it('should not call BetterAuth when the payload fails validation', async () => {
    const result = await signinCommand({ email: 'sara.ali@hospital.example' });

    expect(result).toMatchObject({ success: false, errors: ['Password is required'] });
    expect(authApi.signInEmail).not.toHaveBeenCalled();
  });

  it('should return the user’s name, email and the new Session id for the Audit Log', async () => {
    const result = await signinCommand({ ...credentials, rememberMe: true });

    expect(repo.findSessionIdByToken).toHaveBeenCalledWith('token-abc');
    expect(result).toEqual({
      success: true,
      data: {
        tenant,
        setCookies: [
          'better-auth.session_token=token-abc; Path=/; HttpOnly',
          'better-auth.active=tenant-1; Path=/; HttpOnly',
        ],
        userId: 'user-1',
        userName: 'Dr. Sara Ali',
        userEmail: 'sara.ali@hospital.example',
        sessionId: 'session-9',
        rememberMe: true,
      },
    });
  });

  it('should sign in with a null Session id when the Session cannot be read back', async () => {
    repo.findSessionIdByToken.mockResolvedValue(undefined);

    const result = await signinCommand(credentials);

    expect(result).toMatchObject({ success: true, data: { sessionId: null, rememberMe: false } });
  });

  it('should not look the Session up when BetterAuth returns no token', async () => {
    signedIn(null);

    const result = await signinCommand(credentials);

    expect(repo.findSessionIdByToken).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true, data: { sessionId: null } });
  });

  it('should map a rejected password to 401', async () => {
    authApi.signInEmail.mockRejectedValue({
      statusCode: StatusCodes.UNAUTHORIZED,
      body: { code: 'INVALID_EMAIL_OR_PASSWORD' },
    });

    const result = await signinCommand(credentials);

    expect(result).toEqual({
      success: false,
      errors: ['Invalid email or password'],
      status: StatusCodes.UNAUTHORIZED,
    });
    expect(repo.findSessionIdByToken).not.toHaveBeenCalled();
  });

  it('should end the new Session and refuse a user with no active Tenant', async () => {
    repo.listActiveTenantsForUser.mockResolvedValue([]);

    const result = await signinCommand(credentials);

    expect(result).toMatchObject({ success: false, status: StatusCodes.FORBIDDEN });
    expect(authApi.signOut).toHaveBeenCalled();
    expect(repo.findSessionIdByToken).not.toHaveBeenCalled();
  });
});
