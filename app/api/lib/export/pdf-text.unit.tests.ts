import { jsPDF } from 'jspdf';
import { beforeAll, describe, expect, it } from 'vitest';

import { registerPdfFonts } from './pdf-fonts';
import { hasArabic, pdfText, scriptRuns, textWidth, wrapText } from './pdf-text';

let document: jsPDF;

beforeAll(async () => {
  document = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  await registerPdfFonts(document);
  document.setFontSize(10);
});

describe('PDF text', () => {
  it('should keep Latin, Arabic and the punctuation the fonts can draw', () => {
    expect(pdfText('Café — “ok”… فاطمة')).toBe('Café — “ok”… فاطمة');
  });

  it('should swap arrows and odd spaces, and drop invisible marks', () => {
    expect(pdfText('Open → Closed now‏')).toBe('Open -> Closed now');
  });

  it('should show "?" for a script neither font has', () => {
    expect(pdfText('राम Kumar')).toBe('??? Kumar');
  });

  it('should treat empty values as empty text', () => {
    expect(pdfText(null)).toBe('');
    expect(pdfText(undefined)).toBe('');
    expect(pdfText(42)).toBe('42');
  });

  it('should tell whether text has Arabic', () => {
    expect(hasArabic('MRN-000007 فاطمة')).toBe(true);
    expect(hasArabic('Dr. Sara Ali')).toBe(false);
  });

  it('should keep an Arabic phrase together and give surrounding spaces to the Latin text', () => {
    expect(scriptRuns('MRN-7 فاطمة علي Khan')).toEqual([
      { text: 'MRN-7 ', arabic: false },
      { text: 'فاطمة علي', arabic: true },
      { text: ' Khan', arabic: false },
    ]);
    expect(scriptRuns('شارع 5 دبي')).toEqual([{ text: 'شارع 5 دبي', arabic: true }]);
    expect(scriptRuns('Visit 12')).toEqual([{ text: 'Visit 12', arabic: false }]);
  });

  it('should measure Arabic with the Arabic font', () => {
    expect(textWidth(document, 'فاطمة', 'normal')).toBeGreaterThan(10);
    expect(textWidth(document, 'Khan فاطمة', 'normal')).toBeGreaterThan(
      textWidth(document, 'Khan', 'normal')
    );
  });

  it('should wrap mixed text to the width and keep its own line breaks', () => {
    const lines = wrapText(document, 'MRN-000007\nفاطمة الزهراء علي Khan Rahman', 90, 'normal');

    expect(lines[0]).toBe('MRN-000007');
    expect(lines.length).toBeGreaterThan(2);
    for (const line of lines) expect(textWidth(document, line, 'normal')).toBeLessThanOrEqual(90);
  });

  it('should break a word wider than the line', () => {
    const lines = wrapText(document, 'x'.repeat(80), 50, 'normal');

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join('')).toBe('x'.repeat(80));
  });
});
