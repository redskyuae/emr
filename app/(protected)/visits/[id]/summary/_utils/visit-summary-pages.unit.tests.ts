import { describe, expect, it } from 'vitest';

import { paginate } from './visit-summary-pages';

describe('paginate', () => {
  it('should keep blocks on the first page while they fit', () => {
    expect(paginate([100, 200, 300], 600, 900)).toEqual([[0, 1, 2]]);
  });

  it('should move a block that does not fit to the next page', () => {
    expect(paginate([300, 200, 250, 400], 600, 700)).toEqual([
      [0, 1],
      [2, 3],
    ]);
  });

  it('should use the later page height after the first page', () => {
    expect(paginate([500, 500, 500], 500, 1000)).toEqual([[0], [1, 2]]);
  });

  it('should give a block taller than a page a page of its own', () => {
    expect(paginate([100, 2000, 100], 600, 900)).toEqual([[0], [1], [2]]);
  });

  it('should keep a single oversized first block on the first page', () => {
    expect(paginate([2000], 600, 900)).toEqual([[0]]);
  });

  it('should count the continued heading of a block that opens a later page', () => {
    // Block 1 opens page 2 with a 100px heading, so block 2 no longer fits beside it.
    expect(paginate([500, 400, 450], 500, 900, [0, 100, 0])).toEqual([[0], [1], [2]]);
    expect(paginate([500, 400, 450], 500, 900)).toEqual([[0], [1, 2]]);
  });

  it('should not count a continued heading for a block that stays on the current page', () => {
    expect(paginate([200, 200], 500, 900, [0, 300])).toEqual([[0, 1]]);
  });

  it('should return one empty page when there are no blocks', () => {
    expect(paginate([], 600, 900)).toEqual([[]]);
  });
});
