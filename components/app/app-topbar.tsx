'use client';

import { useEffect, useRef } from 'react';
import { Bell, CircleHelp, Search } from 'lucide-react';

import { TenantChip } from '@/components/app/tenant-chip';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * The utility bar above every page: the sidebar trigger, global search, the active Tenant, help
 * and notifications. The page's own title and primary action live in `AppPageHeader` below it.
 */
export function AppTopbar() {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="acrylic sticky top-0 z-20">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <SidebarTrigger className="text-muted-foreground -ml-2 shrink-0" />

        <InputGroup className="shadow-fluent-2 max-w-md min-w-0 flex-1 rounded-full">
          <InputGroupAddon className="pl-4">
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchInputRef}
            type="search"
            placeholder="Search patients, appointments, users..."
            aria-label="Global search"
            className="text-sm"
          />
          <InputGroupAddon align="inline-end" className="hidden pr-4 sm:flex">
            <Kbd>/</Kbd>
          </InputGroupAddon>
        </InputGroup>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <TenantChip className="mr-2 hidden md:inline-flex" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Help"
                className="text-muted-foreground rounded-full"
              >
                <CircleHelp className="size-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Help</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                className="text-muted-foreground relative rounded-full"
              >
                <Bell className="size-4.5" />
                <span className="bg-primary ring-background absolute top-2 right-2 size-2 rounded-full ring-2" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
