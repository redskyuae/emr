import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

type EditPermissions = { canAmend: boolean };

/**
 * Where "Edit" takes the user for a Visit, or null when Edit would add nothing.
 * Only a Completed Visit has an edit surface of its own, the Amend sheet. An
 * active Visit is already edited on its page, which "View Visit" opens, and a
 * Cancelled Visit is never edited.
 */
export function visitEditHref(
  visit: Pick<Visit, 'id' | 'status'>,
  { canAmend }: EditPermissions
): string | null {
  if (visit.status === 'COMPLETED' && canAmend) return `/visits/${visit.id}?capture=amend`;

  return null;
}
