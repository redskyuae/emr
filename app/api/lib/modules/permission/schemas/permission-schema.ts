import { z } from 'zod';

export const permissionIdSchema = z.coerce
  .number({ error: 'Permission ID is required' })
  .int('Permission ID must be an integer')
  .positive('Permission ID must be positive');

export type PermissionIdInput = z.infer<typeof permissionIdSchema>;

export type Permission = {
  id: number;
  module: string;
  resource: string;
  action: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdOn: Date;
  modifiedOn: Date;
};

export type PermissionListItem = Pick<
  Permission,
  'id' | 'name' | 'resource' | 'action' | 'description'
>;

export type GroupedPermissions = Record<string, PermissionListItem[]>;

export type PermissionListParams = {
  module?: string;
};
