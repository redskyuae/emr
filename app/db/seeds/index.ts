import { seedCountries } from './country';
import { seedLanguages } from './language';
import { seedNationalities } from './nationality';
import { seedPermissions } from './permission';
import { seedReligions } from './religion';
import { seedStates } from './state';

// Global Reference data the app's dropdowns read (Nationality, Language,
// Religion, Country/State), plus the Permission Catalogue. Every seed is
// idempotent — it checks for an existing row before inserting — so this is
// safe to re-run. Countries are seeded before States, which resolve their
// Country by code.
async function seed() {
  await seedCountries();
  await seedStates();
  await seedNationalities();
  await seedLanguages();
  await seedReligions();
  await seedPermissions();
}

seed()
  .then(() => {
    console.log('Seed complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
