import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

type EditPermissions = { canUpdate: boolean; canAmend: boolean };

/**
 * Where "Edit" takes the user for a Visit, or null when it cannot be edited.
 * An active Visit is edited in place on its page; a Completed Visit opens the
 * Amend sheet; a Cancelled Visit is never edited.
 */
export function visitEditHref(
  visit: Pick<Visit, 'id' | 'status'>,
  { canUpdate, canAmend }: EditPermissions
): string | null {
  const active = visit.status === 'CHECKED_IN' || visit.status === 'IN_CONSULTATION';

  if (active && canUpdate) return `/visits/${visit.id}`;
  if (visit.status === 'COMPLETED' && canAmend) return `/visits/${visit.id}?capture=amend`;

  return null;
}
