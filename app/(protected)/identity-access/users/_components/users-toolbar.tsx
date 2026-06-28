'use client';

import { useEffect, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type RoleOption = {
  id: number;
  name: string;
};

type UsersToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  roleValue: string;
  onRoleChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  roles: RoleOption[];
  rolesLoading: boolean;
  onAddUser: () => void;
};

const ALL = 'all';

export function UsersToolbar({
  search,
  onSearchChange,
  roleValue,
  onRoleChange,
  statusValue,
  onStatusChange,
  roles,
  rolesLoading,
  onAddUser,
}: UsersToolbarProps) {
  const [searchDraft, setSearchDraft] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);

  // Keep the local draft in sync when the URL-backed value changes elsewhere
  // (e.g. cleared filters, back/forward navigation) by adjusting state during
  // render rather than in an effect — the documented React pattern for syncing
  // state to a changed prop.
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setSearchDraft(search);
  }

  // Debounce so we don't hit the server on every keystroke.
  useEffect(() => {
    if (searchDraft === search) {
      return;
    }

    const timer = setTimeout(() => onSearchChange(searchDraft.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchDraft, search, onSearchChange]);

  return (
    <Card className="shadow-fluent-2">
      <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-sm">
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search Staff by name, email, or code"
            aria-label="Search Staff"
          />
        </InputGroup>

        <Select
          value={roleValue || ALL}
          onValueChange={(value) => onRoleChange(value === ALL ? '' : value)}
          disabled={rolesLoading}
        >
          <SelectTrigger className="h-9 w-full lg:w-48" aria-label="Filter by Role">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={String(role.id)}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusValue || ALL}
          onValueChange={(value) => onStatusChange(value === ALL ? '' : value)}
        >
          <SelectTrigger className="h-9 w-full lg:w-40" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Button type="button" onClick={onAddUser} className="lg:ml-auto">
          <UserPlus className="size-4" />
          Add user
        </Button>
      </CardContent>
    </Card>
  );
}
