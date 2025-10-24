import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import type { FastifyReply } from 'fastify';

/**
 * Professional Export Engine for Reports
 * Supports Excel (with formatting, formulas, charts) and PDF (with tables, styling)
 */

// ============ EXCEL EXPORT ============

interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  style?: Partial<ExcelJS.Style>;
}

interface ExcelSheetConfig {
  name: string;
  columns: ExcelColumn[];
  data: any[];
  title?: string;
  summary?: { label: string; value: any }[];
  totals?: boolean;
}

/**
 * Generate Excel workbook with multiple sheets, formatting, and formulas
 */
export async function generateExcelReport(config: {
  filename: string;
  sheets: ExcelSheetConfig[];
  metadata?: {
    company?: string;
    reportType?: string;
    generatedBy?: string;
  };
}) {
  const workbook = new ExcelJS.Workbook();

  // Set workbook metadata
  workbook.creator = config.metadata?.generatedBy || 'RRHH System';
  workbook.created = new Date();
  workbook.company = config.metadata?.company || 'RRHH';

  for (const sheetConfig of config.sheets) {
    const sheet = workbook.addWorksheet(sheetConfig.name, {
      views: [{ state: 'frozen', ySplit: sheetConfig.title ? 3 : 1 }],
    });

    let currentRow = 1;

    // Add title if provided
    if (sheetConfig.title) {
      sheet.mergeCells(`A${currentRow}:${getColumnLetter(sheetConfig.columns.length)}${currentRow}`);
      const titleCell = sheet.getCell(`A${currentRow}`);
      titleCell.value = sheetConfig.title;
      titleCell.font = { size: 16, bold: true, color: { argb: 'FF1F4788' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7EDF8' },
      };
      sheet.getRow(currentRow).height = 30;
      currentRow += 2;
    }

    // Add summary if provided
    if (sheetConfig.summary && sheetConfig.summary.length > 0) {
      for (const item of sheetConfig.summary) {
        sheet.getCell(`A${currentRow}`).value = item.label;
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        sheet.getCell(`B${currentRow}`).value = item.value;
        currentRow++;
      }
      currentRow++;
    }

    // Define columns
    sheet.columns = sheetConfig.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
      style: col.style || {},
    }));

    // Style header row
    const headerRow = sheet.getRow(currentRow);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 20;

    // Add data
    sheetConfig.data.forEach((row) => {
      sheet.addRow(row);
    });

    // Apply borders to all cells with data
    const dataRowCount = sheet.rowCount;
    for (let rowNum = currentRow; rowNum <= dataRowCount; rowNum++) {
      const row = sheet.getRow(rowNum);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        };
      });
    }

    // Add totals row if requested
    if (sheetConfig.totals && sheetConfig.data.length > 0) {
      const totalsRow = sheet.addRow({});
      totalsRow.font = { bold: true };
      totalsRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' },
      };

      // Calculate totals for numeric columns
      sheetConfig.columns.forEach((col, index) => {
        const cell = totalsRow.getCell(index + 1);
        if (index === 0) {
          cell.value = 'TOTAL';
        } else {
          // Check if column has numeric values
          const firstValue = sheetConfig.data[0]?.[col.key];
          if (typeof firstValue === 'number') {
            const columnLetter = getColumnLetter(index + 1);
            const startRow = currentRow + 1;
            const endRow = currentRow + sheetConfig.data.length;
            cell.value = { formula: `SUM(${columnLetter}${startRow}:${columnLetter}${endRow})` };
          }
        }
      });
    }

    // Auto-filter on header row
    sheet.autoFilter = {
      from: { row: currentRow, column: 1 },
      to: { row: currentRow, column: sheetConfig.columns.length },
    };

    // Freeze header row
    sheet.views = [{ state: 'frozen', ySplit: currentRow }];
  }

  return workbook;
}

/**
 * Stream Excel to HTTP response
 */
export async function streamExcelReport(
  reply: FastifyReply,
  config: Parameters<typeof generateExcelReport>[0]
) {
  const workbook = await generateExcelReport(config);

  reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  reply.header('Content-Disposition', `attachment; filename="${config.filename}"`);

  await workbook.xlsx.write(reply.raw);
  return reply;
}

// ============ PDF EXPORT ============

interface PDFTableColumn {
  header: string;
  key: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

interface PDFTableConfig {
  columns: PDFTableColumn[];
  data: any[];
  title?: string;
  summary?: { label: string; value: any }[];
}

/**
 * Generate PDF with formatted tables
 */
export async function generatePDFReport(
  reply: FastifyReply,
  config: {
    filename: string;
    title: string;
    subtitle?: string;
    tables: PDFTableConfig[];
    metadata?: {
      company?: string;
      reportType?: string;
      generatedBy?: string;
      generatedAt?: Date;
    };
  }
) {
  reply.header('Content-Type', 'application/pdf');
  reply.header('Content-Disposition', `attachment; filename="${config.filename}"`);

  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true,
  });

  doc.pipe(reply.raw);

  // Header
  doc.fontSize(20).fillColor('#1F4788').text(config.title, { align: 'center' });
  doc.moveDown(0.5);

  if (config.subtitle) {
    doc.fontSize(12).fillColor('#666').text(config.subtitle, { align: 'center' });
    doc.moveDown(0.5);
  }

  // Metadata line
  const metadata = [];
  if (config.metadata?.company) metadata.push(`Empresa: ${config.metadata.company}`);
  if (config.metadata?.reportType) metadata.push(`Tipo: ${config.metadata.reportType}`);
  if (config.metadata?.generatedAt) {
    metadata.push(`Generado: ${config.metadata.generatedAt.toLocaleString('es-AR')}`);
  }

  if (metadata.length > 0) {
    doc
      .fontSize(9)
      .fillColor('#888')
      .text(metadata.join(' | '), { align: 'center' });
    doc.moveDown(1);
  }

  doc.strokeColor('#E0E0E0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);

  // Tables
  for (const table of config.tables) {
    // Table title
    if (table.title) {
      doc.fontSize(14).fillColor('#000').text(table.title);
      doc.moveDown(0.5);
    }

    // Summary
    if (table.summary && table.summary.length > 0) {
      doc.fontSize(10).fillColor('#333');
      for (const item of table.summary) {
        doc.text(`${item.label}: ${item.value}`);
      }
      doc.moveDown(0.5);
    }

    // Calculate column widths
    const tableWidth = 495; // A4 width minus margins
    const totalWidth = table.columns.reduce((sum, col) => sum + col.width, 0);
    const scaledColumns = table.columns.map((col) => ({
      ...col,
      scaledWidth: (col.width / totalWidth) * tableWidth,
    }));

    // Table header
    let x = 50;
    const headerY = doc.y;

    doc.fillColor('#4472C4').rect(50, headerY, tableWidth, 25).fill();

    doc.fontSize(10).fillColor('#FFF');
    scaledColumns.forEach((col) => {
      doc.text(col.header, x + 5, headerY + 7, {
        width: col.scaledWidth - 10,
        align: col.align || 'left',
      });
      x += col.scaledWidth;
    });

    doc.moveDown(1.8);

    // Table rows
    let rowIndex = 0;
    const rowsPerPage = 25; // Approximate

    for (const row of table.data) {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
        doc.y = 50;
      }

      const rowY = doc.y;
      const rowHeight = 20;

      // Alternate row colors
      if (rowIndex % 2 === 0) {
        doc.fillColor('#F9F9F9').rect(50, rowY, tableWidth, rowHeight).fill();
      }

      // Draw row data
      x = 50;
      doc.fontSize(9).fillColor('#000');

      scaledColumns.forEach((col) => {
        const value = row[col.key] !== undefined ? String(row[col.key]) : '';
        doc.text(value, x + 5, rowY + 5, {
          width: col.scaledWidth - 10,
          align: col.align || 'left',
          ellipsis: true,
        });
        x += col.scaledWidth;
      });

      // Draw row border
      doc
        .strokeColor('#E0E0E0')
        .lineWidth(0.5)
        .moveTo(50, rowY + rowHeight)
        .lineTo(545, rowY + rowHeight)
        .stroke();

      doc.y = rowY + rowHeight;
      rowIndex++;
    }

    doc.moveDown(2);
  }

  // Footer with page numbers
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);

    doc
      .fontSize(8)
      .fillColor('#888')
      .text(
        `Página ${i + 1} de ${pages.count}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

    doc
      .fontSize(8)
      .text(
        `Generado por ${config.metadata?.generatedBy || 'RRHH System'}`,
        50,
        doc.page.height - 35,
        { align: 'center' }
      );
  }

  doc.end();
  return reply;
}

// ============ HELPERS ============

/**
 * Convert column index to Excel column letter (1 => A, 27 => AA, etc.)
 */
function getColumnLetter(columnIndex: number): string {
  let letter = '';
  let num = columnIndex;

  while (num > 0) {
    const remainder = (num - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    num = Math.floor((num - remainder) / 26);
  }

  return letter;
}

/**
 * Format number as currency
 */
export function formatCurrency(value: number, currency: string = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format date
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-AR');
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9_\-\.]/gi, '_').toLowerCase();
}
