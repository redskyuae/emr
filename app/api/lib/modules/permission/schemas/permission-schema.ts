import { z } from 'zod';

export const permissionIdSchema = z.coerce
  .number({ error: 'Permission ID is required' })
  .int('Permission ID must be an integer')
  .positive('Permission ID must be positive');

export type PermissionIdInput = z.infer<typeof permissionIdSchema>;

export type Permission = {
  id: number;
  name: string;
  action: string;
  module: string;
  createdOn: Date;
  resource: string;
  modifiedOn: Date;
  isActive: boolean;
  description: string | null;
};

export type PermissionListItem = Pick<
  Permission,
  'id' | 'name' | 'resource' | 'action' | 'description'
>;

export type GroupedPermissions = Record<string, PermissionListItem[]>;

export type PermissionListParams = {
  module?: string;
};
