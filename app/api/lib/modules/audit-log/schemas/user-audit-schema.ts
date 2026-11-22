import { z } from 'zod';

import type { AuditModule } from './audit-action-catalogue';
import { auditExportFormatSchema } from './audit-log-schema';

// A user's detail page lists at most this many Sessions and failed attempts in
// the range; the full trail stays in the Audit Log.
export const USER_AUDIT_DETAIL_LIMIT = 100;

// The User Audit list export covers at most this many members; a larger Tenant
// narrows it with the search.
export const USER_AUDIT_EXPORT_MAX_USERS = 5_000;

const isoDateSchema = (fieldName: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${fieldName} must be a date in YYYY-MM-DD format`)
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), {
      message: `${fieldName} is Invalid.`,
    });

const rangeShape = {
  toDate: isoDateSchema('To date').optional(),
  fromDate: isoDateSchema('From date').optional(),
};

function fromBeforeTo(filters: { fromDate?: string; toDate?: string }) {
  return !filters.fromDate || !filters.toDate || filters.fromDate <= filters.toDate;
}

const rangeError = { message: 'From date must be on or before To date', path: ['toDate'] };

const querySchema = z.string().trim().max(100, 'Search must be at most 100 characters');

export const listUserAuditSchema = z
  .object({
    ...rangeShape,
    query: querySchema.optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100, 'Limit must be at most 100').optional(),
  })
  .refine(fromBeforeTo, rangeError);

export const userAuditDetailSchema = z.object(rangeShape).refine(fromBeforeTo, rangeError);

export const exportUserAuditListSchema = z
  .object({ ...rangeShape, query: querySchema.optional(), format: auditExportFormatSchema })
  .refine(fromBeforeTo, rangeError);

export const exportUserAuditDetailSchema = z
  .object({ ...rangeShape, format: auditExportFormatSchema })
  .refine(fromBeforeTo, rangeError);

export const userAuditUserIdSchema = z
  .string({ error: 'User ID is required' })
  .trim()
  .min(1, 'User ID is required')
  .max(255, 'User ID is Invalid.');

type DateRange = { fromDate?: string; toDate?: string };

/** The resolved range, with the Tenant time zone that turns its days into instants. */
export type UserAuditRange = DateRange & { tenantId: string; timeZone: string };

export type UserAuditListParams = UserAuditRange & {
  query?: string;
  page?: number;
  limit?: number;
};

/** One Tenant member as the User Audit list shows them. Counts cover the date range. */
export type UserAuditListItem = {
  userId: string;
  name: string;
  email: string;
  roles: string | null;
  isActive: boolean;
  staffCode: string | null;
  lastSignInAt: Date | null;
  lastSignInIp: string | null;
  lastSignInUserAgent: string | null;
  lastActivityAt: Date | null;
  signInCount: number;
  failedSignInCount: number;
  actionCount: number;
  activeSessionCount: number;
};

export type UserAuditSessionStatus = 'active' | 'signed-out' | 'revoked' | 'expired';

/** One Session, from its sign-in to however it ended. */
export type UserAuditSession = {
  sessionId: string;
  signedInAt: Date;
  endedAt: Date | null;
  status: UserAuditSessionStatus;
  endReason: string | null;
  expiresAt: Date | null;
  lastActivityAt: Date | null;
  actionCount: number;
  ipAddress: string | null;
  userAgent: string | null;
  rememberMe: boolean | null;
  /** False for a Session known only from the live Session store, e.g. started before tracking. */
  signInRecorded: boolean;
};

export type UserAuditFailedSignIn = {
  occurredOn: Date;
  ipAddress: string | null;
  userAgent: string | null;
  reason: string | null;
};

export type UserAuditIpAddress = {
  ipAddress: string;
  eventCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
};

export type UserAuditDevice = {
  userAgent: string;
  eventCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
};

export type UserAuditDetail = {
  timeZone: string;
  user: {
    userId: string;
    name: string;
    email: string;
    roles: string | null;
    isActive: boolean;
    staffCode: string | null;
    memberSince: Date;
    accountCreatedAt: Date;
  };
  summary: {
    signInCount: number;
    failedSignInCount: number;
    actionCount: number;
    activeSessionCount: number;
    ipAddressCount: number;
    deviceCount: number;
    lastSignInAt: Date | null;
    lastActivityAt: Date | null;
  };
  sessions: UserAuditSession[];
  sessionsTruncated: boolean;
  failedSignIns: UserAuditFailedSignIn[];
  ipAddresses: UserAuditIpAddress[];
  devices: UserAuditDevice[];
  activityByModule: { module: AuditModule; count: number }[];
};
