'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

import { useCurrentUserQuery } from '@/app/queries/identity-access/useCurrentUser';
import {
  appNavGroups,
  getVisibleNavGroups,
  isNavItemActive,
  type AppNavItem,
} from '@/components/app/app-shell-config';
import { SignOutButton } from '@/components/app/sign-out-button';
import { brandLogos } from '@/components/brand/brand-config';
import { useBrandLogoVariant } from '@/components/brand/brand-provider';
import { LogoMark } from '@/components/brand/logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/sidebar';

/**
 * A row on the ink sidebar: muted at rest, the primary pill when current. `SidebarMenuButton`
 * shrinks it to an icon square while the sidebar is collapsed.
 */
const NAV_BUTTON_CLASS =
  'text-sidebar-foreground/70 hover:text-sidebar-foreground data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary h-10 gap-3 rounded-xl px-3 data-active:font-semibold [&_svg]:size-4.5';

/** A parent row with an open submenu: the current child carries the pill, so the parent only brightens. */
const NAV_PARENT_BUTTON_CLASS =
  'text-sidebar-foreground/70 hover:text-sidebar-foreground data-active:text-sidebar-foreground data-active:bg-transparent data-active:hover:bg-sidebar-accent h-10 gap-3 rounded-xl px-3 data-active:font-semibold [&_svg]:size-4.5';

const NAV_SUB_BUTTON_CLASS =
  'text-sidebar-foreground/65 hover:text-sidebar-foreground data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary h-10 translate-x-0 rounded-lg px-3 data-active:font-semibold';

function NavBadge({ value }: { value: string }) {
  return (
    <SidebarMenuBadge>
      <Badge
        variant="outline"
        className="border-sidebar-border bg-sidebar-accent text-sidebar-foreground h-5 px-1.5 text-xs"
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
              className={NAV_PARENT_BUTTON_CLASS}
            >
              <item.icon />
              <span>{item.title}</span>
              <ChevronRight className="ml-auto size-4! opacity-60 transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="mx-0 translate-x-0 gap-1 border-l-0 py-1 pr-0 pl-9">
              {item.items.map((subItem) => {
                const isSubItemActive = isNavItemActive(pathname, subItem);

                return (
                  <SidebarMenuSubItem key={subItem.href}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isSubItemActive}
                      className={NAV_SUB_BUTTON_CLASS}
                    >
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
        className={NAV_BUTTON_CLASS}
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

export function AppSidebar({
  appointmentsOnly,
  showVisits,
  showDemoPages,
}: {
  appointmentsOnly: boolean;
  showVisits: boolean;
  showDemoPages: boolean;
}) {
  const { data: currentUser, isLoading } = useCurrentUserQuery();
  const brandVariant = useBrandLogoVariant();
  const brand = brandVariant === 'none' ? null : brandLogos[brandVariant];

  const visibleNavGroups = useMemo(
    () =>
      getVisibleNavGroups(
        appNavGroups,
        currentUser?.permissions ?? [],
        appointmentsOnly,
        showVisits,
        showDemoPages
      ),
    [currentUser?.permissions, appointmentsOnly, showVisits, showDemoPages]
  );

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="[&_[data-slot=sidebar-inner]]:shadow-fluent-8 [&_[data-slot=sidebar-inner]]:rounded-2xl"
    >
      <SidebarHeader className="px-4 pt-5 pb-3 group-data-[collapsible=icon]:px-2">
        <Link
          href="/dashboard"
          className="focus-visible:ring-sidebar-ring flex min-w-0 items-center gap-3 rounded-lg outline-none group-data-[collapsible=icon]:justify-center focus-visible:ring-2"
        >
          <LogoMark className="size-9 group-data-[collapsible=icon]:size-8" />
          <span className="grid min-w-0 gap-1 group-data-[collapsible=icon]:hidden">
            <span className="font-heading truncate text-base leading-none font-semibold">
              {brand?.name ?? 'Medical EMR'}
            </span>
            <span className="text-sidebar-foreground/55 truncate text-xs leading-none">
              {brand?.subtitle ?? 'Redsky Consultancy'}
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-1 pb-2">
        {visibleNavGroups.map((group) => (
          <SidebarGroup key={group.title} className="px-3 py-1.5">
            <SidebarGroupLabel className="text-sidebar-foreground/45 px-3 font-semibold tracking-widest uppercase">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => (
                  <AppNavLink key={item.href} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:px-2">
        <div className="bg-sidebar-accent/70 ring-sidebar-border/60 flex min-w-0 items-center gap-3 rounded-xl p-2.5 ring-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:ring-0">
          {isLoading || !currentUser ? (
            <>
              <Skeleton className="bg-sidebar-foreground/15 size-8 shrink-0 rounded-full" />
              <div className="grid min-w-0 flex-1 gap-1 group-data-[collapsible=icon]:hidden">
                <Skeleton className="bg-sidebar-foreground/15 h-3.5 w-24" />
                <Skeleton className="bg-sidebar-foreground/15 h-3 w-32" />
              </div>
            </>
          ) : (
            <>
              <Avatar size="sm">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
                  {getInitials(currentUser.user.name, currentUser.user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm leading-tight font-semibold">
                  {currentUser.user.name}
                </span>
                <span className="text-sidebar-foreground/55 truncate text-xs leading-tight">
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
