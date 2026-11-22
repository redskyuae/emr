// The fonts every exported PDF report embeds: Noto Sans for Latin, Greek and
// Cyrillic text, and Noto Sans Arabic for Arabic script, so Patient and staff
// names print as written. jsPDF embeds only the glyphs a report uses, so a
// report stays small. The files live in `./fonts` (SIL Open Font License) and
// are read once per server process.

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { jsPDF } from 'jspdf';

export const PDF_FONT = 'NotoSans';
export const PDF_ARABIC_FONT = 'NotoSansArabic';

export type PdfFontStyle = 'normal' | 'bold';

const FONT_FILES: { file: string; family: string; style: PdfFontStyle }[] = [
  { file: 'NotoSans-Regular.ttf', family: PDF_FONT, style: 'normal' },
  { file: 'NotoSans-Bold.ttf', family: PDF_FONT, style: 'bold' },
  { file: 'NotoSansArabic-Regular.ttf', family: PDF_ARABIC_FONT, style: 'normal' },
  { file: 'NotoSansArabic-Bold.ttf', family: PDF_ARABIC_FONT, style: 'bold' },
];

// `next.config.ts` adds this folder to the export routes' server bundle.
const FONT_DIRECTORY = path.join(process.cwd(), 'app', 'api', 'lib', 'export', 'fonts');

let fontData: Promise<string[]> | undefined;

function loadFontData() {
  fontData ??= Promise.all(
    FONT_FILES.map(async ({ file }) =>
      (await readFile(path.join(FONT_DIRECTORY, file))).toString('base64')
    )
  ).catch((error: unknown) => {
    // Let the next export try again rather than caching the failure.
    fontData = undefined;
    throw error;
  });

  return fontData;
}

/** Adds the report fonts to a document and makes Noto Sans its current font. */
export async function registerPdfFonts(document: jsPDF) {
  const data = await loadFontData();

  FONT_FILES.forEach(({ file, family, style }, index) => {
    document.addFileToVFS(file, data[index]);
    document.addFont(file, family, style);
  });

  document.setFont(PDF_FONT, 'normal');
}
