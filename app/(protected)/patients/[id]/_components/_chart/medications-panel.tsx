'use client';

import { Pill } from 'lucide-react';

import type { PatientMedication } from '@/app/api/lib/modules/patient-medication/schemas/patient-medication-schema';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import {
  formatChartDate,
  getClinicalStatusTone,
  getMedicationStatusLabel,
} from '../../_utils/chart-value-sets';
import { ChartPanel, ChartPanelEmpty, ChartRowActions } from './chart-panel';

function MedicationRow({
  medication,
  onEdit,
  onDelete,
}: {
  medication: PatientMedication;
  onEdit: (medication: PatientMedication) => void;
  onDelete: (medication: PatientMedication) => void;
}) {
  const detail = [medication.dose, medication.route, medication.frequency]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="flex items-start justify-between gap-3 py-3 first:pt-0">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{medication.drugName}</span>
          <Badge variant="outline" className={cn(getClinicalStatusTone(medication.status))}>
            {getMedicationStatusLabel(medication.status)}
          </Badge>
        </div>
        {detail ? <p className="text-muted-foreground text-sm">{detail}</p> : null}
        {medication.startDate || medication.endDate ? (
          <p className="text-muted-foreground text-xs">
            {medication.startDate ? `From ${formatChartDate(medication.startDate)}` : null}
            {medication.endDate ? ` to ${formatChartDate(medication.endDate)}` : null}
          </p>
        ) : null}
      </div>
      <ChartRowActions onEdit={() => onEdit(medication)} onDelete={() => onDelete(medication)} />
    </li>
  );
}

export function MedicationsPanel({
  medications,
  onAdd,
  onEdit,
  onDelete,
}: {
  medications: PatientMedication[];
  onAdd: () => void;
  onEdit: (medication: PatientMedication) => void;
  onDelete: (medication: PatientMedication) => void;
}) {
  const active = medications.filter((medication) => medication.status === 'active');
  const historical = medications.filter((medication) => medication.status !== 'active');

  return (
    <ChartPanel
      title="Medications"
      icon={<Pill className="size-4" />}
      count={medications.length}
      addLabel="Add Medication"
      onAdd={onAdd}
    >
      {medications.length === 0 ? (
        <ChartPanelEmpty message="No medications recorded." />
      ) : (
        <div className="space-y-4">
          {active.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                Active
              </p>
              <ul className="divide-border/60 divide-y">
                {active.map((medication) => (
                  <MedicationRow
                    key={medication.id}
                    medication={medication}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {historical.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                Stopped / Completed
              </p>
              <ul className="divide-border/60 divide-y">
                {historical.map((medication) => (
                  <MedicationRow
                    key={medication.id}
                    medication={medication}
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
