import { and, eq, sql } from 'drizzle-orm';

import { db } from '../app/db';
import { organization, user, member } from '../app/db/schema/auth';
import { doctor as doctorTable } from '../app/db/schema/doctor';
import { patient as patientTable } from '../app/db/schema/patient';
import { treatment as treatmentTable } from '../app/db/schema/treatment';
import { specialty as specialtyTable } from '../app/db/schema/specialty';

const TENANT_ID = 'N5eSMvVQtLopN4ooFYN3W9GagQ4XJx8S';

const [org] = await db
  .select({ id: organization.id, name: organization.name, slug: organization.slug })
  .from(organization)
  .where(eq(organization.id, TENANT_ID));

const members = await db
  .select({
    userId: member.userId,
    role: member.role,
    email: user.email,
    name: user.name,
  })
  .from(member)
  .innerJoin(user, eq(user.id, member.userId))
  .where(eq(member.organizationId, TENANT_ID));

const patients = await db
  .select({
    id: patientTable.id,
    mrn: patientTable.mrn,
    firstName: patientTable.firstName,
    lastName: patientTable.lastName,
    phone: patientTable.phone,
    registrationStatus: patientTable.registrationStatus,
    isActive: patientTable.isActive,
  })
  .from(patientTable)
  .where(and(eq(patientTable.tenantId, TENANT_ID), eq(patientTable.isDeleted, false)));

const doctors = await db
  .select({
    id: doctorTable.id,
    userId: doctorTable.userId,
    specialtyId: doctorTable.specialtyId,
    isActive: doctorTable.isActive,
    registrationNumber: doctorTable.registrationNumber,
  })
  .from(doctorTable)
  .where(and(eq(doctorTable.tenantId, TENANT_ID), eq(doctorTable.isDeleted, false)));

const specialties = await db
  .select({ id: specialtyTable.id, name: specialtyTable.name })
  .from(specialtyTable)
  .where(and(eq(specialtyTable.tenantId, TENANT_ID), eq(specialtyTable.isDeleted, false)))
  .limit(10);

const [{ treatments }] = await db
  .select({ treatments: sql<number>`count(*)::int` })
  .from(treatmentTable)
  .where(and(eq(treatmentTable.tenantId, TENANT_ID), eq(treatmentTable.isDeleted, false)));

console.log(JSON.stringify({ org, members, patients, doctors, specialties, treatments }, null, 2));
process.exit(0);
