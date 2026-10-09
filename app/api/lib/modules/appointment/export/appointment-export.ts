import { Buffer } from 'node:buffer';

import type { Appointment } from '../schemas/appointment-schema';

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

export type AppointmentExportFormat = 'excel' | 'pdf';

export type AppointmentExportBrand = {
  organizationName: string;
  organizationSubtitle: string;
  logo?: Uint8Array;
};

export type AppointmentExportFile = {
  body: Uint8Array;
  contentType: string;
  filename: string;
};

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
  if (/^\d{4}-\d{2}-\d{2}$/.test(slotDate)) {
    return slotDate;
  }

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

function excelFooterText(value: string) {
  return value.replaceAll('&', '&&');
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

export function appointmentExportFilename(format: AppointmentExportFormat, slotDate: string) {
  const extension = format === 'excel' ? 'xlsx' : 'pdf';
  return `appointments-${exportFileDate(slotDate)}.${extension}`;
}

async function createAppointmentsExcel(
  appointments: Appointment[],
  slotDate: string,
  brand: AppointmentExportBrand
) {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  workbook.company = brand.organizationName;
  workbook.creator = brand.organizationName;
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

  if (brand.logo) {
    const imageId = workbook.addImage({
      base64: `data:image/png;base64,${Buffer.from(brand.logo).toString('base64')}`,
      extension: 'png',
    });
    worksheet.addImage(imageId, {
      tl: { col: 0.4, row: 0.15 },
      ext: { width: 42, height: 42 },
    });
  } else {
    markCell.value = organizationInitials(brand.organizationName);
    markCell.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
  }

  const organizationCell = worksheet.getCell('C1');
  organizationCell.value = brand.organizationName;
  organizationCell.font = { bold: true, size: 18, color: { argb: EXCEL_PRIMARY } };
  organizationCell.alignment = { vertical: 'bottom' };

  const titleCell = worksheet.getCell('C2');
  titleCell.value = `${brand.organizationSubtitle} · ${REPORT_TITLE}`;
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
  worksheet.headerFooter.oddFooter = `&L${excelFooterText(brand.organizationName)}&C${REPORT_TITLE}&RPage &P of &N`;
  worksheet.headerFooter.evenFooter = worksheet.headerFooter.oddFooter;

  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

async function createAppointmentsPdf(
  appointments: Appointment[],
  slotDate: string,
  brand: AppointmentExportBrand
) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const document = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const rows = buildAppointmentExportRows(appointments);
  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();

  document.setProperties({
    title: REPORT_TITLE,
    subject: `${REPORT_TITLE} for ${slotDate}`,
    author: brand.organizationName,
    creator: 'Medical EMR',
  });

  function drawHeader() {
    document.setFillColor(25, 62, 104);
    document.rect(0, 0, pageWidth, 66, 'F');

    document.setFillColor(255, 255, 255);
    document.roundedRect(24, 14, 38, 38, 5, 5, 'F');

    if (brand.logo) {
      document.addImage(brand.logo, 'PNG', 27, 17, 32, 32);
    } else {
      document.setFont('helvetica', 'bold');
      document.setFontSize(11);
      document.setTextColor(25, 62, 104);
      document.text(organizationInitials(brand.organizationName), 43, 37, { align: 'center' });
    }

    document.setTextColor(255, 255, 255);
    document.setFont('helvetica', 'bold');
    document.setFontSize(14);
    document.text(brand.organizationName, 76, 29, { maxWidth: 390 });
    document.setFont('helvetica', 'normal');
    document.setFontSize(9);
    document.text(`${brand.organizationSubtitle} · ${REPORT_TITLE}`, 76, 47);

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
    document.text(`${brand.organizationName} · ${brand.organizationSubtitle}`, 24, pageHeight - 14);
    document.text(`Page ${page} of ${totalPages}`, pageWidth - 24, pageHeight - 14, {
      align: 'right',
    });
  }

  return new Uint8Array(document.output('arraybuffer'));
}

export async function createAppointmentExport(
  format: AppointmentExportFormat,
  appointments: Appointment[],
  slotDate: string,
  brand: AppointmentExportBrand
): Promise<AppointmentExportFile> {
  if (format === 'excel') {
    return {
      body: await createAppointmentsExcel(appointments, slotDate, brand),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: appointmentExportFilename(format, slotDate),
    };
  }

  return {
    body: await createAppointmentsPdf(appointments, slotDate, brand),
    contentType: 'application/pdf',
    filename: appointmentExportFilename(format, slotDate),
  };
}
