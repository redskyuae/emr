'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import { Button } from '@/components/ui/button';
import { downloadAppointmentsExcel, downloadAppointmentsPdf } from '../_utils/appointment-export';

type ExportFormat = 'excel' | 'pdf';

export function AppointmentExportActions({
  appointments,
  disabled,
  slotDate,
  logoUrl,
  organizationName,
  organizationSubtitle,
}: {
  appointments: Appointment[];
  disabled: boolean;
  slotDate: string;
  logoUrl: string | null;
  organizationName: string;
  organizationSubtitle: string;
}) {
  const [pendingFormat, setPendingFormat] = useState<ExportFormat | null>(null);

  async function download(format: ExportFormat) {
    setPendingFormat(format);

    try {
      if (format === 'excel') {
        await downloadAppointmentsExcel(
          appointments,
          slotDate,
          organizationName,
          organizationSubtitle,
          logoUrl
        );
      } else {
        await downloadAppointmentsPdf(
          appointments,
          slotDate,
          organizationName,
          organizationSubtitle,
          logoUrl
        );
      }

      toast.success(`${format === 'excel' ? 'Excel' : 'PDF'} downloaded.`);
    } catch {
      toast.error(`Could not download the ${format === 'excel' ? 'Excel' : 'PDF'} file.`);
    } finally {
      setPendingFormat(null);
    }
  }

  const isDisabled = disabled || appointments.length === 0 || pendingFormat !== null;

  return (
    <div className="flex flex-1 gap-2 sm:flex-none">
      <Button
        type="button"
        variant="outline"
        className="flex-1 sm:flex-none"
        disabled={isDisabled}
        aria-busy={pendingFormat === 'excel'}
        onClick={() => void download('excel')}
      >
        <FileSpreadsheet className="size-4" aria-hidden="true" />
        {pendingFormat === 'excel' ? 'Preparing Excel...' : 'Download Excel'}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="flex-1 sm:flex-none"
        disabled={isDisabled}
        aria-busy={pendingFormat === 'pdf'}
        onClick={() => void download('pdf')}
      >
        <FileText className="size-4" aria-hidden="true" />
        {pendingFormat === 'pdf' ? 'Preparing PDF...' : 'Download PDF'}
      </Button>
    </div>
  );
}
