import { and, eq, or } from 'drizzle-orm';

import { db } from '../index';
import { nationality as nationalityTable } from '../schema/nationality';

export const nationalitySeedData = [
  { name: 'Indian', code: 'IND' },
  { name: 'American', code: 'USA' },
  { name: 'British', code: 'GBR' },
  { name: 'Australian', code: 'AUS' },
  { name: 'Canadian', code: 'CAN' },
  { name: 'Chinese', code: 'CHN' },
  { name: 'French', code: 'FRA' },
  { name: 'German', code: 'DEU' },
  { name: 'Emirati', code: 'ARE' },
  { name: 'Singaporean', code: 'SGP' },
] as const;

export async function seedNationalities() {
  for (const nationality of nationalitySeedData) {
    const [existingNationality] = await db
      .select({ id: nationalityTable.id })
      .from(nationalityTable)
      .where(
        and(
          eq(nationalityTable.isDeleted, false),
          or(
            eq(nationalityTable.name, nationality.name),
            eq(nationalityTable.code, nationality.code)
          )
        )
      )
      .limit(1);

    if (!existingNationality) {
      await db.insert(nationalityTable).values(nationality);
    }
  }
}

if (process.argv[1]?.endsWith('nationality.ts')) {
  seedNationalities()
    .then(() => {
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
