import type { CommandResult } from '@/app/api/lib/utils/types';
import { getActorRoleNamesQuery } from '../queries/get-actor-role-names-query';
import { auditLogRepository } from '../repository/audit-log-repository';
import type { AuditEvent } from '../schemas/audit-log-schema';
import { validateRecordAuditEvent } from '../validator/record-audit-event-validator';

export async function recordAuditEventCommand(input: unknown): Promise<CommandResult<AuditEvent>> {
  const validationResult = validateRecordAuditEvent(input);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const event = validationResult.data;
  // The Roles are a snapshot: a later Role change never rewrites who the actor was.
  const actorRoles =
    event.actorRoles ??
    (event.actorUserId ? await getActorRoleNamesQuery(event.actorUserId, event.tenantId) : null);

  const recorded = await auditLogRepository.recordAuditEvent({ ...event, actorRoles });

  return { success: true, data: recorded };
}
