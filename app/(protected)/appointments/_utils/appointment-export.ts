import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';

const headers = [
  'Booking',
  'Date',
  'Time',
  'Patient',
  'MRN',
  'Phone',
  'Doctor',
  'Therapist',
  'Type',
  'Mode',
  'Treatment',
  'Status',
] as const;

type AppointmentExportRow = Record<(typeof headers)[number], string>;
type ReportLogo = { dataUrl: string; aspectRatio: number };

const REPORT_TITLE = 'Appointment Schedule';
const EXCEL_PRIMARY = 'FF193E68';
const EXCEL_MUTED = 'FF526170';
const EXCEL_BORDER = 'FFD5DEE8';

function appointmentTime(appointment: Appointment) {
  if (appointment.startTime && appointment.endTime) {
    return `${appointment.startTime}-${appointment.endTime}`;
  }

  const first = appointment.slots[0]?.slotTime;
  const last = appointment.slots.at(-1)?.slotTime;

  if (!first || !last) return 'N/A';
  return first === last ? first : `${first}-${last}`;
}

function exportFileDate(slotDate: string) {
  const [day, month, year] = slotDate.split('-');
  return day && month && year ? `${year}-${month}-${day}` : slotDate.replaceAll('/', '-');
}

function organizationInitials(organizationName: string) {
  return (
    organizationName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'EMR'
  );
}

function containedSize(aspectRatio: number, maxWidth: number, maxHeight: number) {
  if (aspectRatio >= maxWidth / maxHeight) {
    return { width: maxWidth, height: maxWidth / aspectRatio };
  }

  return { width: maxHeight * aspectRatio, height: maxHeight };
}

function excelFooterText(value: string) {
  return value.replaceAll('&', '&&');
}

async function loadReportLogo(logoUrl: string | null): Promise<ReportLogo | null> {
  if (!logoUrl) return null;

  try {
    const response = await fetch(logoUrl, { credentials: 'omit' });
    if (!response.ok) return null;

    const blobUrl = URL.createObjectURL(await response.blob());

    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Could not decode the Tenant logo'));
        image.src = blobUrl;
      });

      if (!image.naturalWidth || !image.naturalHeight) return null;

      const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) return null;

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      return {
        dataUrl: canvas.toDataURL('image/png'),
        aspectRatio: image.naturalWidth / image.naturalHeight,
      };
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch {
    return null;
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function buildAppointmentExportRows(appointments: Appointment[]): AppointmentExportRow[] {
  return appointments.map((appointment) => ({
    Booking: appointment.bookingNumber,
    Date: appointment.slotDate,
    Time: appointmentTime(appointment),
    Patient: `${appointment.patient.firstName} ${appointment.patient.lastName}`.trim(),
    MRN: appointment.patient.mrn,
    Phone: appointment.patient.phone,
    Doctor: appointment.doctor?.name ?? 'N/A',
    Therapist: appointment.therapist?.name ?? 'N/A',
    Type: appointment.appointmentType?.name ?? appointment.bookingPath,
    Mode: appointment.appointmentMode?.name ?? 'N/A',
    Treatment: appointment.treatment?.name ?? 'N/A',
    Status: appointment.appointmentStatus.name,
  }));
}

export async function downloadAppointmentsExcel(
  appointments: Appointment[],
  slotDate: string,
  organizationName: string,
  organizationSubtitle: string,
  logoUrl: string | null
) {
  const [{ Workbook }, logo] = await Promise.all([import('exceljs'), loadReportLogo(logoUrl)]);
  const workbook = new Workbook();
  workbook.company = organizationName;
  workbook.creator = organizationName;
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet('Appointments', {
    views: [{ state: 'frozen', ySplit: 7 }],
    pageSetup: {
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      orientation: 'landscape',
      paperSize: 9,
      showGridLines: false,
      horizontalCentered: true,
      printTitlesRow: '7:7',
      margins: { top: 0.5, bottom: 0.5, left: 0.3, right: 0.3, header: 0.2, footer: 0.2 },
    },
  });
  const rows = buildAppointmentExportRows(appointments);

  worksheet.columns = [
    { width: 17 },
    { width: 13 },
    { width: 15 },
    { width: 24 },
    { width: 16 },
    { width: 16 },
    { width: 22 },
    { width: 22 },
    { width: 20 },
    { width: 16 },
    { width: 26 },
    { width: 16 },
  ];
  worksheet.getRow(1).height = 30;
  worksheet.getRow(2).height = 24;
  worksheet.mergeCells('A1:B2');
  worksheet.mergeCells('C1:L1');
  worksheet.mergeCells('C2:L2');

  const markCell = worksheet.getCell('A1');
  markCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_PRIMARY } };
  markCell.alignment = { horizontal: 'center', vertical: 'middle' };

  if (logo) {
    const imageId = workbook.addImage({ base64: logo.dataUrl, extension: 'png' });
    const size = containedSize(logo.aspectRatio, 76, 42);
    worksheet.addImage(imageId, {
      tl: { col: 0.2, row: 0.15 },
      ext: { width: size.width, height: size.height },
    });
  } else {
    markCell.value = organizationInitials(organizationName);
    markCell.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
  }

  const organizationCell = worksheet.getCell('C1');
  organizationCell.value = organizationName;
  organizationCell.font = { bold: true, size: 18, color: { argb: EXCEL_PRIMARY } };
  organizationCell.alignment = { vertical: 'bottom' };

  const titleCell = worksheet.getCell('C2');
  titleCell.value = `${organizationSubtitle} · ${REPORT_TITLE}`;
  titleCell.font = { bold: true, size: 11, color: { argb: EXCEL_MUTED } };
  titleCell.alignment = { vertical: 'top' };

  worksheet.getCell('A4').value = 'Schedule Date';
  worksheet.getCell('A4').font = { bold: true, color: { argb: EXCEL_MUTED } };
  worksheet.mergeCells('B4:C4');
  worksheet.getCell('B4').value = slotDate;
  worksheet.getCell('B4').font = { bold: true, color: { argb: EXCEL_PRIMARY } };
  worksheet.getCell('E4').value = 'Total Appointments';
  worksheet.getCell('E4').font = { bold: true, color: { argb: EXCEL_MUTED } };
  worksheet.getCell('F4').value = appointments.length;
  worksheet.getCell('F4').font = { bold: true, color: { argb: EXCEL_PRIMARY } };

  for (let column = 1; column <= headers.length; column += 1) {
    worksheet.getCell(5, column).border = {
      bottom: { style: 'thin', color: { argb: EXCEL_BORDER } },
    };
  }

  worksheet.addTable({
    name: 'AppointmentSchedule',
    ref: 'A7',
    headerRow: true,
    totalsRow: false,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: headers.map((header) => ({ name: header, filterButton: true })),
    rows: rows.map((row) => headers.map((header) => row[header])),
  });
  worksheet.getRow(7).height = 24;
  worksheet.headerFooter.oddFooter = `&L${excelFooterText(organizationName)}&C${REPORT_TITLE}&RPage &P of &N`;
  worksheet.headerFooter.evenFooter = worksheet.headerFooter.oddFooter;

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `appointments-${exportFileDate(slotDate)}.xlsx`
  );
}

export async function downloadAppointmentsPdf(
  appointments: Appointment[],
  slotDate: string,
  organizationName: string,
  organizationSubtitle: string,
  logoUrl: string | null
) {
  const [{ jsPDF }, { autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadReportLogo(logoUrl),
  ]);
  const document = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const rows = buildAppointmentExportRows(appointments);
  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();

  document.setProperties({
    title: REPORT_TITLE,
    subject: `${REPORT_TITLE} for ${slotDate}`,
    author: organizationName,
    creator: 'Medical EMR',
  });

  function drawHeader() {
    document.setFillColor(25, 62, 104);
    document.rect(0, 0, pageWidth, 66, 'F');

    document.setFillColor(255, 255, 255);
    document.roundedRect(24, 14, 38, 38, 5, 5, 'F');

    if (logo) {
      const size = containedSize(logo.aspectRatio, 32, 32);
      document.addImage(
        logo.dataUrl,
        'PNG',
        43 - size.width / 2,
        33 - size.height / 2,
        size.width,
        size.height
      );
    } else {
      document.setFont('helvetica', 'bold');
      document.setFontSize(11);
      document.setTextColor(25, 62, 104);
      document.text(organizationInitials(organizationName), 43, 37, { align: 'center' });
    }

    document.setTextColor(255, 255, 255);
    document.setFont('helvetica', 'bold');
    document.setFontSize(14);
    document.text(organizationName, 76, 29, { maxWidth: 390 });
    document.setFont('helvetica', 'normal');
    document.setFontSize(9);
    document.text(`${organizationSubtitle} · ${REPORT_TITLE}`, 76, 47);

    document.setFontSize(8);
    document.text(`Schedule Date  ${slotDate}`, pageWidth - 24, 28, { align: 'right' });
    document.text(`Total Appointments  ${appointments.length}`, pageWidth - 24, 45, {
      align: 'right',
    });
  }

  autoTable(document, {
    startY: 80,
    head: [[...headers]],
    body: rows.map((row) => headers.map((header) => row[header])),
    margin: { top: 80, right: 24, bottom: 38, left: 24 },
    styles: {
      fontSize: 6.5,
      cellPadding: 4,
      overflow: 'linebreak',
      textColor: [31, 41, 55],
      lineColor: [213, 222, 232],
      lineWidth: 0.3,
    },
    headStyles: { fillColor: [25, 62, 104], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [244, 247, 250] },
    willDrawPage: drawHeader,
  });

  const totalPages = document.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    document.setPage(page);
    document.setDrawColor(213, 222, 232);
    document.line(24, pageHeight - 27, pageWidth - 24, pageHeight - 27);
    document.setFont('helvetica', 'normal');
    document.setFontSize(7.5);
    document.setTextColor(82, 97, 112);
    document.text(`${organizationName} · ${organizationSubtitle}`, 24, pageHeight - 14);
    document.text(`Page ${page} of ${totalPages}`, pageWidth - 24, pageHeight - 14, {
      align: 'right',
    });
  }

  document.save(`appointments-${exportFileDate(slotDate)}.pdf`);
}
