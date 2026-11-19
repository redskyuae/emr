'use client';

import { useEffect, useRef, useState } from 'react';
import { TimerIcon } from 'lucide-react';

import { IDLE_WARNING_MS } from '@/app/lib/idle-session';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogMedia,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';

type IdleWarningDialogProps = {
  expiresAt: number;
  isSigningOut: boolean;
  onSignOut: () => void;
  onContinue: () => void;
};

// Mounted only while the warning is showing, so the countdown starts fresh each time.
export function IdleWarningDialog({
  expiresAt,
  isSigningOut,
  onSignOut,
  onContinue,
}: IdleWarningDialogProps) {
  const [now, setNow] = useState(() => Date.now());
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, []);

  const secondsLeft = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const totalSeconds = IDLE_WARNING_MS / 1000;

  return (
    // Controlled and always open: Esc and outside clicks do nothing, so only a button responds.
    <AlertDialog open>
      <AlertDialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          continueRef.current?.focus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TimerIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Your Session is about to expire</AlertDialogTitle>
          <AlertDialogDescription>
            You have been inactive for a while. For your security, you will be signed out
            automatically unless you continue your Session.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2">
          <p role="timer" className="text-sm">
            Signing out in{' '}
            <span className="font-semibold tabular-nums">
              {secondsLeft} {secondsLeft === 1 ? 'second' : 'seconds'}
            </span>
          </p>
          <Progress
            value={(secondsLeft / totalSeconds) * 100}
            aria-label="Time left before sign-out"
            className="motion-reduce:*:transition-none"
          />
        </div>

        <AlertDialogFooter>
          <Button type="button" variant="outline" disabled={isSigningOut} onClick={onSignOut}>
            {isSigningOut ? <Spinner className="size-4" /> : null}
            {isSigningOut ? 'Signing out' : 'Logout Now'}
          </Button>
          <Button ref={continueRef} type="button" disabled={isSigningOut} onClick={onContinue}>
            Continue Session
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
