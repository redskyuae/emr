import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

type JournalEntry = {
  when: number;
  tag: string;
};

type Journal = {
  entries: JournalEntry[];
};

const deployedTherapistSchemaWatermark = 1790063329163;

async function readJournal(): Promise<Journal> {
  return JSON.parse(
    await readFile(new URL('./meta/_journal.json', import.meta.url), 'utf8')
  ) as Journal;
}

describe('Therapist migration history', () => {
  it('should preserve the deployed therapist schema watermark after the migration merge', async () => {
    const journal = await readJournal();
    const therapistMigration = journal.entries.find(
      ({ tag }) => tag === '0062_therapist_management'
    );

    expect(therapistMigration?.when).toBe(deployedTherapistSchemaWatermark);
  });

  it('should only run the permission seed after the deployed therapist schema watermark', async () => {
    const journal = await readJournal();
    const pendingTags = journal.entries
      .filter(({ when }) => when > deployedTherapistSchemaWatermark)
      .map(({ tag }) => tag);

    expect(pendingTags).toEqual(['0063_seed_therapist_permissions']);
  });
});
