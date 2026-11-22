import type { AuditEventListItem } from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAuditEventsResponse = Paginated<AuditEventListItem>;
