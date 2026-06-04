import { and, eq, or } from 'drizzle-orm';

import { db } from '../index';
import { languageTable } from '../schema/language';

export const languageSeedData = [
  { name: 'English', code: 'ENG' },
  { name: 'Hindi', code: 'HIN' },
  { name: 'Tamil', code: 'TAM' },
  { name: 'Telugu', code: 'TEL' },
  { name: 'Kannada', code: 'KAN' },
  { name: 'Malayalam', code: 'MAL' },
  { name: 'Marathi', code: 'MAR' },
  { name: 'Bengali', code: 'BEN' },
  { name: 'Gujarati', code: 'GUJ' },
  { name: 'Punjabi', code: 'PUN' },
  { name: 'Arabic', code: 'ARA' },
  { name: 'Chinese', code: 'CHI' },
  { name: 'French', code: 'FRE' },
  { name: 'Spanish', code: 'SPA' },
  { name: 'Urdu', code: 'URD' },
] as const;

export async function seedLanguages() {
  for (const language of languageSeedData) {
    const [existingLanguage] = await db
      .select({ id: languageTable.id })
      .from(languageTable)
      .where(
        and(
          eq(languageTable.isDeleted, false),
          or(eq(languageTable.name, language.name), eq(languageTable.code, language.code))
        )
      )
      .limit(1);

    if (!existingLanguage) {
      await db.insert(languageTable).values(language);
    }
  }
}

if (process.argv[1]?.endsWith('language.ts')) {
  seedLanguages()
    .then(() => {
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
