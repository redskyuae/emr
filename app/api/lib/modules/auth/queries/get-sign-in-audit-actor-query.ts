import { authRepository } from '../repository/auth-repository';
import { signinEmailSchema } from '../schemas/signin-schema';

type SignInAuditActor = {
  user: { id: string; name: string; email: string };
  tenantIds: string[];
};

/**
 * Who a failed sign-in was aimed at, so the attempt can be recorded in that
 * user's Tenants. Null for a malformed or unknown email, or a user with no
 * active Tenant: an attempt that names no one in a Tenant has no Audit Log to go to.
 */
export async function getSignInAuditActorQuery(email: unknown): Promise<SignInAuditActor | null> {
  const parsed = signinEmailSchema.safeParse(email);

  if (!parsed.success) {
    return null;
  }

  const user = await authRepository.findUserByEmail(parsed.data);

  if (!user) {
    return null;
  }

  const tenants = await authRepository.listActiveTenantsForUser(user.id);

  return tenants.length ? { user, tenantIds: tenants.map(({ id }) => id) } : null;
}
