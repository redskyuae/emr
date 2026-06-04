import { and, eq, or } from 'drizzle-orm';

import { db } from '../index';
import { countryTable } from '../schema/country';

export const countrySeedData = [
  { name: 'India', code: 'IN' },
  { name: 'United States', code: 'US' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Australia', code: 'AU' },
  { name: 'Canada', code: 'CA' },
  { name: 'United Arab Emirates', code: 'AE' },
  { name: 'Singapore', code: 'SG' },
  { name: 'China', code: 'CN' },
  { name: 'Germany', code: 'DE' },
  { name: 'France', code: 'FR' },
] as const;

export async function seedCountries() {
  for (const country of countrySeedData) {
    const [existingCountry] = await db
      .select({ id: countryTable.id })
      .from(countryTable)
      .where(
        and(
          eq(countryTable.isDeleted, false),
          or(eq(countryTable.name, country.name), eq(countryTable.code, country.code))
        )
      )
      .limit(1);

    if (!existingCountry) {
      await db.insert(countryTable).values(country);
    }
  }
}

if (process.argv[1]?.endsWith('country.ts')) {
  seedCountries()
    .then(() => {
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
