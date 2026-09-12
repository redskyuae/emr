import type { Dispatch } from 'react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
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
import { consultationSteps } from './consultation-progress';

export function AssessmentCommandBar({
  state,
  dispatch,
  errors,
  onValidate,
  currentStep,
  stepCount,
  onNext,
  onPrevious,
  confirmOpen,
  onConfirmOpenChange,
}: {
  state: AssessmentState;
  dispatch: Dispatch<AssessmentAction>;
  errors: string[];
  onValidate: () => void;
  currentStep: number;
  stepCount: number;
  onNext: () => void;
  onPrevious: () => void;
  confirmOpen: boolean;
  onConfirmOpenChange: (open: boolean) => void;
}) {
  const completed = state.status === 'COMPLETED';
  const finalStep = currentStep === stepCount - 1;
  const nextStep = consultationSteps[currentStep + 1];
  const savedTime = state.lastSavedAt
    ? new Date(state.lastSavedAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

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
      <div className="bg-card shadow-fluent-8 flex min-w-0 flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {errors.length ? (
            <Alert className="w-full min-w-0 grid-cols-[auto_1fr] py-2" variant="destructive">
              <TriangleAlertIcon aria-hidden="true" />
              <AlertDescription>{errors.join(' ')}</AlertDescription>
            </Alert>
          ) : completed ? (
            <Badge className="gap-1" variant="secondary">
              <CheckCircle2Icon aria-hidden="true" /> Visit completed
            </Badge>
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <Badge variant="outline">
                Step {currentStep + 1} of {stepCount}
              </Badge>
              <p className="text-muted-foreground text-xs">
                Static demo · changes stay in this browser session
                {savedTime ? ` · Last saved ${savedTime}` : ''}
              </p>
            </div>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto lg:shrink-0">
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
          {currentStep > 0 ? (
            <Button onClick={onPrevious} size="sm" type="button" variant="outline">
              <ArrowLeftIcon aria-hidden="true" />
              Previous
            </Button>
          ) : null}
          {finalStep ? (
            <Button disabled={completed} size="sm" type="button" onClick={onValidate}>
              <CheckCircle2Icon aria-hidden="true" />
              Complete Visit
            </Button>
          ) : (
            <Button onClick={onNext} size="sm" type="button">
              Next: {nextStep?.label}
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          )}
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
