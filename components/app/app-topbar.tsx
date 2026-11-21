'use client';

import { useEffect, useRef } from 'react';
import { CiBellOn, CiCircleQuestion, CiSearch } from 'react-icons/ci';

import { TenantChip } from '@/components/app/tenant-chip';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';

// How long typing must pause before an attempt counts, so one search is one event.
const SEARCH_PAUSE_MS = 1000;

/**
 * The search box does nothing yet; this measures whether staff expect it to. It records the
 * length of what was typed, once per pause, never the text.
 */
function useGlobalSearchAttempts() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return (value: string) => {
    if (timer.current) clearTimeout(timer.current);

    const queryLength = value.trim().length;

    if (queryLength === 0) {
      timer.current = null;
      return;
    }

    timer.current = setTimeout(() => {
      timer.current = null;
      captureAnalyticsEvent('global_search_attempted', { query_length: queryLength });
    }, SEARCH_PAUSE_MS);
  };
}

/**
 * The utility bar above every page: the sidebar trigger, global search, the active Tenant, help
 * and notifications. The page's own title and primary action live in `AppPageHeader` below it.
 */
export function AppTopbar() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recordSearchAttempt = useGlobalSearchAttempts();

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

        <InputGroup className="max-w-md min-w-0 flex-1 rounded-full">
          <InputGroupAddon className="pl-4">
            <CiSearch className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchInputRef}
            type="search"
            placeholder="Search patients, appointments, users..."
            aria-label="Global search"
            className="text-sm"
            onChange={(event) => recordSearchAttempt(event.target.value)}
          />
          <InputGroupAddon align="inline-end" className="hidden pr-4 sm:flex">
            <Kbd>/</Kbd>
          </InputGroupAddon>
        </InputGroup>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <TenantChip className="mr-2 hidden max-w-xs md:inline-flex" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Help"
                className="text-muted-foreground rounded-full"
              >
                <CiCircleQuestion className="size-4.5" />
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
                <CiBellOn className="size-4.5" />
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
