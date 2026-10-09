import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import {
  createAppointmentExport,
  type AppointmentExportBrand,
  type AppointmentExportFormat,
} from '@/app/api/lib/modules/appointment/export/appointment-export';
import { getAppointmentsQuery } from '@/app/api/lib/modules/appointment/queries/get-appointments-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { brandLogos, getConfiguredBrandLogoVariant } from '@/components/brand/brand-config';

export const runtime = 'nodejs';

const EXPORT_LIMIT = 999;

function parseExportFormat(value: string | null): AppointmentExportFormat | null {
  return value === 'excel' || value === 'pdf' ? value : null;
}

function responseBody(bytes: Uint8Array) {
  const body = new Uint8Array(bytes.byteLength);
  body.set(bytes);
  return body.buffer;
}

async function getExportBrand(): Promise<AppointmentExportBrand> {
  const variant = getConfiguredBrandLogoVariant();

  if (variant === 'none') {
    return {
      organizationName: 'Medical EMR',
      organizationSubtitle: 'Redsky Consultancy',
    };
  }

  const configuredBrand = brandLogos[variant];
  let logo: Uint8Array | undefined;

  try {
    const logoPath = path.join(
      process.cwd(),
      'public',
      configuredBrand.markSrc.replace(/^\/+/, '')
    );
    logo = await readFile(logoPath);
  } catch {
    // The report generator falls back to organization initials if the asset is unavailable.
  }

  return {
    organizationName: configuredBrand.name,
    organizationSubtitle: configuredBrand.subtitle,
    logo,
  };
}

export async function GET(request: NextRequest) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const searchParams = request.nextUrl.searchParams;
    const format = parseExportFormat(searchParams.get('format'));

    if (!format) {
      return NextResponse.json(
        {
          message: 'Validation failed',
          errors: ['Export format must be excel or pdf'],
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const slotDate = searchParams.get('slotDate')?.trim() || undefined;
    const queryResult = await getAppointmentsQuery({
      tenantId: tenantSession.tenantId,
      filters: {
        slotDate,
        doctorId: searchParams.get('doctorId')?.trim() || undefined,
        therapistId: searchParams.get('therapistId')?.trim() || undefined,
        patientId: searchParams.get('patientId')?.trim() || undefined,
        appointmentStatusId: searchParams.get('appointmentStatusId')?.trim() || undefined,
        query: searchParams.get('query')?.trim() || undefined,
        page: 1,
        limit: EXPORT_LIMIT,
      },
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: queryResult.errors },
        { status: queryResult.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    if (!('total' in queryResult)) {
      return NextResponse.json(
        { message: 'Internal Server Error' },
        { status: StatusCodes.INTERNAL_SERVER_ERROR }
      );
    }

    const reportDate = slotDate ?? queryResult.data[0]?.slotDate ?? 'schedule';
    const file = await createAppointmentExport(
      format,
      queryResult.data,
      reportDate,
      await getExportBrand()
    );

    return new Response(responseBody(file.body), {
      status: StatusCodes.OK,
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Type': file.contentType,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
