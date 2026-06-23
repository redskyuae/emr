import assert from 'node:assert/strict';

import { createAssetConditionSchema } from './asset-condition-schema';
import { getAssetConditionUniqueConstraintErrors } from '../validator/asset-condition-uniqueness-validator';
import { validateGetAssetConditionById } from '../validator/get-asset-condition-by-id-validator';

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;

describe('Asset Condition schema', () => {
  test('normalizes create input for persistence', () => {
    const result = createAssetConditionSchema.safeParse({
      name: ' Excellent ',
      code: ' exc ',
      color: '#16A34A',
      description: ' ',
    });

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.deepEqual(result.data, {
      name: 'Excellent',
      code: 'EXC',
      color: '#16A34A',
      description: undefined,
    });
  });

  test('rejects non-hex display colors with the domain message', () => {
    const result = createAssetConditionSchema.safeParse({
      name: 'Excellent',
      code: 'EXC',
      color: 'blue',
    });

    assert.equal(result.success, false);

    if (result.success) {
      return;
    }

    assert(
      result.error.issues
        .map((issue) => issue.message)
        .includes('Asset condition color must be a hex value like #16A34A.')
    );
  });

  test('maps unique constraint violations to exact conflict messages', () => {
    assert.deepEqual(
      getAssetConditionUniqueConstraintErrors(
        { code: '23505', constraint: 'asset_condition_tenant_name_idx' },
        { name: 'Excellent', code: 'EXC' }
      ),
      ["Asset condition name 'Excellent' already exists."]
    );

    assert.deepEqual(
      getAssetConditionUniqueConstraintErrors(
        { code: '23505', constraint: 'asset_condition_tenant_code_idx' },
        { name: 'Excellent', code: 'EXC' }
      ),
      ["Asset condition code 'EXC' already exists."]
    );
  });

  test('uses the exact invalid id wording', () => {
    const result = validateGetAssetConditionById('abc', 'tenant_1');

    assert.equal(result.success, false);

    if (result.success) {
      return;
    }

    assert.deepEqual(result.errors, ['Asset condition abc is Invalid.']);
  });
});
