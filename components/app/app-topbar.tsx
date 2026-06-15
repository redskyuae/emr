'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CircleHelp, Plus, Search } from 'lucide-react';

import { getAppPageMeta } from '@/components/app/app-shell-config';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function AppTopbar() {
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pageMeta = getAppPageMeta(pathname);

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
    <header className="acrylic sticky top-0 z-20 border-b">
      <div className="flex min-h-16 flex-col gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:gap-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <div className="min-w-0">
            <h1 className="truncate text-lg leading-tight font-semibold sm:text-xl">
              {pageMeta.title}
            </h1>
            <p className="text-muted-foreground line-clamp-2 text-xs sm:text-sm">
              {pageMeta.subtitle}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
          <InputGroup className="bg-background shadow-fluent-2 h-9 sm:max-w-sm lg:max-w-md">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchInputRef}
              type="search"
              placeholder="Search patients, appointments, users..."
              aria-label="Global search"
              className="text-sm"
            />
            <InputGroupAddon align="inline-end">
              <Kbd>/</Kbd>
            </InputGroupAddon>
          </InputGroup>

          <div className="flex items-center justify-end gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Help">
                  <CircleHelp className="size-4" />
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
                  className="relative"
                >
                  <Bell className="size-4" />
                  <span className="bg-primary ring-background absolute top-1.5 right-1.5 size-2 rounded-full ring-2" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            {pageMeta.primaryAction ? (
              <Button asChild className="ml-1">
                <Link href={pageMeta.primaryAction.href}>
                  <Plus className="size-4" />
                  <span>{pageMeta.primaryAction.label}</span>
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
