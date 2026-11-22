import { PiBedDuotone, PiMagnifyingGlassDuotone, PiPlusLight } from 'react-icons/pi';

import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';

// The inpatient census with nobody to list. The default Admitted status is "who is in the hospital
// now", not a filter, so only a search, another status, a Ward or a Doctor turns this into
// "No results found".
export function AdmissionsEmptyState({
  isFiltered,
  canCreate,
  onAdmit,
}: {
  /** A search, a non-default status, a Ward or a Doctor is narrowing the census. */
  isFiltered: boolean;
  /** The user may admit, so the "nothing yet" state offers Admit Patient. */
  canCreate: boolean;
  onAdmit: () => void;
}) {
  if (isFiltered) {
    return (
      <EmptyState
        tone="neutral"
        title="No results found"
        icon={PiMagnifyingGlassDuotone}
        className="bg-card min-h-72 border"
        description="No Admissions match the current search and filters."
      />
    );
  }

  return (
    <EmptyState
      tone="sky"
      icon={PiBedDuotone}
      title="No current Admissions"
      className="bg-card min-h-80 border"
      description="Admit a Patient to a free Bed to start the inpatient census. Configure Wards and Beds under Inpatient Masters first."
      actions={
        canCreate ? (
          <Button type="button" onClick={onAdmit}>
            <PiPlusLight className="size-4" />
            Admit Patient
          </Button>
        ) : null
      }
    />
  );
}
