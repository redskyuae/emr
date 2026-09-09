import type { ReactNode } from 'react';
import { MonitorUp } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export function DesktopWorkspaceGuard({ children }: { children: ReactNode }) {
  return (
    <>
      <Card className="shadow-fluent-2 [@media(min-width:1400px)_and_(min-height:820px)]:hidden">
        <CardContent className="flex min-h-80 flex-col items-center justify-center gap-3 p-8 text-center">
          <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-md">
            <MonitorUp className="size-6" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Desktop workspace required</h2>
            <p className="text-muted-foreground max-w-lg text-sm">
              This safety-focused cockpit needs a viewport of at least 1400 × 820 pixels so the
              complete Visit remains visible without tabs or scrolling.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="hidden [@media(min-width:1400px)_and_(min-height:820px)]:block">
        {children}
      </div>
    </>
  );
}
