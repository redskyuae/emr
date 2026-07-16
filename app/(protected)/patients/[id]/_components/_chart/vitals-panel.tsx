'use client';

import { Activity } from 'lucide-react';

import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';

import { formatChartDate } from '../../_utils/chart-value-sets';
import { ChartPanel, ChartPanelEmpty, ChartRowActions } from './chart-panel';

function VitalTile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-muted/40 rounded-lg border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-lg font-semibold">
        {value}
        {value !== '—' && unit ? (
          <span className="text-muted-foreground text-sm font-normal"> {unit}</span>
        ) : null}
      </p>
    </div>
  );
}

const show = (value: number | null) => (value === null ? '—' : String(value));

function formatDateTime(value: string): string {
  const iso = String(value);
  const date = formatChartDate(iso);
  const time = iso.length >= 16 ? iso.slice(11, 16) : '';
  return time ? `${date}, ${time}` : date;
}

export function VitalsPanel({
  vitalSigns,
  onAdd,
  onEdit,
  onDelete,
}: {
  vitalSigns: PatientVitalSign[];
  onAdd: () => void;
  onEdit: (vitalSign: PatientVitalSign) => void;
  onDelete: (vitalSign: PatientVitalSign) => void;
}) {
  const latest = vitalSigns[0];

  return (
    <ChartPanel
      title="Vital Signs"
      icon={<Activity className="size-4" />}
      count={vitalSigns.length}
      addLabel="Record Vitals"
      onAdd={onAdd}
    >
      {vitalSigns.length === 0 || !latest ? (
        <ChartPanelEmpty message="No vital signs recorded." />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <VitalTile
              label="Blood pressure"
              value={
                latest.systolic !== null && latest.diastolic !== null
                  ? `${latest.systolic}/${latest.diastolic}`
                  : '—'
              }
              unit="mmHg"
            />
            <VitalTile label="Pulse" value={show(latest.pulseBpm)} unit="bpm" />
            <VitalTile label="Temp" value={show(latest.temperatureC)} unit="°C" />
            <VitalTile label="SpO₂" value={show(latest.spo2)} unit="%" />
            <VitalTile label="BMI" value={show(latest.bmi)} />
            <VitalTile label="Weight" value={show(latest.weightKg)} unit="kg" />
          </div>

          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
              History
            </p>
            <ul className="divide-border/60 divide-y">
              {vitalSigns.map((vital) => (
                <li key={vital.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="text-muted-foreground w-36 shrink-0 text-xs">
                      {formatDateTime(String(vital.recordedAt))}
                    </span>
                    {vital.systolic !== null && vital.diastolic !== null ? (
                      <span>
                        BP {vital.systolic}/{vital.diastolic}
                      </span>
                    ) : null}
                    {vital.pulseBpm !== null ? <span>HR {vital.pulseBpm}</span> : null}
                    {vital.temperatureC !== null ? <span>{vital.temperatureC}°C</span> : null}
                    {vital.spo2 !== null ? <span>SpO₂ {vital.spo2}%</span> : null}
                    {vital.bmi !== null ? <span>BMI {vital.bmi}</span> : null}
                  </div>
                  <ChartRowActions onEdit={() => onEdit(vital)} onDelete={() => onDelete(vital)} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </ChartPanel>
  );
}
