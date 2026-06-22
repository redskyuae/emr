import { pluralize } from '@boringnode/pluralize';

export function formatCount(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : pluralize(singular)}`;
}
