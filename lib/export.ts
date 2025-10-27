import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Export resume or cover letter as PDF
 */
export function exportToPDF(content: string, filename: string = 'document.pdf') {
  const doc = new jsPDF();

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const lineHeight = 7;
  const maxWidth = pageWidth - 2 * margin;

  // Split content into lines
  const lines = doc.splitTextToSize(content, maxWidth);

  let y = margin;

  for (let i = 0; i < lines.length; i++) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    doc.text(lines[i], margin, y);
    y += lineHeight;
  }

  doc.save(filename);
}

/**
 * Export resume or cover letter as DOCX
 */
export async function exportToDOCX(content: string, filename: string = 'document.docx') {
  // Split content into sections and paragraphs
  const sections = content.split('\n\n');

  const paragraphs = sections.map((section) => {
    const lines = section.split('\n');

    return lines.map((line, idx) => {
      // Check if this looks like a header (all caps, or short line at start of section)
      const isHeader = idx === 0 && (
        line === line.toUpperCase() ||
        (line.length < 50 && !line.includes(','))
      );

      if (isHeader) {
        return new Paragraph({
          text: line,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        });
      }

      return new Paragraph({
        children: [new TextRun(line)],
        spacing: { before: 100 },
      });
    });
  }).flat();

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

/**
 * Copy text to clipboard
 */
export function copyToClipboard(content: string): Promise<void> {
  return navigator.clipboard.writeText(content);
}

/**
 * Download as plain text file
 */
export function exportToText(content: string, filename: string = 'document.txt') {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, filename);
}
