import { and, eq } from 'drizzle-orm';

import { db } from '../index';
import { country as countryTable } from '../schema/country';
import { state as stateTable } from '../schema/state';

const stateSeedData = [
  {
    countryCode: 'IN',
    countryName: 'India',
    states: [
      'Andhra Pradesh',
      'Arunachal Pradesh',
      'Assam',
      'Bihar',
      'Chhattisgarh',
      'Goa',
      'Gujarat',
      'Haryana',
      'Himachal Pradesh',
      'Jharkhand',
      'Karnataka',
      'Kerala',
      'Madhya Pradesh',
      'Maharashtra',
      'Manipur',
      'Meghalaya',
      'Mizoram',
      'Nagaland',
      'Odisha',
      'Punjab',
      'Rajasthan',
      'Sikkim',
      'Tamil Nadu',
      'Telangana',
      'Tripura',
      'Uttar Pradesh',
      'Uttarakhand',
      'West Bengal',
      'Delhi (UT)',
      'Jammu & Kashmir (UT)',
      'Ladakh (UT)',
      'Chandigarh (UT)',
      'Puducherry (UT)',
      'Andaman & Nicobar Islands (UT)',
      'Dadra & Nagar Haveli and Daman & Diu (UT)',
      'Lakshadweep (UT)',
    ],
  },
  {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    states: [
      'Abu Dhabi',
      'Dubai',
      'Sharjah',
      'Ajman',
      'Umm Al Quwain',
      'Ras Al Khaimah',
      'Fujairah',
    ],
  },
] as const;

export async function seedStates() {
  for (const countryStateSeed of stateSeedData) {
    const [country] = await db
      .select({ id: countryTable.id })
      .from(countryTable)
      .where(
        and(eq(countryTable.isDeleted, false), eq(countryTable.code, countryStateSeed.countryCode))
      )
      .limit(1);

    if (!country) {
      throw new Error(
        `Cannot seed states because active Country ${countryStateSeed.countryName} (${countryStateSeed.countryCode}) was not found.`
      );
    }

    for (const name of countryStateSeed.states) {
      const [existingState] = await db
        .select({ id: stateTable.id })
        .from(stateTable)
        .where(
          and(
            eq(stateTable.isDeleted, false),
            eq(stateTable.countryId, country.id),
            eq(stateTable.name, name)
          )
        )
        .limit(1);

      if (!existingState) {
        await db.insert(stateTable).values({ name, countryId: country.id });
      }
    }
  }
}

if (process.argv[1]?.endsWith('state.ts')) {
  seedStates()
    .then(() => {
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
