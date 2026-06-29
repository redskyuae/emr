import { and, eq, or } from 'drizzle-orm';

import { db } from '../index';
import { religion as religionTable } from '../schema/religion';

export const religionSeedData = [
  { name: 'Hinduism', code: 'HIN' },
  { name: 'Islam', code: 'ISL' },
  { name: 'Christianity', code: 'CHR' },
  { name: 'Sikhism', code: 'SIK' },
  { name: 'Buddhism', code: 'BUD' },
  { name: 'Jainism', code: 'JAI' },
  { name: 'Judaism', code: 'JUD' },
  { name: 'Zoroastrianism', code: 'ZOR' },
  { name: 'Other', code: 'OTH' },
] as const;

export async function seedReligions() {
  for (const religion of religionSeedData) {
    const [existingReligion] = await db
      .select({ id: religionTable.id })
      .from(religionTable)
      .where(
        and(
          eq(religionTable.isDeleted, false),
          or(eq(religionTable.name, religion.name), eq(religionTable.code, religion.code))
        )
      )
      .limit(1);

    if (!existingReligion) {
      await db.insert(religionTable).values(religion);
    }
  }
}

if (process.argv[1]?.endsWith('religion.ts')) {
  seedReligions()
    .then(() => {
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
