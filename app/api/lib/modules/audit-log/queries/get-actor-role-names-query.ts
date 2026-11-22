import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { userRoleRepository } from '../../user-role/repository/user-role-repository';

const MEMBERSHIP_ROLE_LABELS: Record<string, string> = {
  owner: 'Tenant Owner',
  admin: 'Tenant Admin',
};

/**
 * The actor's Roles as the Audit Log records them: the Tenant ownership or admin
 * membership, then each assigned Role by name, without repeats. Null when the user
 * holds none, so an empty value never reads as "no access".
 */
export async function getActorRoleNamesQuery(
  userId: string,
  tenantId: string
): Promise<string | null> {
  const [membership, assignedRoles] = await Promise.all([
    tenantRepository.findTenantMembership(tenantId, userId),
    userRoleRepository.getAssignedRolesByUser(userId, tenantId),
  ]);

  const membershipLabels = (membership?.role ?? '')
    .split(',')
    .map((role) => MEMBERSHIP_ROLE_LABELS[role.trim()])
    .filter((label): label is string => Boolean(label));
  const names = [...new Set([...membershipLabels, ...assignedRoles.map(({ name }) => name)])];

  return names.length ? names.join(', ').slice(0, 500) : null;
}
