'use client';

import { ShieldAlert } from 'lucide-react';

import type { PatientAllergy } from '@/app/api/lib/modules/patient-allergy/schemas/patient-allergy-schema';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import {
  formatChartDate,
  getAllergySeverityLabel,
  getAllergySeverityTone,
  getAllergyStatusLabel,
  getClinicalStatusTone,
} from '../../_utils/chart-value-sets';
import { ChartPanel, ChartPanelEmpty, ChartRowActions } from './chart-panel';

export function AllergyPanel({
  allergies,
  allergenName,
  onAdd,
  onEdit,
  onDelete,
}: {
  allergies: PatientAllergy[];
  allergenName: (id: number) => string;
  onAdd: () => void;
  onEdit: (allergy: PatientAllergy) => void;
  onDelete: (allergy: PatientAllergy) => void;
}) {
  return (
    <ChartPanel
      title="Allergies"
      icon={<ShieldAlert className="size-4" />}
      count={allergies.length}
      addLabel="Add Allergy"
      onAdd={onAdd}
    >
      {allergies.length === 0 ? (
        <ChartPanelEmpty message="No known allergies recorded." />
      ) : (
        <ul className="divide-border/60 divide-y">
          {allergies.map((allergy) => (
            <li key={allergy.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {allergy.allergenId ? allergenName(allergy.allergenId) : allergy.substance}
                  </span>
                  <Badge variant="outline" className={cn(getAllergySeverityTone(allergy.severity))}>
                    {getAllergySeverityLabel(allergy.severity)}
                  </Badge>
                  <Badge variant="outline" className={cn(getClinicalStatusTone(allergy.status))}>
                    {getAllergyStatusLabel(allergy.status)}
                  </Badge>
                </div>
                {allergy.reaction ? (
                  <p className="text-muted-foreground text-sm">{allergy.reaction}</p>
                ) : null}
                {allergy.notedOn ? (
                  <p className="text-muted-foreground text-xs">
                    Noted {formatChartDate(allergy.notedOn)}
                  </p>
                ) : null}
              </div>
              <ChartRowActions onEdit={() => onEdit(allergy)} onDelete={() => onDelete(allergy)} />
            </li>
          ))}
        </ul>
      )}
    </ChartPanel>
  );
}
