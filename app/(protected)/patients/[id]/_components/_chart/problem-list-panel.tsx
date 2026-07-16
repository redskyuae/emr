'use client';

import { ClipboardList } from 'lucide-react';

import type { PatientProblem } from '@/app/api/lib/modules/patient-problem/schemas/patient-problem-schema';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import {
  formatChartDate,
  getClinicalStatusTone,
  getProblemStatusLabel,
} from '../../_utils/chart-value-sets';
import { ChartPanel, ChartPanelEmpty, ChartRowActions } from './chart-panel';

function ProblemRow({
  problem,
  diagnosisCode,
  onEdit,
  onDelete,
}: {
  problem: PatientProblem;
  diagnosisCode: (id: number) => string | undefined;
  onEdit: (problem: PatientProblem) => void;
  onDelete: (problem: PatientProblem) => void;
}) {
  const code = problem.diagnosisCodeId ? diagnosisCode(problem.diagnosisCodeId) : undefined;

  return (
    <li className="flex items-start justify-between gap-3 py-3 first:pt-0">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {code ? (
            <Badge variant="outline" className="font-mono">
              {code}
            </Badge>
          ) : null}
          <span className="font-medium">{problem.title}</span>
          <Badge variant="outline" className={cn(getClinicalStatusTone(problem.clinicalStatus))}>
            {getProblemStatusLabel(problem.clinicalStatus)}
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs">
          {problem.onsetDate ? `Onset ${formatChartDate(problem.onsetDate)}` : null}
          {problem.resolvedDate ? ` · Resolved ${formatChartDate(problem.resolvedDate)}` : null}
        </p>
      </div>
      <ChartRowActions onEdit={() => onEdit(problem)} onDelete={() => onDelete(problem)} />
    </li>
  );
}

export function ProblemListPanel({
  problems,
  diagnosisCode,
  onAdd,
  onEdit,
  onDelete,
}: {
  problems: PatientProblem[];
  diagnosisCode: (id: number) => string | undefined;
  onAdd: () => void;
  onEdit: (problem: PatientProblem) => void;
  onDelete: (problem: PatientProblem) => void;
}) {
  const active = problems.filter((problem) => problem.clinicalStatus === 'active');
  const inactive = problems.filter((problem) => problem.clinicalStatus !== 'active');

  return (
    <ChartPanel
      title="Problem List"
      icon={<ClipboardList className="size-4" />}
      count={problems.length}
      addLabel="Add Problem"
      onAdd={onAdd}
    >
      {problems.length === 0 ? (
        <ChartPanelEmpty message="No problems recorded." />
      ) : (
        <div className="space-y-4">
          {active.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                Active
              </p>
              <ul className="divide-border/60 divide-y">
                {active.map((problem) => (
                  <ProblemRow
                    key={problem.id}
                    problem={problem}
                    diagnosisCode={diagnosisCode}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {inactive.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                Resolved / Inactive
              </p>
              <ul className="divide-border/60 divide-y">
                {inactive.map((problem) => (
                  <ProblemRow
                    key={problem.id}
                    problem={problem}
                    diagnosisCode={diagnosisCode}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </ChartPanel>
  );
}
