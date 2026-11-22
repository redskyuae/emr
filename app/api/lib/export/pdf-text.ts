// Text layout for exported PDF reports. A PDF font draws one script, and a cell
// can hold two, as in "MRN-001042 فاطمة Khan", so each line is cut into runs:
// Arabic runs are drawn in Noto Sans Arabic, where jsPDF joins the letters and
// lays them out right to left, and everything else in Noto Sans. Lines read
// left to right, the way the same text reads on the Audit Log pages.

import type { jsPDF } from 'jspdf';

import { PDF_ARABIC_FONT, PDF_FONT, type PdfFontStyle } from './pdf-fonts';

type Range = [number, number];

// The characters Noto Sans and Noto Sans Arabic draw.
const LATIN_RANGES: Range[] = [
  [0x20, 0x7e],
  [0xa0, 0x24f],
  [0x370, 0x4ff],
  [0x1e00, 0x1eff],
  [0x2010, 0x205e],
  [0x20a0, 0x20c0],
];

const ARABIC_RANGES: Range[] = [
  [0x600, 0x6ff],
  [0x750, 0x77f],
  [0x8a0, 0x8ff],
  [0xfb50, 0xfdff],
  [0xfe70, 0xfeff],
];

const REPLACEMENTS: Record<string, string> = {
  '→': '->',
  '←': '<-',
  '⇒': '=>',
  '\t': ' ',
  ' ': ' ',
  ' ': ' ',
  ' ': ' ',
  ' ': ' ',
};

// Zero-width and direction marks: invisible, and the fonts have no glyph for them.
const INVISIBLE = /[​-‏‪-‮⁠-⁯﻿]/g;

function inRanges(codePoint: number, ranges: Range[]) {
  return ranges.some(([start, end]) => codePoint >= start && codePoint <= end);
}

function isArabicChar(char: string) {
  return inRanges(char.codePointAt(0) ?? 0, ARABIC_RANGES);
}

/**
 * Text as the report fonts can draw it: a few symbols swapped for an equivalent,
 * invisible marks dropped, and any character neither font has (for example
 * Devanagari) shown as "?" rather than as a blank. The CSV keeps the exact text.
 */
export function pdfText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';

  return Array.from(String(value).replace(INVISIBLE, ''), (char) => {
    const replacement = REPLACEMENTS[char];
    if (replacement !== undefined) return replacement;
    if (char === '\n') return char;
    const codePoint = char.codePointAt(0) ?? 0;
    return inRanges(codePoint, LATIN_RANGES) || inRanges(codePoint, ARABIC_RANGES) ? char : '?';
  }).join('');
}

export function hasArabic(text: string) {
  return Array.from(text).some(isArabicChar);
}

type TextRun = { text: string; arabic: boolean };

/**
 * A line cut into runs of one script. Spaces, digits and punctuation between two
 * Arabic letters stay in the Arabic run, so "فاطمة علي" is drawn as one phrase
 * with its words in right-to-left order; anywhere else they join the Latin text.
 */
export function scriptRuns(line: string): TextRun[] {
  const chars = Array.from(line);
  const strong = chars.map((char) =>
    isArabicChar(char) ? 'arabic' : /\p{L}/u.test(char) ? 'latin' : null
  );
  const isArabic = chars.map((_, index) => {
    if (strong[index]) return strong[index] === 'arabic';
    const before = strong.slice(0, index).findLast(Boolean);
    const after = strong.slice(index + 1).find(Boolean);
    return before === 'arabic' && after === 'arabic';
  });
  const runs: TextRun[] = [];

  chars.forEach((char, index) => {
    const last = runs.at(-1);
    if (last && last.arabic === isArabic[index]) last.text += char;
    else runs.push({ text: char, arabic: isArabic[index] });
  });

  return runs;
}

function setRunFont(document: jsPDF, arabic: boolean, style: PdfFontStyle) {
  document.setFont(arabic ? PDF_ARABIC_FONT : PDF_FONT, style);
}

/** The width of a line at the current font size, each run measured in its own font. */
export function textWidth(document: jsPDF, line: string, style: PdfFontStyle) {
  const width = scriptRuns(line).reduce((total, run) => {
    setRunFont(document, run.arabic, style);
    return total + document.getTextWidth(run.text);
  }, 0);

  document.setFont(PDF_FONT, style);
  return width;
}

/** Breaks a word too wide for the line into pieces that fit. */
function breakWord(document: jsPDF, word: string, maxWidth: number, style: PdfFontStyle) {
  const pieces: string[] = [];
  let piece = '';

  for (const char of Array.from(word)) {
    if (piece && textWidth(document, piece + char, style) > maxWidth) {
      pieces.push(piece);
      piece = char;
    } else {
      piece += char;
    }
  }

  return [...pieces, piece];
}

/** Wraps text to a width, keeping its own line breaks, measuring each script in its font. */
export function wrapText(document: jsPDF, text: string, maxWidth: number, style: PdfFontStyle) {
  const lines: string[] = [];

  for (const paragraph of text.split('\n')) {
    let line = '';

    for (const word of paragraph.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;

      if (textWidth(document, candidate, style) <= maxWidth) {
        line = candidate;
        continue;
      }

      if (line) lines.push(line);
      const pieces = breakWord(document, word, maxWidth, style);
      lines.push(...pieces.slice(0, -1));
      line = pieces.at(-1) ?? '';
    }

    lines.push(line);
  }

  return lines;
}

/** Draws one line, run by run, from `x` (its left edge, or its right edge when right-aligned). */
export function drawTextLine(
  document: jsPDF,
  line: string,
  x: number,
  y: number,
  style: PdfFontStyle,
  align: 'left' | 'right' = 'left'
) {
  let cursor = align === 'right' ? x - textWidth(document, line, style) : x;

  for (const run of scriptRuns(line)) {
    setRunFont(document, run.arabic, style);
    document.text(run.text, cursor, y);
    cursor += document.getTextWidth(run.text);
  }

  document.setFont(PDF_FONT, style);
}

/** Wraps and draws text from its first baseline; returns the number of lines drawn. */
export function drawWrappedText(
  document: jsPDF,
  text: string,
  x: number,
  y: number,
  options: { maxWidth: number; style: PdfFontStyle; lineHeight: number }
) {
  const lines = wrapText(document, text, options.maxWidth, options.style);

  lines.forEach((line, index) => {
    drawTextLine(document, line, x, y + index * options.lineHeight, options.style);
  });

  return lines.length;
}
