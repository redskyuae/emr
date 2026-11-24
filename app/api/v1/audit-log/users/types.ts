import type { UserAuditListItem } from '@/app/api/lib/modules/audit-log/schemas/user-audit-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListUserAuditResponse = Paginated<UserAuditListItem>;
