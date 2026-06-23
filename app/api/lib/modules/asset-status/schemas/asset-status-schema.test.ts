import assert from 'node:assert/strict';

import { createAssetStatusSchema } from './asset-status-schema';

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;

describe('Asset Status schema', () => {
  test('normalizes create input for persistence', () => {
    const result = createAssetStatusSchema.safeParse({
      name: ' Diagnostic Imaging ',
      code: ' img ',
      color: '#2563eb',
      description: ' ',
    });

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.deepEqual(result.data, {
      name: 'Diagnostic Imaging',
      code: 'IMG',
      color: '#2563eb',
      description: undefined,
    });
  });

  test('rejects non-hex display colors with the domain message', () => {
    const result = createAssetStatusSchema.safeParse({
      name: 'Diagnostic Imaging',
      code: 'IMG',
      color: 'blue',
    });

    assert.equal(result.success, false);

    if (result.success) {
      return;
    }

    assert(
      result.error.issues
        .map((issue) => issue.message)
        .includes('Asset status color must be a hex value like #16A34A.')
    );
  });
});
