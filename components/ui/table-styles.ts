/**
 * Class strings for a hand-rolled `<table>` (and its loader skeleton) that cannot use the `Table`
 * components, so it still gets the same header band and cell rhythm. This is a plain module, not
 * a client one, so server components such as `loader.tsx` can import it.
 *
 * `tableHeadRowClass` goes on the `<tr>` inside `<thead>`, `tableHeadCellClass` on each `<th>`,
 * and `tableCellClass` on each `<td>`. Deliberately dense tables keep their own smaller padding.
 */
export const tableHeadRowClass =
  'bg-muted/60 text-muted-foreground border-b text-left text-xs font-semibold tracking-wider uppercase';

export const tableHeadCellClass = 'px-3 py-3 first:pl-5 last:pr-5';

export const tableCellClass = 'px-3 py-3.5 first:pl-5 last:pr-5';
