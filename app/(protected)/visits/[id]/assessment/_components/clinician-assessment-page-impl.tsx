import type { StaticClinicianVisit } from '../../../_data/static-clinician-visits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DesktopWorkspaceGuard } from './desktop-workspace-guard';
import { VisitSafetyStrip } from './visit-safety-strip';

const columns = [
  ['Assess', 'Vital Signs, history, Allergies, and Problems'],
  ['Examine', 'Review of Systems and Physical Examination'],
  ['Plan', 'Diagnosis, treatment, prescription, and completion'],
] as const;

export function ClinicianAssessmentPageImpl({ visit }: { visit: StaticClinicianVisit }) {
  return (
    <DesktopWorkspaceGuard>
      <main
        className="grid h-[calc(100svh-7rem)] min-h-0 grid-rows-[5rem_minmax(0,1fr)_3.5rem] gap-2 overflow-hidden"
        data-testid="clinician-cockpit"
      >
        <VisitSafetyStrip visit={visit} />

        <div className="grid min-h-0 grid-cols-3 gap-2">
          {columns.map(([title, description]) => (
            <Card key={title} className="shadow-fluent-2 min-h-0 overflow-hidden">
              <CardHeader className="border-b p-3">
                <CardTitle className="text-sm">{title}</CardTitle>
                <p className="text-muted-foreground text-xs">{description}</p>
              </CardHeader>
              <CardContent className="p-3" />
            </Card>
          ))}
        </div>

        <div className="bg-card shadow-fluent-8 flex items-center rounded-lg border px-3 text-sm">
          Complete workflow actions
        </div>
      </main>
    </DesktopWorkspaceGuard>
  );
}
