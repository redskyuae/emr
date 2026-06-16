import Link from 'next/link';
import { ArrowRight, CalendarClock, ClipboardCheck, ShieldCheck } from 'lucide-react';

import { appShellShortcuts, appShellStats } from '@/components/app/app-shell-config';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const workQueue = [
  {
    title: 'Review appointment master setup',
    detail: 'Confirm Modes, Types, Statuses, Reasons, and Cancelled Reasons.',
    icon: CalendarClock,
  },
  {
    title: 'Prepare IAM screens',
    detail: 'Users, Roles & Permissions, and Sessions can now share this shell.',
    icon: ShieldCheck,
  },
  {
    title: 'Check placeholder routes',
    detail: 'Future modules are linked from navigation and may 404 until their pages land.',
    icon: ClipboardCheck,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {appShellStats.map((stat) => (
          <Card key={stat.label} className="shadow-fluent-2">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
                <stat.icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-muted-foreground truncate text-xs font-medium">{stat.label}</p>
                <p className="text-base leading-tight font-semibold break-words">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="shadow-fluent-2">
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Module shortcuts</CardTitle>
              <Badge variant="outline">Navigation only</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 p-3 sm:grid-cols-2">
            {appShellShortcuts.map((shortcut) => (
              <Button
                key={shortcut.href}
                asChild
                variant="ghost"
                className="h-auto justify-start gap-3 p-3 text-left"
              >
                <Link href={shortcut.href}>
                  <span className="bg-muted text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
                    <shortcut.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{shortcut.title}</span>
                    <span className="text-muted-foreground line-clamp-2 text-xs whitespace-normal">
                      {shortcut.description}
                    </span>
                  </span>
                  <ArrowRight className="text-muted-foreground size-4" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-fluent-2">
          <CardHeader className="border-b pb-3">
            <CardTitle>Shell readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {workQueue.map((item) => (
              <div key={item.title} className="flex gap-3 rounded-md p-2">
                <span className="bg-muted text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md">
                  <item.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-xs">{item.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
