'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronsUpDown, LogOut } from 'lucide-react';

import { appNavGroups, isNavItemActive, type AppNavItem } from '@/components/app/app-shell-config';
import { LogoMark } from '@/components/brand/logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
        className="border-sidebar-border bg-sidebar text-sidebar-foreground h-4 px-1 text-[10px]"
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

export function AppSidebar() {
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
          aria-label="Active Facility Northgate General, Tenant Northgate Health"
        >
          <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
            NG
          </span>
          <span className="grid min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">Northgate General</span>
            <span className="text-muted-foreground truncate text-xs">Tenant: Northgate Health</span>
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
          <Avatar size="sm">
            <AvatarFallback>RM</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">Rakesh Mirtha</span>
            <span className="text-sidebar-foreground/70 truncate text-xs">Tenant Admin</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="group-data-[collapsible=icon]:hidden"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
