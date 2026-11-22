// A branded, landscape A4 PDF report: the organization band on every page, a
// block of report details (Tenant, period, who exported it, filters) on the
// first, then one or more tables that flow across pages, and a footer with a
// confidentiality note and page numbers. Used by the Audit Log and User Audit
// exports; built with jsPDF on the server, like the appointment schedule. Text is
// set in Noto Sans, with Arabic in Noto Sans Arabic (see `pdf-text.ts`).

import type { CellHookData } from 'jspdf-autotable';

import type { ExportBrand } from './export-brand';
import { PDF_FONT, registerPdfFonts, type PdfFontStyle } from './pdf-fonts';
import { drawTextLine, drawWrappedText, hasArabic, pdfText, wrapText } from './pdf-text';

export type PdfReportDetail = {
  label: string;
  value: string;
  /** Spans the whole row, for a long value such as the filters. */
  wide?: boolean;
};

export type PdfReportColumn = {
  header: string;
  /** Width in points; columns without one share what is left. */
  width?: number;
  align?: 'left' | 'right';
};

export type PdfReportSection = {
  heading?: string;
  /** A line under the heading, such as "Latest 100 of 240 Sessions". */
  note?: string;
  columns: PdfReportColumn[];
  rows: string[][];
  /** Shown in place of the table when there are no rows. */
  emptyText: string;
};

export type PdfReport = {
  title: string;
  subject: string;
  brand: ExportBrand;
  details: PdfReportDetail[];
  sections: PdfReportSection[];
  footerNote: string;
};

const PRIMARY: [number, number, number] = [25, 62, 104];
const TEXT: [number, number, number] = [31, 41, 55];
const MUTED: [number, number, number] = [82, 97, 112];
const BORDER: [number, number, number] = [213, 222, 232];
const STRIPE: [number, number, number] = [244, 247, 250];

const MARGIN = 24;
const BAND_HEIGHT = 64;
const CONTENT_TOP = BAND_HEIGHT + 16;
const FOOTER_SPACE = 38;
const DETAIL_COLUMNS = 4;
const DETAIL_ROW_HEIGHT = 26;
const DETAIL_LINE_HEIGHT = 10;

const CELL_PADDING = 3.5;
const CELL_FONT_SIZE = 6.5;

function organizationInitials(organizationName: string) {
  return (
    organizationName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'EMR'
  );
}

/** Every column's width in points: fixed ones as given, the rest sharing what is left equally. */
function columnWidths(columns: PdfReportColumn[], contentWidth: number) {
  const fixed = columns.reduce((total, column) => total + (column.width ?? 0), 0);
  const flexible = columns.filter((column) => column.width === undefined).length;
  const share = flexible ? Math.max(40, (contentWidth - fixed) / flexible) : 0;

  return columns.map((column) => column.width ?? share);
}

export async function createPdfReport(report: PdfReport): Promise<Uint8Array> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  // Compressed streams keep the embedded font glyphs small.
  const document = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });
  await registerPdfFonts(document);
  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  const { brand } = report;

  document.setProperties({
    title: pdfText(report.title),
    subject: pdfText(report.subject),
    author: pdfText(brand.organizationName),
    creator: 'Medical EMR',
  });

  function drawBand() {
    document.setFillColor(...PRIMARY);
    document.rect(0, 0, pageWidth, BAND_HEIGHT, 'F');
    document.setFillColor(255, 255, 255);
    document.roundedRect(MARGIN, 13, 38, 38, 5, 5, 'F');

    if (brand.logo) {
      document.addImage(brand.logo, 'PNG', MARGIN + 3, 16, 32, 32, undefined, 'FAST');
    } else {
      document.setFont(PDF_FONT, 'bold');
      document.setFontSize(11);
      document.setTextColor(...PRIMARY);
      document.text(organizationInitials(pdfText(brand.organizationName)), MARGIN + 19, 36, {
        align: 'center',
      });
    }

    document.setTextColor(255, 255, 255);
    document.setFontSize(14);
    drawTextLine(document, pdfText(report.title), MARGIN + 52, 30, 'bold');
    document.setFontSize(9);
    drawTextLine(
      document,
      pdfText(`${brand.organizationName} · ${brand.organizationSubtitle}`),
      MARGIN + 52,
      46,
      'normal'
    );
  }

  // Report details as a grid of label/value pairs; wide ones take a row each.
  function drawDetails(top: number) {
    const narrow = report.details.filter((detail) => !detail.wide);
    const wide = report.details.filter((detail) => detail.wide);
    const cellWidth = contentWidth / DETAIL_COLUMNS;
    let y = top;

    // Each row is as tall as its longest value, so a wrapped value never runs into the next row.
    for (let start = 0; start < narrow.length; start += DETAIL_COLUMNS) {
      let rowLines = 1;

      narrow.slice(start, start + DETAIL_COLUMNS).forEach((detail, column) => {
        const x = MARGIN + column * cellWidth;
        document.setFontSize(7);
        document.setTextColor(...MUTED);
        drawTextLine(document, pdfText(detail.label).toUpperCase(), x, y, 'normal');
        document.setFontSize(8.5);
        document.setTextColor(...TEXT);
        const lineCount = drawWrappedText(document, pdfText(detail.value), x, y + 11, {
          maxWidth: cellWidth - 10,
          style: 'bold',
          lineHeight: DETAIL_LINE_HEIGHT,
        });
        rowLines = Math.max(rowLines, lineCount);
      });

      y += DETAIL_ROW_HEIGHT + (rowLines - 1) * DETAIL_LINE_HEIGHT;
    }

    for (const detail of wide) {
      document.setFontSize(7);
      document.setTextColor(...MUTED);
      drawTextLine(document, pdfText(detail.label).toUpperCase(), MARGIN, y, 'normal');
      document.setFontSize(8);
      document.setTextColor(...TEXT);
      const lineCount = drawWrappedText(document, pdfText(detail.value), MARGIN, y + 11, {
        maxWidth: contentWidth,
        style: 'normal',
        lineHeight: DETAIL_LINE_HEIGHT,
      });
      y += 14 + lineCount * DETAIL_LINE_HEIGHT;
    }

    document.setDrawColor(...BORDER);
    document.line(MARGIN, y - 4, pageWidth - MARGIN, y - 4);

    return y + 10;
  }

  drawBand();
  let cursor = drawDetails(CONTENT_TOP + 4);

  for (const section of report.sections) {
    // Keep a heading with at least a few rows of its table.
    if (cursor > pageHeight - FOOTER_SPACE - 80) {
      document.addPage();
      drawBand();
      cursor = CONTENT_TOP;
    }

    if (section.heading) {
      document.setFontSize(10.5);
      document.setTextColor(...PRIMARY);
      drawTextLine(document, pdfText(section.heading), MARGIN, cursor + 4, 'bold');
      cursor += 10;
    }

    if (section.note) {
      document.setFontSize(7.5);
      document.setTextColor(...MUTED);
      drawTextLine(document, pdfText(section.note), MARGIN, cursor + 4, 'normal');
      cursor += 10;
    }

    if (section.rows.length === 0) {
      document.setFontSize(8);
      document.setTextColor(...MUTED);
      drawTextLine(document, pdfText(section.emptyText), MARGIN, cursor + 10, 'normal');
      cursor += 30;
      continue;
    }

    const widths = columnWidths(section.columns, contentWidth);
    // Cells holding Arabic are wrapped and drawn here, run by run; autoTable lays out the rest.
    const mixedCells = new WeakMap<CellHookData['cell'], string[]>();

    autoTable(document, {
      startY: cursor + 4,
      head: [section.columns.map(({ header }) => pdfText(header))],
      body: section.rows.map((row) => row.map((cell) => pdfText(cell))),
      margin: { top: CONTENT_TOP, right: MARGIN, bottom: FOOTER_SPACE, left: MARGIN },
      styles: {
        font: PDF_FONT,
        fontSize: CELL_FONT_SIZE,
        cellPadding: CELL_PADDING,
        overflow: 'linebreak',
        valign: 'top',
        textColor: TEXT,
        lineColor: BORDER,
        lineWidth: 0.3,
      },
      headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: STRIPE },
      // A row moves whole to the next page rather than splitting across two.
      rowPageBreak: 'avoid',
      columnStyles: Object.fromEntries(
        section.columns.map((column, index) => [
          index,
          { cellWidth: widths[index], halign: column.align ?? 'left' },
        ])
      ),
      didParseCell: (data) => {
        // Headings line up with their column, so a right-aligned count has a right-aligned heading.
        if (data.section === 'head') {
          data.cell.styles.halign = section.columns[data.column.index]?.align ?? 'left';
        }

        const text = data.cell.text.join('\n');
        if (!hasArabic(text)) return;

        const style: PdfFontStyle = data.section === 'head' ? 'bold' : 'normal';
        document.setFontSize(CELL_FONT_SIZE);
        const lines = wrapText(document, text, widths[data.column.index] - CELL_PADDING * 2, style);
        // Already wrapped: autoTable sizes the row from these lines and must not wrap them again.
        data.cell.text = lines;
        data.cell.styles.overflow = 'visible';
        mixedCells.set(data.cell, lines);
      },
      willDrawCell: (data) => {
        if (mixedCells.has(data.cell)) data.cell.text = [''];
      },
      didDrawCell: (data) => {
        const lines = mixedCells.get(data.cell);
        if (!lines) return;

        const { cell } = data;
        const style: PdfFontStyle = data.section === 'head' ? 'bold' : 'normal';
        const lineHeight = CELL_FONT_SIZE * document.getLineHeightFactor();
        const alignRight = cell.styles.halign === 'right';
        const x = alignRight ? cell.x + cell.width - CELL_PADDING : cell.x + CELL_PADDING;
        // Where autoTable puts the first baseline of a top-aligned cell.
        const y = cell.y + CELL_PADDING + CELL_FONT_SIZE * 0.85;

        document.setFontSize(CELL_FONT_SIZE);
        lines.forEach((line, index) => {
          drawTextLine(
            document,
            line,
            x,
            y + index * lineHeight,
            style,
            alignRight ? 'right' : 'left'
          );
        });
      },
      willDrawPage: (data) => {
        if (data.pageNumber > 1) drawBand();
      },
    });

    cursor =
      (document as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;
  }

  const totalPages = document.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    document.setPage(page);
    document.setDrawColor(...BORDER);
    document.line(MARGIN, pageHeight - 27, pageWidth - MARGIN, pageHeight - 27);
    document.setFontSize(7.5);
    document.setTextColor(...MUTED);
    drawTextLine(document, pdfText(report.footerNote), MARGIN, pageHeight - 14, 'normal');
    drawTextLine(
      document,
      `Page ${page} of ${totalPages}`,
      pageWidth - MARGIN,
      pageHeight - 14,
      'normal',
      'right'
    );
  }

  return new Uint8Array(document.output('arraybuffer'));
}
