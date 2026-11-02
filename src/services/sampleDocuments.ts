/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { DocumentItem } from '../types/document';
import { calculateSha256 } from './documentParser';

/**
 * Creates a valid, multi-page standard PDF 1.4 binary.
 */
function createSamplePdfBinary(): Uint8Array {
  // A clean, valid multi-page PDF with streams, font descriptors, and real text
  const pdfString = `%PDF-1.4
%âãÏÓ
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R] /Count 3 >>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /Resources << /Font << /F1 6 0 R /F2 7 0 R >> >>
  /MediaBox [0 0 612 792]
  /Contents 8 0 R
>>
endobj
4 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /Resources << /Font << /F1 6 0 R /F2 7 0 R >> >>
  /MediaBox [0 0 612 792]
  /Contents 9 0 R
>>
endobj
5 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /Resources << /Font << /F1 6 0 R /F2 7 0 R >> >>
  /MediaBox [0 0 612 792]
  /Contents 10 0 R
>>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
7 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
8 0 obj
<< /Length 480 >>
stream
BT
/F1 24 Tf
50 720 Td
(Paperwren: Native Android Document Engine) Tj
/F2 12 Tf
0 -30 Td
(Architecture Specification & System Guide) Tj
0 -25 Td
(Date: November 2026 | Version: 1.0.0-PROD | Confidential) Tj
/F1 16 Tf
0 -40 Td
(1. Product Overview) Tj
/F2 12 Tf
0 -20 Td
(Paperwren is an offline-first document viewer built for privacy, speed, and precision.) Tj
0 -18 Td
(It leverages Android 16 native APIs, Room database persistence, and efficient bitmap recycling.) Tj
0 -18 Td
(Zero network calls, zero telemetry, and zero advertisements.) Tj
/F1 16 Tf
0 -40 Td
(2. Key Technical Standards) Tj
/F2 12 Tf
0 -20 Td
(Target Performance Device: Motorola Moto G45 5G, 8GB RAM, Android 16) Tj
0 -18 Td
(Primary Engines: Android PdfRenderer, OpenXML Stream Reader, SheetJS Virtualized Grid) Tj
0 -18 Td
(Memory Envelope: Strictly capped page render buffers with LRU bitmap recycling) Tj
ET
endstream
endobj
9 0 obj
<< /Length 520 >>
stream
BT
/F1 20 Tf
50 720 Td
(Offline Security & Storage Access) Tj
/F2 12 Tf
0 -30 Td
(3. Storage Access Framework (SAF) Workflow) Tj
0 -20 Td
(Documents are imported via system SAF pickers without requiring broad storage permissions.) Tj
0 -18 Td
(Persistent URI grants are maintained in Room database for quick re-opening.) Tj
0 -18 Td
(Document binaries are cached in internal app-isolated sandbox storage.) Tj
/F1 16 Tf
0 -40 Td
(4. Format Compatibility Hierarchy) Tj
/F2 12 Tf
0 -20 Td
(- PDF: Fully rendered vector/raster page layout with bookmarks and pinch zoom) Tj
0 -18 Td
(- DOCX: OpenXML semantic extraction of headings, tables, lists, and bold text) Tj
0 -18 Td
(- XLSX / XLS / CSV: Sheet tabs, cell formulas output, and coordinate browsing) Tj
0 -18 Td
(- PPTX: Slide carousel, thumbnails, bullet hierarchy, and presenter notes) Tj
0 -18 Td
(- TXT / MD: High-legibility serif and monospace typography controls) Tj
ET
endstream
endobj
10 0 obj
<< /Length 430 >>
stream
BT
/F1 20 Tf
50 720 Td
(Reading Comfort & Liquid Glass System) Tj
/F2 12 Tf
0 -30 Td
(5. Visual System & Typography) Tj
0 -20 Td
(Paperwren combines Apple-grade Liquid Glass translucent chrome with native Material 3.) Tj
0 -18 Td
(Four adaptive reading palettes: Crisp Paper, Warm Sepia, Dark Charcoal, and AMOLED Black.) Tj
0 -18 Td
(Distraction-free mode automatically hides toolbars during continuous reading.) Tj
/F1 16 Tf
0 -40 Td
(6. Verification & Test Passed) Tj
/F2 12 Tf
0 -20 Td
(All 15 verification criteria completed. Engine ready for offline deployment.) Tj
ET
endstream
endobj
xref
0 11
0000000000 65535 f 
0000000015 00000 n 
0000000068 00000 n 
0000000140 00000 n 
0000000282 00000 n 
0000000424 00000 n 
0000000566 00000 n 
0000000643 00000 n 
0000000716 00000 n 
0000001248 00000 n 
0000001820 00000 n 
trailer
<< /Size 11 /Root 1 0 R >>
startxref
2302
%%EOF`;

  return new TextEncoder().encode(pdfString);
}

/**
 * Creates a valid OpenXML DOCX archive with styles, headings, tables, and lists.
 */
async function createSampleDocxBinary(): Promise<Uint8Array> {
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`
  );

  // _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // word/styles.xml
  zip.file(
    'word/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
</w:styles>`
  );

  // word/document.xml
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Paperwren Architecture Proposal</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>This document outlines the technical specification for Paperwren, the native offline document viewer for Android 16. It includes data pipeline designs, memory containment strategies, and Room persistence models.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>1. Core Architecture Modules</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>The application is divided into five strictly decoupled modules:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Document Ingestion: Uses Storage Access Framework (SAF) with content-inspection MIME detection.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Persistent Catalog: Room database storing DocumentEntity, ReadingHistory, and Bookmark records.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Document Engine: Isolated parsers for PDF, DOCX, XLSX, PPTX, and plain text.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Jetpack Compose UI: Material 3 layout with Apple Liquid Glass translucent floating controls.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>2. Target Device Verification Matrix</w:t></w:r>
    </w:p>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Component</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Specification</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Target Benchmark</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Device</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Motorola Moto G45 5G</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>8 GB RAM, Android 16</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>PDF Page Flip</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Android PdfRenderer Bitmap</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>&lt; 16 ms per frame</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>DOCX Parse</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>OpenXML DOM Extraction</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>&lt; 250 ms for 50 pages</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Offline Security</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Zero network permissions</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>100% Airplane Mode verified</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
    <w:p>
      <w:r><w:t>Conclusion: Paperwren provides a completely offline, zero-telemetry reading experience with unmatched fluidity.</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`
  );

  return await zip.generateAsync({ type: 'uint8array' });
}

/**
 * Creates a valid multi-sheet XLSX spreadsheet using SheetJS.
 */
function createSampleXlsxBinary(): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Financial Model
  const sheet1Data = [
    ['Metric', 'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'Full Year Total'],
    ['Active Readers', '142,500', '210,000', '345,000', '520,000', '520,000'],
    ['Documents Ingested', '1,240,000', '2,450,000', '4,100,000', '6,800,000', '14,590,000'],
    ['Average Memory Footprint (MB)', '42.4', '41.8', '40.2', '38.6', '40.75'],
    ['Crash Rate (%)', '0.001%', '0.000%', '0.000%', '0.000%', '0.000%'],
    ['Customer Satisfaction (CSAT)', '4.92 / 5.0', '4.94 / 5.0', '4.95 / 5.0', '4.96 / 5.0', '4.95 / 5.0'],
    ['Ad Revenue', '$0.00', '$0.00', '$0.00', '$0.00', '$0.00 (Zero Ads)'],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'Quarterly Metrics');

  // Sheet 2: Device Benchmarks
  const sheet2Data = [
    ['Device Name', 'Chipset', 'RAM', 'Cold Launch (ms)', 'PDF 100p Load', 'Status'],
    ['Motorola Moto G45 5G', 'Snapdragon 6s Gen 3', '8 GB', '310 ms', '140 ms', 'Primary Target (Passed)'],
    ['Pixel 8 Pro', 'Google Tensor G3', '12 GB', '220 ms', '95 ms', 'Verified'],
    ['Galaxy A54 5G', 'Exynos 1380', '8 GB', '340 ms', '165 ms', 'Verified'],
    ['OnePlus Nord CE 3', 'Snapdragon 782G', '8 GB', '290 ms', '130 ms', 'Verified'],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws2, 'Device Benchmarks');

  // Sheet 3: Format Matrix
  const sheet3Data = [
    ['Format', 'Renderer Engine', 'Offline Tested', 'Zoom Support', 'Text Search'],
    ['PDF', 'PdfRenderer / PDF.js', 'Yes (100%)', 'Pinch / Double-Tap', 'Supported'],
    ['DOCX', 'OpenXML AST', 'Yes (100%)', 'Font Scale (80%-150%)', 'Supported'],
    ['XLSX', 'SheetJS Virtual Grid', 'Yes (100%)', 'Zoom In / Out', 'Supported'],
    ['PPTX', 'OpenXML Slide Deck', 'Yes (100%)', 'Card & Fullscreen', 'Supported'],
    ['TXT / MD', 'Native Typography', 'Yes (100%)', 'Font Scaling', 'Supported'],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  XLSX.utils.book_append_sheet(wb, ws3, 'Format Capabilities');

  const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(xlsxBuffer);
}

/**
 * Creates a valid OpenXML PPTX presentation archive.
 */
async function createSamplePptxBinary(): Promise<Uint8Array> {
  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide3.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/notesSlides/notesSlide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  zip.file(
    'ppt/presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId1"/>
    <p:sldId id="257" r:id="rId2"/>
    <p:sldId id="258" r:id="rId3"/>
  </p:sldIdLst>
</p:presentation>`
  );

  // Slide 1
  zip.file(
    'ppt/slides/slide1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp><p:txBody><a:p><a:r><a:t>Paperwren Document Viewer</a:t></a:r></a:p></p:txBody></p:sp>
      <p:sp><p:txBody>
        <a:p><a:r><a:t>Premium Offline-First Android Engineering</a:t></a:r></a:p>
        <a:p><a:r><a:t>• Engineered with Jetpack Compose &amp; Material 3</a:t></a:r></a:p>
        <a:p><a:r><a:t>• Room Database &amp; DataStore Local Persistence</a:t></a:r></a:p>
        <a:p><a:r><a:t>• Optimized for Motorola Moto G45 5G (8GB RAM)</a:t></a:r></a:p>
      </p:txBody></p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
  );

  // Slide 1 Notes
  zip.file(
    'ppt/notesSlides/notesSlide1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree><p:sp><p:txBody>
    <a:p><a:r><a:t>Speaker Note: Emphasize that zero network calls are made during document rendering. All parsing is isolated in native sandbox.</a:t></a:r></a:p>
  </p:txBody></p:sp></p:spTree></p:cSld>
</p:notes>`
  );

  // Slide 2
  zip.file(
    'ppt/slides/slide2.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp><p:txBody><a:p><a:r><a:t>Privacy &amp; Security Principles</a:t></a:r></a:p></p:txBody></p:sp>
      <p:sp><p:txBody>
        <a:p><a:r><a:t>• No Analytics or Telemetry SDKs</a:t></a:r></a:p>
        <a:p><a:r><a:t>• No Advertising Frameworks</a:t></a:r></a:p>
        <a:p><a:r><a:t>• No Mandatory Account Sign-in</a:t></a:r></a:p>
        <a:p><a:r><a:t>• Storage Access Framework (SAF) scoped permissions</a:t></a:r></a:p>
        <a:p><a:r><a:t>• Documents remain 100% on device</a:t></a:r></a:p>
      </p:txBody></p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
  );

  // Slide 3
  zip.file(
    'ppt/slides/slide3.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp><p:txBody><a:p><a:r><a:t>Liquid Glass User Experience</a:t></a:r></a:p></p:txBody></p:sp>
      <p:sp><p:txBody>
        <a:p><a:r><a:t>• Soft translucent floating navigation surfaces</a:t></a:r></a:p>
        <a:p><a:r><a:t>• Distraction-free single tap reading immersion</a:t></a:r></a:p>
        <a:p><a:r><a:t>• Spring-based gesture transitions</a:t></a:r></a:p>
        <a:p><a:r><a:t>• Adaptive reading themes: Paper, Sepia, Dark, AMOLED</a:t></a:r></a:p>
      </p:txBody></p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
  );

  return await zip.generateAsync({ type: 'uint8array' });
}

/**
 * Creates sample Markdown document.
 */
function createSampleMarkdown(): string {
  return `# Paperwren Engine Specification
**Document Version:** 1.0.0-PROD  
**Target Platform:** Android 16 (API Level 36)  
**Package:** \`com.paperwren.documentreader\`  
**Offline Status:** Verified 100% Functional  

---

## 1. Executive Summary

Paperwren is designed as an uncompromising offline-first document workstation for mobile devices. Unlike conventional reader applications that offload rendering to remote servers or wrap heavyweight WebViews, Paperwren executes all parsing locally via native primitives:

- **PDF:** Native \`android.graphics.pdf.PdfRenderer\` with LRU tiled bitmap memory cache.
- **Office Docs:** Memory-bounded OpenXML AST parsing.
- **Spreadsheets:** Streaming cell row virtualization with frozen coordinate headers.
- **Presentations:** Slide card navigation and full-screen presenter canvas.

---

## 2. Architecture & Design Patterns

\`\`\`
┌────────────────────────────────────────────────────────┐
│               Jetpack Compose Material 3               │
│         (Liquid Glass Translucent Reader Shell)        │
└───────────────────────────▲────────────────────────────┘
                            │ StateFlow / Coroutines
┌───────────────────────────┴────────────────────────────┐
│                    DocumentViewModel                   │
└─────────────▲────────────────────────────▲─────────────┘
              │                            │
┌─────────────┴───────────┐    ┌───────────┴─────────────┐
│    Room Persistence     │    │   DocumentEngineFactory │
│ (Documents, History, BM)│    │  (PDF, DOCX, XLSX, PPTX)│
└─────────────────────────┘    └─────────────────────────┘
\`\`\`

### Room Database Schema
- \`DocumentEntity\`: id, uri, displayName, format, sizeBytes, pageCount, lastPageRead, isFavorite.
- \`ReadingHistoryEntity\`: id, documentId, openedAt, progressPercent.
- \`BookmarkEntity\`: id, documentId, pageNumber, label, createdAt.

---

## 3. Supported Formats & Verified Status

| Format | Extension | Compatibility Level | Tested on Moto G45 |
| :--- | :--- | :--- | :--- |
| **PDF** | \`.pdf\` | **Fully Rendered** | Passed (120 FPS) |
| **DOCX** | \`.docx\` | **Partially Rendered** | Passed |
| **XLSX** | \`.xlsx\` | **Partially Rendered** | Passed |
| **PPTX** | \`.pptx\` | **Partially Rendered** | Passed |
| **TXT** | \`.txt\` | **Fully Rendered** | Passed |
| **Markdown** | \`.md\` | **Fully Rendered** | Passed |
| **CSV** | \`.csv\` | **Fully Rendered** | Passed |

---

## 4. Privacy Guarantee

1. No network requests are ever dispatched.
2. Documents remain within local device storage.
3. No tracking cookies, analytics identifiers, or third-party SDKs.
`;
}

/**
 * Creates sample CSV data.
 */
function createSampleCsv(): string {
  return `ID,Timestamp,Document_Format,File_Size_KB,Parse_Latency_MS,Memory_Footprint_MB,Battery_Impact_Pct,Status
PW-101,2026-11-02 08:15:22,PDF,4280,112,38.2,0.02,OK
PW-102,2026-11-02 08:16:04,DOCX,840,48,22.4,0.01,OK
PW-103,2026-11-02 08:17:30,XLSX,1920,85,31.0,0.01,OK
PW-104,2026-11-02 08:19:11,PPTX,6400,160,45.8,0.03,OK
PW-105,2026-11-02 08:21:45,TXT,120,4,8.1,0.00,OK
PW-106,2026-11-02 08:23:02,CSV,350,14,12.5,0.00,OK
PW-107,2026-11-02 08:25:19,PDF,12500,240,52.1,0.04,OK
PW-108,2026-11-02 08:26:40,DOCX,2150,92,26.7,0.01,OK
PW-109,2026-11-02 08:28:15,XLSX,5200,180,44.2,0.02,OK
PW-110,2026-11-02 08:30:00,MD,65,3,6.4,0.00,OK`;
}

/**
 * Creates sample Plaintext document.
 */
function createSampleTxt(): string {
  return `PAPERWREN DOCUMENT VIEWER
Release Notes & Local License
==================================================

Version: 1.0.0-PROD
Build: 2026.11.02
Target: Android 16 (Vanilla Ice Cream / Baklava)
Device Profile: Motorola Moto G45 5G (8GB RAM)

Core Principles:
1. Native offline-first document rendering.
2. Complete privacy: No internet permission in AndroidManifest.xml.
3. Liquid Glass design language paired with native Material 3.
4. Reliable performance under low-RAM conditions.

Shortcuts & Reader Gestures:
- Single tap center: Toggle distraction-free reading mode.
- Double tap: Quick zoom 2x / Reset zoom.
- Pinch: Continuous zoom from 50% to 400%.
- Swipe horizontally / vertically: Page flip according to continuous scroll setting.
- Long press: Text selection and copy to clipboard.

All test suites verified and passing.`;
}

/**
 * Initializes default sample documents into the database if the library is empty.
 */
export async function seedSampleDocumentsIfEmpty(
  existingDocs: DocumentItem[],
  saveDocFn: (doc: DocumentItem) => Promise<void>
): Promise<DocumentItem[]> {
  if (existingDocs.length > 0) {
    return existingDocs;
  }

  const now = Date.now();

  // 1. PDF Sample
  const pdfBytes = createSamplePdfBinary();
  const pdfBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const pdfHash = await calculateSha256(pdfBlob);
  const pdfDoc: DocumentItem = {
    id: 'sample_pdf_master_docs',
    name: 'Master Documents Architecture Specification.pdf',
    format: 'pdf',
    extension: '.pdf',
    sizeBytes: pdfBytes.length,
    importedAt: now - 3600000 * 5,
    lastOpenedAt: now - 600000,
    isFavorite: true,
    pageCount: 3,
    lastPageRead: 1,
    mimeType: 'application/pdf',
    contentHash: pdfHash,
    fileBlob: pdfBlob,
    bookmarks: [
      {
        id: 'bm_sample_1',
        documentId: 'sample_pdf_master_docs',
        pageNumber: 1,
        label: 'Product Overview & Standards',
        createdAt: now - 3600000 * 4,
      },
      {
        id: 'bm_sample_2',
        documentId: 'sample_pdf_master_docs',
        pageNumber: 2,
        label: 'Storage Access & Compatibility',
        createdAt: now - 3600000 * 2,
      },
    ],
    metadata: {
      title: 'Master Documents Architecture Specification',
      author: 'Master Documents Engineering Team',
    },
  };

  // 2. DOCX Sample
  const docxBytes = await createSampleDocxBinary();
  const docxBlob = new Blob([docxBytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const docxHash = await calculateSha256(docxBlob);
  const docxDoc: DocumentItem = {
    id: 'sample_docx_proposal',
    name: 'Master Documents Architecture Proposal.docx',
    format: 'docx',
    extension: '.docx',
    sizeBytes: docxBytes.length,
    importedAt: now - 3600000 * 12,
    lastOpenedAt: now - 3600000 * 2,
    isFavorite: true,
    pageCount: 2,
    lastPageRead: 1,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    contentHash: docxHash,
    fileBlob: docxBlob,
    metadata: {
      title: 'Master Documents Architecture Proposal',
      wordCount: 280,
    },
  };

  // 3. XLSX Sample
  const xlsxBytes = createSampleXlsxBinary();
  const xlsxBlob = new Blob([xlsxBytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const xlsxHash = await calculateSha256(xlsxBlob);
  const xlsxDoc: DocumentItem = {
    id: 'sample_xlsx_metrics',
    name: 'Q2026 Engine Benchmarks & Performance.xlsx',
    format: 'xlsx',
    extension: '.xlsx',
    sizeBytes: xlsxBytes.length,
    importedAt: now - 3600000 * 24,
    lastOpenedAt: now - 3600000 * 8,
    isFavorite: false,
    pageCount: 3,
    lastPageRead: 1,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    contentHash: xlsxHash,
    fileBlob: xlsxBlob,
    metadata: {
      sheetNames: ['Quarterly Metrics', 'Device Benchmarks', 'Format Capabilities'],
    },
  };

  // 4. PPTX Sample
  const pptxBytes = await createSamplePptxBinary();
  const pptxBlob = new Blob([pptxBytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
  const pptxHash = await calculateSha256(pptxBlob);
  const pptxDoc: DocumentItem = {
    id: 'sample_pptx_deck',
    name: 'Master Documents Presentation Deck.pptx',
    format: 'pptx',
    extension: '.pptx',
    sizeBytes: pptxBytes.length,
    importedAt: now - 3600000 * 48,
    lastOpenedAt: now - 3600000 * 24,
    isFavorite: true,
    pageCount: 3,
    lastPageRead: 1,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    contentHash: pptxHash,
    fileBlob: pptxBlob,
    metadata: {
      title: 'Master Documents Viewer',
      slideCount: 3,
    },
  };

  // 5. Markdown Sample
  const mdText = createSampleMarkdown();
  const mdBlob = new Blob([mdText], { type: 'text/markdown' });
  const mdHash = await calculateSha256(mdBlob);
  const mdDoc: DocumentItem = {
    id: 'sample_md_spec',
    name: 'Technical Specification Guide.md',
    format: 'md',
    extension: '.md',
    sizeBytes: mdBlob.size,
    importedAt: now - 3600000 * 60,
    lastOpenedAt: now - 3600000 * 40,
    isFavorite: false,
    pageCount: 1,
    lastPageRead: 1,
    mimeType: 'text/markdown',
    contentHash: mdHash,
    fileBlob: mdBlob,
  };

  // 6. CSV Sample
  const csvText = createSampleCsv();
  const csvBlob = new Blob([csvText], { type: 'text/csv' });
  const csvHash = await calculateSha256(csvBlob);
  const csvDoc: DocumentItem = {
    id: 'sample_csv_telemetry',
    name: 'Device_Parser_Benchmark_Run.csv',
    format: 'csv',
    extension: '.csv',
    sizeBytes: csvBlob.size,
    importedAt: now - 3600000 * 72,
    lastOpenedAt: now - 3600000 * 50,
    isFavorite: false,
    pageCount: 1,
    lastPageRead: 1,
    mimeType: 'text/csv',
    contentHash: csvHash,
    fileBlob: csvBlob,
  };

  // 7. TXT Sample
  const txtText = createSampleTxt();
  const txtBlob = new Blob([txtText], { type: 'text/plain' });
  const txtHash = await calculateSha256(txtBlob);
  const txtDoc: DocumentItem = {
    id: 'sample_txt_readme',
    name: 'Paperwren Release Notes.txt',
    format: 'txt',
    extension: '.txt',
    sizeBytes: txtBlob.size,
    importedAt: now - 3600000 * 96,
    lastOpenedAt: now - 3600000 * 90,
    isFavorite: false,
    pageCount: 1,
    lastPageRead: 1,
    mimeType: 'text/plain',
    contentHash: txtHash,
    fileBlob: txtBlob,
  };

  const sampleList = [pdfDoc, docxDoc, xlsxDoc, pptxDoc, mdDoc, csvDoc, txtDoc];

  for (const doc of sampleList) {
    await saveDocFn(doc);
  }

  return sampleList;
}
