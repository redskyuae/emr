'use client';

import type { ConsolidatedPatientReport } from '@/app/api/lib/modules/consolidated-patient-report/schemas/consolidated-patient-report-schema';
import { brandLogos } from '@/components/brand/brand-config';
import { useBrandLogoVariant } from '@/components/brand/brand-provider';
import { LogoMark } from '@/components/brand/logo';

import { displayDate, displayDateIn } from '../../_utils/consolidated-report-format';

/** Brand mark when a brand is configured; otherwise the Tenant's logo or initial. */
function TenantMark({ tenant }: { tenant: ConsolidatedPatientReport['tenant'] }) {
  const variant = useBrandLogoVariant();

  if (variant !== 'none') {
    return <LogoMark className="size-12 rounded-xl" />;
  }

  if (tenant.logo) {
    // eslint-disable-next-line @next/next/no-img-element -- Tenant logos are arbitrary uploaded URLs.
    return <img src={tenant.logo} alt="" className="size-12 flex-none rounded-xl object-contain" />;
  }

  return (
    <span
      aria-hidden="true"
      className="bg-primary text-primary-foreground grid size-12 flex-none place-items-center rounded-xl text-2xl font-bold"
    >
      {tenant.name.charAt(0).toUpperCase()}
    </span>
  );
}

/** The brand (`LOGIN_LOGO_VARIANT`) and Tenant, with the report's period and generation date. */
export function ReportLetterhead({ report }: { report: ConsolidatedPatientReport }) {
  const variant = useBrandLogoVariant();
  const brand = variant === 'none' ? null : brandLogos[variant];
  const { tenant, period } = report;

  return (
    <header className="border-primary flex flex-wrap items-start justify-between gap-6 border-b-2 pb-5">
      <div className="flex min-w-0 items-center gap-3.5">
        <TenantMark tenant={tenant} />
        <div className="min-w-0">
          <p className="font-heading text-[19px] leading-tight font-bold">
            {brand?.name ?? tenant.name}
          </p>
          {brand ? (
            // The Tenant is the clinic that gave the care, so it stays under the brand.
            <p className="text-muted-foreground mt-0.5 text-[12px] leading-snug">
              {tenant.name === brand.name ? brand.subtitle : tenant.name}
            </p>
          ) : null}
        </div>
      </div>
      <div className="ml-auto text-right text-[12px] leading-relaxed">
        <p className="text-primary text-[11px] font-bold tracking-[0.14em] uppercase">
          Consolidated treatment report
        </p>
        <p className="text-muted-foreground">
          Period: {displayDate(period.fromDate)} to {displayDate(period.toDate)}
        </p>
        <p className="text-muted-foreground">
          Generated: {displayDateIn(report.generatedAt, report.timeZone)}
          {report.generatedBy ? ` by ${report.generatedBy}` : ''}
        </p>
      </div>
    </header>
  );
}
