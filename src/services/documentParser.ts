/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as pdfjsLib from 'pdfjs-dist';
// Use local bundled worker via Vite query parameter
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { DocumentFormat } from '../types/document';

// Configure PDF.js worker locally for offline operation
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface DetectedTypeResult {
  format: DocumentFormat;
  mimeType: string;
  extension: string;
  confidence: 'magic_byte' | 'container_inspection' | 'extension_fallback';
}

/**
 * Validates document type by inspecting actual file content (magic bytes and container inspection).
 * Never trusts extensions alone.
 */
export async function detectDocumentType(
  fileOrBlob: Blob | File,
  fallbackFilename: string
): Promise<DetectedTypeResult> {
  const extensionMatch = fallbackFilename.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extensionMatch ? extensionMatch[1].toLowerCase() : '';

  // Read first 4096 bytes for header signatures
  const headerSlice = fileOrBlob.slice(0, 4096);
  const headerBuffer = await headerSlice.arrayBuffer();
  const headerBytes = new Uint8Array(headerBuffer);

  // 1. PDF Magic Bytes: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (
    headerBytes.length >= 5 &&
    headerBytes[0] === 0x25 &&
    headerBytes[1] === 0x50 &&
    headerBytes[2] === 0x44 &&
    headerBytes[3] === 0x46 &&
    headerBytes[4] === 0x2d
  ) {
    return {
      format: 'pdf',
      mimeType: 'application/pdf',
      extension: '.pdf',
      confidence: 'magic_byte',
    };
  }

  // 2. ZIP Archive Signature: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
  // Office OpenXML documents (DOCX, XLSX, PPTX) are zip archives.
  if (
    headerBytes.length >= 4 &&
    headerBytes[0] === 0x50 &&
    headerBytes[1] === 0x4b &&
    headerBytes[2] === 0x03 &&
    headerBytes[3] === 0x04
  ) {
    try {
      const fullBuffer = await fileOrBlob.arrayBuffer();
      const zip = await JSZip.loadAsync(fullBuffer);

      if (zip.file('word/document.xml') || zip.file(/^word\//)) {
        return {
          format: 'docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extension: '.docx',
          confidence: 'container_inspection',
        };
      }
      if (zip.file('xl/workbook.xml') || zip.file(/^xl\//)) {
        return {
          format: 'xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          extension: '.xlsx',
          confidence: 'container_inspection',
        };
      }
      if (zip.file('ppt/presentation.xml') || zip.file(/^ppt\//)) {
        return {
          format: 'pptx',
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          extension: '.pptx',
          confidence: 'container_inspection',
        };
      }
    } catch {
      // If zip parsing fails on header, fallback below
    }
  }

  // 3. OLE2 Compound Document Signature (Legacy Office: DOC, XLS, PPT)
  // Magic bytes: 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1
  if (
    headerBytes.length >= 8 &&
    headerBytes[0] === 0xd0 &&
    headerBytes[1] === 0xcf &&
    headerBytes[2] === 0x11 &&
    headerBytes[3] === 0xe0 &&
    headerBytes[4] === 0xa1 &&
    headerBytes[5] === 0xb1 &&
    headerBytes[6] === 0x1a &&
    headerBytes[7] === 0xe1
  ) {
    if (ext === 'xls') {
      return {
        format: 'xls',
        mimeType: 'application/vnd.ms-excel',
        extension: '.xls',
        confidence: 'magic_byte',
      };
    }
    if (ext === 'ppt') {
      return {
        format: 'ppt',
        mimeType: 'application/vnd.ms-powerpoint',
        extension: '.ppt',
        confidence: 'magic_byte',
      };
    }
    return {
      format: 'doc',
      mimeType: 'application/msword',
      extension: '.doc',
      confidence: 'magic_byte',
    };
  }

  // 4. RTF Magic Bytes: {\rtf (0x7B, 0x5C, 0x72, 0x74, 0x66)
  if (
    headerBytes.length >= 5 &&
    headerBytes[0] === 0x7b &&
    headerBytes[1] === 0x5c &&
    headerBytes[2] === 0x72 &&
    headerBytes[3] === 0x74 &&
    headerBytes[4] === 0x66
  ) {
    return {
      format: 'rtf',
      mimeType: 'application/rtf',
      extension: '.rtf',
      confidence: 'magic_byte',
    };
  }

  // 5. Image Signatures (PNG, JPEG, WebP, GIF)
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    headerBytes.length >= 8 &&
    headerBytes[0] === 0x89 &&
    headerBytes[1] === 0x50 &&
    headerBytes[2] === 0x4e &&
    headerBytes[3] === 0x47
  ) {
    return {
      format: 'image',
      mimeType: 'image/png',
      extension: '.png',
      confidence: 'magic_byte',
    };
  }
  // JPEG: FF D8 FF
  if (headerBytes.length >= 3 && headerBytes[0] === 0xff && headerBytes[1] === 0xd8 && headerBytes[2] === 0xff) {
    return {
      format: 'image',
      mimeType: 'image/jpeg',
      extension: '.jpg',
      confidence: 'magic_byte',
    };
  }
  // WebP: RIFF ... WEBP
  if (
    headerBytes.length >= 12 &&
    headerBytes[0] === 0x52 &&
    headerBytes[1] === 0x49 &&
    headerBytes[2] === 0x46 &&
    headerBytes[3] === 0x46 &&
    headerBytes[8] === 0x57 &&
    headerBytes[9] === 0x45 &&
    headerBytes[10] === 0x42 &&
    headerBytes[11] === 0x50
  ) {
    return {
      format: 'image',
      mimeType: 'image/webp',
      extension: '.webp',
      confidence: 'magic_byte',
    };
  }

  // 6. Plain text inspection (check if file contains printable UTF-8 characters without null byte sequences)
  let isBinary = false;
  const sampleSize = Math.min(headerBytes.length, 512);
  for (let i = 0; i < sampleSize; i++) {
    const byte = headerBytes[i];
    if (byte === 0x00) {
      isBinary = true;
      break;
    }
  }

  if (!isBinary) {
    if (ext === 'md' || ext === 'markdown') {
      return { format: 'md', mimeType: 'text/markdown', extension: '.md', confidence: 'extension_fallback' };
    }
    if (ext === 'csv') {
      return { format: 'csv', mimeType: 'text/csv', extension: '.csv', confidence: 'extension_fallback' };
    }
    return { format: 'txt', mimeType: 'text/plain', extension: '.txt', confidence: 'extension_fallback' };
  }

  // 7. Fallback for unrecognized formats
  return {
    format: 'unsupported',
    mimeType: fileOrBlob.type || 'application/octet-stream',
    extension: ext ? `.${ext}` : '',
    confidence: 'extension_fallback',
  };
}

/**
 * Calculates SHA-256 hash of a file for integrity check
 */
export async function calculateSha256(blob: Blob): Promise<string> {
  try {
    const buffer = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'sha256-unavailable';
  }
}

/* =========================================================================
   PDF Engine
   ========================================================================= */

export async function loadPdfDocument(blob: Blob, password?: string) {
  const arrayBuffer = await blob.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    password: password || undefined,
  });
  return await loadingTask.promise;
}

export async function renderPdfPageToCanvas(
  pdfDoc: any,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.0,
  rotation: number = 0
): Promise<{ width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale, rotation });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Fill with white background before rendering
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  return { width: viewport.width, height: viewport.height };
}

export async function extractPdfTextContent(pdfDoc: any, pageNumber: number): Promise<string> {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    return textContent.items
      .map((item: any) => (item.str ? item.str : ''))
      .join(' ');
  } catch {
    return '';
  }
}

export async function generatePdfThumbnail(pdfDoc: any): Promise<string> {
  try {
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 0.3 }); // Small thumbnail
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return '';
  }
}

/* =========================================================================
   DOCX Engine
   ========================================================================= */

export interface ParsedDocxResult {
  html: string;
  rawText: string;
  wordCount: number;
  headings: Array<{ level: number; text: string }>;
}

export async function parseDocxFile(blob: Blob): Promise<ParsedDocxResult> {
  const arrayBuffer = await blob.arrayBuffer();

  const options = {
    styleMap: [
      "p[style-name='Title'] => h1.doc-title:fresh",
      "p[style-name='Subtitle'] => p.doc-subtitle:fresh",
      "p[style-name='Heading 1'] => h1:fresh",
      "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='Heading 3'] => h3:fresh",
      "p[style-name='Heading 4'] => h4:fresh",
    ],
  };

  const result = await mammoth.convertToHtml({ arrayBuffer }, options);
  const rawResult = await mammoth.extractRawText({ arrayBuffer });

  const rawText = rawResult.value || '';
  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;

  // Extract headings for outline/TOC
  const headings: Array<{ level: number; text: string }> = [];
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
  let match;
  while ((match = headingRegex.exec(result.value)) !== null) {
    headings.push({
      level: parseInt(match[1], 10),
      text: match[2].replace(/<[^>]*>/g, '').trim(),
    });
  }

  return {
    html: result.value,
    rawText,
    wordCount,
    headings,
  };
}

/* =========================================================================
   Spreadsheet Engine (XLSX, XLS, CSV)
   ========================================================================= */

export interface ParsedSheetData {
  sheetNames: string[];
  activeSheet: string;
  sheets: Record<
    string,
    {
      rows: string[][];
      rowCount: number;
      colCount: number;
    }
  >;
}

export async function parseSpreadsheetFile(blob: Blob): Promise<ParsedSheetData> {
  const arrayBuffer = await blob.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const sheetNames = workbook.SheetNames || [];
  const sheets: ParsedSheetData['sheets'] = {};

  sheetNames.forEach((name) => {
    const worksheet = workbook.Sheets[name];
    if (worksheet) {
      // Convert to array of arrays
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        defval: '',
      });

      // Limit memory footprint: take up to 2000 rows max for fast preview
      const rows = data.slice(0, 2000).map((row) =>
        row.map((cell) => (cell !== null && cell !== undefined ? String(cell) : ''))
      );

      let maxCols = 0;
      rows.forEach((r) => {
        if (r.length > maxCols) maxCols = r.length;
      });

      sheets[name] = {
        rows,
        rowCount: data.length,
        colCount: maxCols,
      };
    }
  });

  return {
    sheetNames,
    activeSheet: sheetNames[0] || 'Sheet1',
    sheets,
  };
}

/* =========================================================================
   Presentation Engine (PPTX)
   ========================================================================= */

export interface ParsedSlide {
  slideNumber: number;
  title: string;
  paragraphs: string[];
  bulletPoints: string[];
  notes?: string;
}

export interface ParsedPptxResult {
  totalSlides: number;
  slides: ParsedSlide[];
}

export async function parsePptxFile(blob: Blob): Promise<ParsedPptxResult> {
  const arrayBuffer = await blob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Find all slide XMLs in ppt/slides/slide*.xml
  const slideFileNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

  const slides: ParsedSlide[] = [];

  for (let idx = 0; idx < slideFileNames.length; idx++) {
    const fileName = slideFileNames[idx];
    const xmlText = await zip.files[fileName].async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    // Extract all text elements <a:t>
    const textNodes = xmlDoc.getElementsByTagName('a:t');
    const allStrings: string[] = [];
    for (let i = 0; i < textNodes.length; i++) {
      const val = textNodes[i].textContent?.trim();
      if (val) allStrings.push(val);
    }

    // Try finding title specifically from title shapes or the first distinct string
    let title = `Slide ${idx + 1}`;
    const paragraphs: string[] = [];
    const bulletPoints: string[] = [];

    // Group into paragraphs by scanning <a:p>
    const pNodes = xmlDoc.getElementsByTagName('a:p');
    for (let pIdx = 0; pIdx < pNodes.length; pIdx++) {
      const pNode = pNodes[pIdx];
      const tInP = pNode.getElementsByTagName('a:t');
      const pTextArr: string[] = [];
      for (let j = 0; j < tInP.length; j++) {
        if (tInP[j].textContent) pTextArr.push(tInP[j].textContent!);
      }
      const combined = pTextArr.join(' ').trim();
      if (combined) {
        if (pIdx === 0 && !title.startsWith('Slide ') && allStrings.length > 0) {
          title = combined;
        } else if (pIdx === 0) {
          title = combined;
        } else {
          bulletPoints.push(combined);
          paragraphs.push(combined);
        }
      }
    }

    // Check for speaker notes: ppt/notesSlides/notesSlide{idx+1}.xml
    let notes = '';
    const noteName = `ppt/notesSlides/notesSlide${idx + 1}.xml`;
    if (zip.files[noteName]) {
      try {
        const noteXml = await zip.files[noteName].async('text');
        const noteDoc = parser.parseFromString(noteXml, 'application/xml');
        const noteNodes = noteDoc.getElementsByTagName('a:t');
        const noteArr: string[] = [];
        for (let k = 0; k < noteNodes.length; k++) {
          const nv = noteNodes[k].textContent?.trim();
          if (nv && !/^\d+$/.test(nv)) noteArr.push(nv);
        }
        notes = noteArr.join(' ');
      } catch {
        // notes optional
      }
    }

    slides.push({
      slideNumber: idx + 1,
      title: title || `Slide ${idx + 1}`,
      paragraphs,
      bulletPoints,
      notes,
    });
  }

  return {
    totalSlides: slides.length,
    slides,
  };
}

/* =========================================================================
   Plain Text, Markdown, and CSV Engine
   ========================================================================= */

export async function readPlainTextFile(blob: Blob): Promise<string> {
  return await blob.text();
}
