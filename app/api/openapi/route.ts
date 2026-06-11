import { NextResponse } from 'next/server';

import { openApiDocument } from '@/app/api/lib/openapi/document';

export async function GET() {
  return NextResponse.json(openApiDocument);
}
