import { and, eq } from 'drizzle-orm';

import { db } from '../app/db';
import { country as countryTable } from '../app/db/schema/country';
import { doctor as doctorTable } from '../app/db/schema/doctor';
import { language as languageTable } from '../app/db/schema/language';
import { nationality as nationalityTable } from '../app/db/schema/nationality';
import { patientMrnCounter as patientMrnCounterTable } from '../app/db/schema/patient';
import { religion as religionTable } from '../app/db/schema/religion';
import { specialty as specialtyTable } from '../app/db/schema/specialty';
import { state as stateTable } from '../app/db/schema/state';
import { visitNumberCounter as visitNumberCounterTable } from '../app/db/schema/visit';
import { visitType as visitTypeTable } from '../app/db/schema/visit-type';

const TENANT_ID = 'N5eSMvVQtLopN4ooFYN3W9GagQ4XJx8S';
const notDeleted = (table: { tenantId: unknown; isDeleted: unknown }) =>
  and(eq(table.tenantId as never, TENANT_ID), eq(table.isDeleted as never, false));

const [nationalities, religions, languages, states, countries, visitTypes, specialties, doctors] =
  await Promise.all([
    db
      .select({ id: nationalityTable.id, name: nationalityTable.name })
      .from(nationalityTable)
      .where(notDeleted(nationalityTable)),
    db
      .select({ id: religionTable.id, name: religionTable.name })
      .from(religionTable)
      .where(notDeleted(religionTable)),
    db
      .select({ id: languageTable.id, name: languageTable.name })
      .from(languageTable)
      .where(notDeleted(languageTable)),
    db
      .select({
        id: stateTable.id,
        name: stateTable.name,
        countryId: stateTable.countryId,
      })
      .from(stateTable)
      .where(notDeleted(stateTable)),
    db
      .select({ id: countryTable.id, name: countryTable.name, code: countryTable.code })
      .from(countryTable)
      .where(notDeleted(countryTable)),
    db
      .select({ id: visitTypeTable.id, name: visitTypeTable.name, code: visitTypeTable.code })
      .from(visitTypeTable)
      .where(notDeleted(visitTypeTable)),
    db
      .select({ id: specialtyTable.id, name: specialtyTable.name })
      .from(specialtyTable)
      .where(notDeleted(specialtyTable)),
    db
      .select({
        id: doctorTable.id,
        userId: doctorTable.userId,
        registrationNumber: doctorTable.registrationNumber,
      })
      .from(doctorTable)
      .where(notDeleted(doctorTable)),
  ]);

const counters = {
  mrn: await db
    .select()
    .from(patientMrnCounterTable)
    .where(eq(patientMrnCounterTable.tenantId, TENANT_ID)),
  visit: await db
    .select()
    .from(visitNumberCounterTable)
    .where(eq(visitNumberCounterTable.tenantId, TENANT_ID)),
};

console.log(
  JSON.stringify(
    {
      nationalities,
      religions,
      languages,
      states,
      countries,
      visitTypes,
      specialties,
      doctors,
      counters,
    },
    null,
    2
  )
);
process.exit(0);
