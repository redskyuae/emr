import type { Dispatch } from 'react';
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  PrinterIcon,
  SaveIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AssessmentAction, AssessmentState } from '../_utils/assessment-state';

export function AssessmentCommandBar({
  state,
  dispatch,
  errors,
  onValidate,
  confirmOpen,
  onConfirmOpenChange,
}: {
  state: AssessmentState;
  dispatch: Dispatch<AssessmentAction>;
  errors: string[];
  onValidate: () => void;
  confirmOpen: boolean;
  onConfirmOpenChange: (open: boolean) => void;
}) {
  const completed = state.status === 'COMPLETED';

  function saveDraft() {
    dispatch({ type: 'save-draft', savedAt: new Date().toISOString() });
    toast.success('Visit draft saved locally.');
  }

  function completeVisit() {
    dispatch({ type: 'complete-visit', completedAt: new Date().toISOString() });
    toast.success('Visit completed.');
  }

  return (
    <>
      <div className="bg-card shadow-fluent-8 flex min-w-0 items-center justify-between gap-2 rounded-lg border px-3">
        <div className="flex min-w-0 items-center gap-2">
          {errors.length ? (
            <Alert className="h-8 w-auto min-w-0 grid-cols-[auto_1fr] py-1" variant="destructive">
              <TriangleAlertIcon aria-hidden="true" />
              <AlertDescription className="truncate text-[10px]">
                {errors.join(' ')}
              </AlertDescription>
            </Alert>
          ) : completed ? (
            <Badge className="gap-1" variant="secondary">
              <CheckCircle2Icon aria-hidden="true" /> Visit completed
            </Badge>
          ) : (
            <p className="text-muted-foreground truncate text-[10px]">
              Static demo · changes stay in this browser session
              {state.lastSavedAt ? ' · Draft saved' : ''}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            type="button"
            variant="ghost"
            onClick={() =>
              toast.info('Malaffi patient history is shown as a static demo shortcut.')
            }
          >
            <ExternalLinkIcon aria-hidden="true" />
            Malaffi history
          </Button>
          <Button size="sm" type="button" variant="outline" onClick={() => window.print()}>
            <PrinterIcon aria-hidden="true" />
            Print
          </Button>
          <Button
            disabled={completed}
            size="sm"
            type="button"
            variant="outline"
            onClick={saveDraft}
          >
            <SaveIcon aria-hidden="true" />
            Save draft
          </Button>
          <Button disabled={completed} size="sm" type="button" onClick={onValidate}>
            <CheckCircle2Icon aria-hidden="true" />
            Complete Visit
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={onConfirmOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete this Visit?</AlertDialogTitle>
            <AlertDialogDescription>
              This locks the assessment, examination, orders, and discharge information in this
              demo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue editing</AlertDialogCancel>
            <AlertDialogAction onClick={completeVisit}>Complete Visit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
