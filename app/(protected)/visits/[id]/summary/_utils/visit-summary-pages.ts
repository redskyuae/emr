/**
 * Packs blocks of known height onto pages, in order. A block that does not fit in the space
 * left moves to the next page; a block taller than a whole page gets a page of its own.
 * Returns the block indexes on each page.
 */
export function paginate(
  blockHeights: number[],
  firstPageHeight: number,
  pageHeight: number
): number[][] {
  const pages: number[][] = [[]];
  let remaining = firstPageHeight;

  blockHeights.forEach((height, index) => {
    const current = pages[pages.length - 1];

    if (height > remaining && current.length > 0) {
      pages.push([index]);
      remaining = pageHeight - height;
      return;
    }

    current.push(index);
    remaining -= height;
  });

  return pages;
}
