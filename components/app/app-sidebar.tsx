'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

import { useCurrentUserQuery } from '@/app/queries/identity-access/useCurrentUser';
import { appNavGroups, isNavItemActive, type AppNavItem } from '@/components/app/app-shell-config';
import { SignOutButton } from '@/components/app/sign-out-button';
import { LogoMark } from '@/components/brand/logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

function NavBadge({ value }: { value: string }) {
  return (
    <SidebarMenuBadge>
      <Badge
        variant="outline"
        className="border-sidebar-border bg-sidebar text-sidebar-foreground h-4 px-1 text-xs"
      >
        {value}
      </Badge>
    </SidebarMenuBadge>
  );
}

function AppNavLink({ item }: { item: AppNavItem }) {
  const pathname = usePathname();
  const isActive = isNavItemActive(pathname, item);

  if (item.items?.length) {
    return (
      <SidebarMenuItem>
        <Collapsible defaultOpen={isActive} className="group/collapsible">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isActive}
              className="data-[active=true]:border-sidebar-border data-[active=true]:border"
            >
              <item.icon />
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items.map((subItem) => {
                const isSubItemActive = isNavItemActive(pathname, subItem);

                return (
                  <SidebarMenuSubItem key={subItem.href}>
                    <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                      <Link href={subItem.href}>
                        <span>{subItem.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        isActive={isActive}
        className="data-[active=true]:border-sidebar-border data-[active=true]:border"
      >
        <Link href={item.href}>
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {item.badge ? <NavBadge value={item.badge} /> : null}
    </SidebarMenuItem>
  );
}

function getInitials(name: string, email: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (initials) {
    return initials;
  }

  return email.slice(0, 2).toUpperCase();
}

export function AppSidebar() {
  const { data: currentUser, isLoading } = useCurrentUserQuery();

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="gap-3 p-3">
        <Link
          href="/dashboard"
          className="focus-visible:ring-sidebar-ring flex min-w-0 items-center gap-2 rounded-md p-1 outline-none focus-visible:ring-2"
        >
          <LogoMark />
          <span className="grid min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-heading truncate text-sm leading-none font-semibold">
              Medical EMR
            </span>
            <span className="text-sidebar-foreground/70 truncate text-xs">Redsky Consultancy</span>
          </span>
        </Link>

        <Button
          type="button"
          variant="outline"
          className={cn(
            'border-sidebar-border bg-sidebar hover:bg-sidebar-accent h-auto w-full justify-start gap-2 p-2 text-left',
            'group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0'
          )}
          aria-label={`Active Facility Northgate General, Tenant ${currentUser?.tenant.name ?? ''}`}
        >
          <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
            NG
          </span>
          <span className="grid min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">Northgate General</span>
            {isLoading || !currentUser ? (
              <Skeleton className="mt-0.5 h-3 w-28" />
            ) : (
              <span className="text-muted-foreground truncate text-xs">
                Tenant: {currentUser.tenant.name}
              </span>
            )}
          </span>
        </Button>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {appNavGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <AppNavLink key={item.href} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-3">
        <div className="flex min-w-0 items-center gap-2 rounded-md p-1 group-data-[collapsible=icon]:justify-center">
          {isLoading || !currentUser ? (
            <>
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="grid min-w-0 flex-1 gap-1 group-data-[collapsible=icon]:hidden">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </>
          ) : (
            <>
              <Avatar size="sm">
                <AvatarFallback>
                  {getInitials(currentUser.user.name, currentUser.user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">{currentUser.user.name}</span>
                <span className="text-sidebar-foreground/70 truncate text-xs">
                  {currentUser.user.email}
                </span>
              </div>
            </>
          )}
          <SignOutButton />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
