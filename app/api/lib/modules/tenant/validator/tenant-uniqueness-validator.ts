import type { ValidationResult } from '@/app/api/lib/utils/types';
import { tenantRepository } from '../repository/tenant-repository';

type TenantUniquenessInput = {
  name?: string;
  slug?: string;
  excludeId?: string;
};

const CONFLICT_STATUS = 409;

export async function validateTenantUniqueness({
  name,
  slug,
  excludeId,
}: TenantUniquenessInput): Promise<ValidationResult<TenantUniquenessInput>> {
  const [existingName, existingSlug] = await Promise.all([
    name ? tenantRepository.findTenantByName(name, { excludeId }) : undefined,
    slug ? tenantRepository.findTenantBySlug(slug, { excludeId }) : undefined,
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push('A tenant with this name already exists.');
  }

  if (existingSlug) {
    errors.push('A tenant with this slug already exists.');
  }

  if (errors.length > 0) {
    return { success: false, errors, status: CONFLICT_STATUS };
  }

  return { success: true, data: { name, slug, excludeId } };
}

export function getTenantUniqueConstraintErrors(error: unknown) {
  let current: unknown = error;

  while (current && typeof current === 'object') {
    const err = current as Record<string, unknown>;
    const constraint = String(err.constraint ?? '');
    const message = String(err.message ?? '');

    if (constraint === 'organization_name_idx') {
      return ['A tenant with this name already exists.'];
    }

    if (constraint === 'organization_slug_uidx' || constraint === 'organization_slug_unique') {
      return ['A tenant with this slug already exists.'];
    }

    if (message.includes('Organization already exists')) {
      return ['A tenant with this slug already exists.'];
    }

    current = err.cause;
  }

  return [];
}
