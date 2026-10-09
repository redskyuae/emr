import { Buffer } from 'node:buffer';

import { Workbook } from 'exceljs';
import { describe, expect, it } from 'vitest';

import type { Appointment } from '../schemas/appointment-schema';
import {
  appointmentExportFilename,
  buildAppointmentExportRows,
  createAppointmentExport,
} from './appointment-export';

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 10,
    cancelledAt: null,
    remarks: null,
    rescheduleReason: null,
    rotaName: 'Morning',
    doctorRotaId: 6,
    roomId: null,
    tenantId: 'tenant-1',
    slotDate: '08-10-2026',
    startTime: null,
    endTime: null,
    bookingPath: 'CONSULTATION',
    bookingNumber: 'APT-1001',
    createdOn: new Date('2026-10-08T03:30:00.000Z'),
    doctor: { id: 1, name: 'Dr. Meera' },
    therapist: null,
    patient: {
      id: 5,
      mrn: 'MRN-1001',
      phone: '9876543210',
      lastName: 'Rao',
      firstName: 'Asha',
      registrationStatus: 'registered',
    },
    appointmentMode: { id: 2, name: 'In-person', code: 'INP' },
    appointmentType: { id: 3, name: 'Consultation', code: 'CONS' },
    appointmentReason: { id: 4, name: 'Follow-up', code: 'FUP' },
    appointmentCancelledReason: null,
    appointmentStatus: { id: 7, name: 'Scheduled', code: 'SCH', category: 'scheduled' },
    treatment: null,
    treatmentSession: null,
    slots: [
      { slotTime: '09:00', status: 'Booked' },
      { slotTime: '09:15', status: 'Booked' },
    ],
    ...overrides,
  };
}

const brand = {
  organizationName: 'Dhathri Gram',
  organizationSubtitle: 'Ayurveda Medical Centre',
  logo: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
  ),
};
const filterSummary = 'Therapist Leela Krishnan · Status Scheduled · Search "rao"';

describe('Appointment export', () => {
  it('should map Consultation details into report columns', () => {
    expect(buildAppointmentExportRows([appointment()])).toEqual([
      {
        Booking: 'APT-1001',
        Date: '08-10-2026',
        Time: '09:00-09:15',
        Patient: 'Asha Rao',
        MRN: 'MRN-1001',
        Phone: '9876543210',
        Doctor: 'Dr. Meera',
        Therapist: 'N/A',
        Type: 'Consultation',
        Mode: 'In-person',
        Treatment: 'N/A',
        Status: 'Scheduled',
      },
    ]);
  });

  it('should map Procedure timing, Therapist, and Treatment details', () => {
    const procedure = appointment({
      bookingPath: 'PROCEDURE',
      startTime: '10:00',
      endTime: '11:15',
      doctor: null,
      therapist: { id: 8, name: 'Leela Krishnan' },
      appointmentMode: null,
      appointmentType: null,
      treatment: { id: 21, name: 'Abhyanga', code: 'ABH' },
      slots: [],
    });

    expect(buildAppointmentExportRows([procedure])[0]).toMatchObject({
      Time: '10:00-11:15',
      Doctor: 'N/A',
      Therapist: 'Leela Krishnan',
      Type: 'PROCEDURE',
      Mode: 'N/A',
      Treatment: 'Abhyanga',
    });
  });

  it('should create a branded Excel workbook on the server', async () => {
    const file = await createAppointmentExport(
      'excel',
      [appointment()],
      '08-10-2026',
      filterSummary,
      brand
    );
    const workbook = new Workbook();
    await workbook.xlsx.load(file.body as never);
    const worksheet = workbook.getWorksheet('Appointments');

    expect(file).toMatchObject({
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: 'appointments-2026-10-08.xlsx',
    });
    expect(worksheet?.getCell('C1').value).toBe('Dhathri Gram');
    expect(worksheet?.getCell('C2').value).toBe('Ayurveda Medical Centre · Appointment Schedule');
    expect(worksheet?.getCell('G4').value).toBe(1);
    expect(worksheet?.getCell('A5').value).toBe('Filters');
    expect(worksheet?.getCell('B5').value).toBe(filterSummary);
    expect(worksheet?.getCell('H8').value).toBe('Therapist');
    expect(worksheet?.getCell('A9').value).toBe('APT-1001');
  });

  it('should create a PDF document on the server', async () => {
    const file = await createAppointmentExport(
      'pdf',
      [appointment()],
      '08-10-2026',
      filterSummary,
      brand
    );
    const signature = Buffer.from(file.body).subarray(0, 5).toString('ascii');
    const content = Buffer.from(file.body).toString('latin1');

    expect(file.contentType).toBe('application/pdf');
    expect(file.filename).toBe('appointments-2026-10-08.pdf');
    expect(signature).toBe('%PDF-');
    expect(file.body.byteLength).toBeGreaterThan(1_000);
    expect(content).toContain('Filters:');
    expect(content).toContain('Therapist Leela Krishnan');
  });

  it('should keep ISO dates stable in filenames', () => {
    expect(appointmentExportFilename('pdf', '2026-10-08')).toBe('appointments-2026-10-08.pdf');
  });
});
