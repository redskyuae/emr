'use client';

import { TriangleAlert } from 'lucide-react';

import type { PatientAllergy } from '@/app/api/lib/modules/patient-allergy/schemas/patient-allergy-schema';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function allergyLabel(allergy: PatientAllergy, allergenName: (id: number) => string): string {
  if (allergy.allergenId) {
    return allergenName(allergy.allergenId);
  }
  return allergy.substance ?? 'Unknown substance';
}

// Safety banner: surfaces every active allergy prominently at the top of the chart.
export function AllergyBanner({
  allergies,
  allergenName,
}: {
  allergies: PatientAllergy[];
  allergenName: (id: number) => string;
}) {
  const active = allergies.filter((allergy) => allergy.status === 'active');

  if (active.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" role="alert">
      <TriangleAlert className="size-4" />
      <AlertTitle>Allergy alert</AlertTitle>
      <AlertDescription>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {active.map((allergy) => (
            <span key={allergy.id} className="font-medium">
              {allergyLabel(allergy, allergenName)}
              {allergy.reaction ? <span className="font-normal"> — {allergy.reaction}</span> : null}
              <span className="font-normal"> ({allergy.severity})</span>
            </span>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
