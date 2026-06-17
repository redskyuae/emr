'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  Eye,
  EyeOff,
  Info,
  MoreVertical,
  Pencil,
  Search,
  UserPlus,
  UsersRound,
} from 'lucide-react';

import type {
  IamDirectoryUser,
  IamUserStatus,
} from '@/app/(app)/identity-access/dashboard/mock-data';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type StatusFilter = 'All' | IamUserStatus;

const statusFilters: StatusFilter[] = ['All', 'Active', 'Suspended', 'Invited'];

const statusBadgeClassByStatus: Record<IamUserStatus, string> = {
  Active: 'border-chart-4/20 bg-chart-4/10 text-chart-4',
  Suspended: 'border-destructive/20 bg-destructive/10 text-destructive',
  Invited: 'border-chart-5/20 bg-chart-5/10 text-chart-5',
};

function statusMatches(filter: StatusFilter, user: IamDirectoryUser) {
  return filter === 'All' || user.status === filter;
}

function userMatchesSearch(searchTerm: string, user: IamDirectoryUser) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [user.name, user.email, user.role, user.department]
    .join(' ')
    .toLowerCase()
    .includes(normalizedSearch);
}

function RoleSelect({
  value,
  onValueChange,
  roleOptions,
  includeAll = false,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  roleOptions: string[];
  includeAll?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn('h-9 w-full', includeAll && 'sm:w-[184px]')}
        aria-label={includeAll ? 'Filter by Role' : 'Role'}
      >
        <SelectValue placeholder="Role" />
      </SelectTrigger>
      <SelectContent>
        {includeAll ? <SelectItem value="all">All Roles</SelectItem> : null}
        {roleOptions.map((role) => (
          <SelectItem key={role} value={role}>
            {role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DepartmentSelect({
  value,
  onValueChange,
  departmentOptions,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  departmentOptions: string[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-9 w-full" aria-label="Department">
        <SelectValue placeholder="Select department" />
      </SelectTrigger>
      <SelectContent>
        {departmentOptions.map((department) => (
          <SelectItem key={department} value={department}>
            {department}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function InviteUserDialog({
  open,
  onOpenChange,
  roleOptions,
  departmentOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleOptions: string[];
  departmentOptions: string[];
}) {
  const [role, setRole] = useState<string | undefined>(roleOptions[0]);
  const [department, setDepartment] = useState<string | undefined>(departmentOptions[0]);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="shadow-fluent-64 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Create a Staff account for the active Tenant and Facility context.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="invite-full-name">Full name</FieldLabel>
            <Input id="invite-full-name" placeholder="Aisha Rahman" autoComplete="name" />
          </Field>
          <Field>
            <FieldLabel htmlFor="invite-email">Work email</FieldLabel>
            <Input
              id="invite-email"
              type="email"
              placeholder="aisha.rahman@northgate.example"
              autoComplete="email"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="add-user-password">Password</FieldLabel>
            <div className="relative">
              <Input
                id="add-user-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3 transition-colors"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Role</FieldLabel>
              <RoleSelect value={role} onValueChange={setRole} roleOptions={roleOptions} />
            </Field>
            <Field>
              <FieldLabel>Department</FieldLabel>
              <DepartmentSelect
                value={department}
                onValueChange={setDepartment}
                departmentOptions={departmentOptions}
              />
            </Field>
          </div>
        </FieldGroup>

        <div className="bg-muted/60 text-muted-foreground flex gap-3 rounded-lg border p-3 text-sm">
          <Info className="text-primary mt-0.5 size-4 shrink-0" />
          <p>
            Staff can sign in with this email and temporary password after the account is added.
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={() => onOpenChange(false)}>
            <UserPlus className="size-4" />
            Add user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UsersPageClient({
  users,
  roleOptions,
  departmentOptions,
  initialInviteOpen,
}: {
  users: IamDirectoryUser[];
  roleOptions: string[];
  departmentOptions: string[];
  initialInviteOpen: boolean;
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [localInviteOpen, setLocalInviteOpen] = useState(false);
  const inviteOpen = initialInviteOpen || localInviteOpen;

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          userMatchesSearch(searchTerm, user) &&
          (roleFilter === 'all' || user.role === roleFilter) &&
          statusMatches(statusFilter, user)
      ),
    [roleFilter, searchTerm, statusFilter, users]
  );

  function handleInviteOpenChange(open: boolean) {
    setLocalInviteOpen(open);

    if (!open) {
      router.replace('/identity-access/users', { scroll: false });
    }
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
            <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-sm">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search Staff users"
                aria-label="Search Staff users"
              />
            </InputGroup>

            <RoleSelect
              value={roleFilter}
              onValueChange={setRoleFilter}
              roleOptions={roleOptions}
              includeAll
            />

            <div className="flex flex-wrap gap-2">
              {statusFilters.map((status) => (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  aria-pressed={statusFilter === status}
                >
                  {status}
                </Button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" variant="outline">
                <Download className="size-4" />
                Export
              </Button>
              <Button type="button" onClick={() => setLocalInviteOpen(true)}>
                <UserPlus className="size-4" />
                Add user
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-fluent-2">
          <CardContent className="p-0">
            {filteredUsers.length ? (
              <Table className="min-w-[1040px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>MFA</TableHead>
                    <TableHead>Last sign-in</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="pl-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{user.initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{user.name}</p>
                            <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'bg-muted/70',
                            user.role === 'Tenant Admin' &&
                              'border-primary/20 bg-primary/10 text-primary'
                          )}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.department}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadgeClassByStatus[user.status]}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.mfaEnabled ? (
                          <Badge
                            variant="outline"
                            className="border-primary/20 bg-primary/10 text-primary"
                          >
                            On
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {user.lastSignIn}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-muted/70 font-mono">
                          {user.sessions}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="ghost" size="sm">
                            <Pencil className="size-3.5" />
                            Edit
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`More actions for ${user.name}`}
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem>View sessions</DropdownMenuItem>
                              <DropdownMenuItem>Reset MFA</DropdownMenuItem>
                              <DropdownMenuItem variant="destructive">
                                {user.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty className="min-h-72 border-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UsersRound className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No users match.</EmptyTitle>
                  <EmptyDescription>
                    Try a different search term, Role, or status filter.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={handleInviteOpenChange}
        roleOptions={roleOptions}
        departmentOptions={departmentOptions}
      />
    </>
  );
}
