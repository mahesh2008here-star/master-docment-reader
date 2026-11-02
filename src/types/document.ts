/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DocumentFormat = 
  | 'pdf'
  | 'docx'
  | 'doc'
  | 'xlsx'
  | 'xls'
  | 'pptx'
  | 'ppt'
  | 'txt'
  | 'md'
  | 'csv'
  | 'rtf'
  | 'image'
  | 'unsupported';

export type CompatibilityLevel = 
  | 'fully_rendered'
  | 'partially_rendered'
  | 'text_extraction_only'
  | 'unsupported';

export interface FormatCompatibilityInfo {
  format: DocumentFormat;
  displayName: string;
  extension: string;
  compatibilityLevel: CompatibilityLevel;
  engineDescription: string;
  capabilities: string[];
  limitations: string[];
}

export interface DocumentItem {
  id: string;
  name: string;
  format: DocumentFormat;
  extension: string;
  sizeBytes: number;
  importedAt: number;
  lastOpenedAt: number;
  isFavorite: boolean;
  isVaulted?: boolean;
  pageCount?: number;
  lastPageRead: number;
  thumbnailDataUrl?: string;
  fileBlob?: Blob;
  mimeType: string;
  contentHash?: string;
  bookmarks?: BookmarkItem[];
  metadata?: {
    author?: string;
    title?: string;
    createdDate?: string;
    sheetNames?: string[];
    slideCount?: number;
    wordCount?: number;
  };
}

export interface BookmarkItem {
  id: string;
  documentId: string;
  pageNumber: number;
  label: string;
  createdAt: number;
}

export interface ReadingHistoryItem {
  id: string;
  documentId: string;
  documentName: string;
  format: DocumentFormat;
  openedAt: number;
  lastPage: number;
  totalPages?: number;
  progressPercent: number;
}

export type ReaderTheme = 'light' | 'dark' | 'sepia' | 'amoled';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontScale: number; // 0.8 to 1.5
  fitMode: 'fit-width' | 'fit-page' | 'original';
  rotation: number; // 0, 90, 180, 270
  continuousScroll: boolean;
  distractionFree: boolean;
  hapticFeedback: boolean;
}

export interface AppPreferences {
  themeMode: 'system' | 'light' | 'dark';
  glassEffect: boolean;
  motoG45DeviceFrame?: boolean;
  accentColor: string; // Hex color e.g. #f59e0b, #6366f1, #10b981, #ec4899, #0284c7, or custom
  storagePermissionGranted: boolean;
  defaultSortBy: 'date' | 'name' | 'size' | 'type';
  defaultSortOrder: 'asc' | 'desc';
  viewLayout: 'grid' | 'list';
  autoSaveProgress: boolean;
  vaultPin?: string; // Default 1234
  readerSettings: ReaderSettings;
}

export const COMPATIBILITY_MATRIX: Record<DocumentFormat, FormatCompatibilityInfo> = {
  pdf: {
    format: 'pdf',
    displayName: 'Portable Document Format (.pdf)',
    extension: '.pdf',
    compatibilityLevel: 'fully_rendered',
    engineDescription: 'Native Android PdfRenderer & PDF.js Vector/Canvas Engine',
    capabilities: [
      'Crisp multi-resolution raster/vector page rendering',
      'Pinch-to-zoom & double-tap zoom up to 400%',
      'Continuous vertical scrolling & page-by-page flip',
      'Text extraction & real-time keyword search',
      'In-document bookmarks & reading progress tracking',
      'Page rotation (0°, 90°, 180°, 270°)',
      'Distraction-free mode with paper/sepia/dark/AMOLED themes',
      'Password-protected document handling'
    ],
    limitations: ['Complex 3D embedded PDF models not rendered offline']
  },
  docx: {
    format: 'docx',
    displayName: 'Microsoft Word Document (.docx)',
    extension: '.docx',
    compatibilityLevel: 'partially_rendered',
    engineDescription: 'Client-side OpenXML Parser (Mammoth & custom DOM AST engine)',
    capabilities: [
      'Document structure: Heading levels (H1-H6) and paragraphs',
      'Rich typography: Bold, italic, strikethrough, underline',
      'Ordered and unordered bullet lists with nested indentations',
      'Table data layouts with cell borders and alignments',
      'Text search and multi-line selection/copy',
      'Adjustable reading typography and background themes'
    ],
    limitations: [
      'WordArt, complex SmartArt, and vector drawing canvas approximations',
      'Exact page-break layout differs from Microsoft Word desktop print preview'
    ]
  },
  doc: {
    format: 'doc',
    displayName: 'Legacy Word 97-2003 (.doc)',
    extension: '.doc',
    compatibilityLevel: 'text_extraction_only',
    engineDescription: 'Binary OLE2 Document Stream String Extractor',
    capabilities: [
      'Plain text stream extraction',
      'Paragraph separation and word search',
      'Clean readable typography'
    ],
    limitations: [
      'Binary OLE2 formatting and embedded graphics not rendered offline without server conversion'
    ]
  },
  xlsx: {
    format: 'xlsx',
    displayName: 'Microsoft Excel Spreadsheet (.xlsx)',
    extension: '.xlsx',
    compatibilityLevel: 'partially_rendered',
    engineDescription: 'Streaming SheetJS Engine with virtualized grid renderer',
    capabilities: [
      'Multi-sheet workbook selection and tab navigation',
      'Virtualized row & column grid handling thousands of cells',
      'Frozen header row simulation and cell coordinates (A1, B2)',
      'Number, date, currency, and percentage formatting presentation',
      'In-sheet real-time cell search and coordinate highlighting',
      'Cell data copy and sheet export'
    ],
    limitations: [
      'Dynamic Excel macros (VBA) and complex live calculation engine not executed',
      'Embedded Excel charts rendered as summary statistics rather than native SVG'
    ]
  },
  xls: {
    format: 'xls',
    displayName: 'Legacy Excel 97-2003 (.xls)',
    extension: '.xls',
    compatibilityLevel: 'partially_rendered',
    engineDescription: 'BIFF8 Binary Sheet Parser',
    capabilities: [
      'Multi-sheet workbook extraction and cell grid view',
      'Formatted cell values and coordinates'
    ],
    limitations: ['Formulas evaluated to pre-calculated stored values only']
  },
  pptx: {
    format: 'pptx',
    displayName: 'Microsoft PowerPoint Presentation (.pptx)',
    extension: '.pptx',
    compatibilityLevel: 'partially_rendered',
    engineDescription: 'OpenXML Presentation Slide Engine',
    capabilities: [
      'Slide-by-slide card navigation and carousel overview',
      'Slide thumbnail strip with fast jump',
      'Slide titles, body points, subtitle hierarchy',
      'Full-screen presenter / slide-reading view',
      'Slide speaker notes extraction and display',
      'Search across all slide contents'
    ],
    limitations: [
      'Complex animations, video embeds, and transitions not supported in reader view',
      'Custom vector shapes rendered with fallback bounding boxes'
    ]
  },
  ppt: {
    format: 'ppt',
    displayName: 'Legacy PowerPoint 97-2003 (.ppt)',
    extension: '.ppt',
    compatibilityLevel: 'text_extraction_only',
    engineDescription: 'Binary PowerPoint Stream Extractor',
    capabilities: ['Slide text outline and title extraction'],
    limitations: ['Slide layout and visuals unsupported in legacy binary format']
  },
  txt: {
    format: 'txt',
    displayName: 'Plain Text (.txt)',
    extension: '.txt',
    compatibilityLevel: 'fully_rendered',
    engineDescription: 'Native UTF-8/ASCII Reader with line numbers & font scaling',
    capabilities: [
      'Instant loading of any size text file',
      'Configurable monospace or serif/sans reading font',
      'Line numbering and word/character counters',
      'Search and copy'
    ],
    limitations: []
  },
  md: {
    format: 'md',
    displayName: 'Markdown Document (.md)',
    extension: '.md',
    compatibilityLevel: 'fully_rendered',
    engineDescription: 'CommonMark & GFM Markdown Renderer',
    capabilities: [
      'Headings, lists, blockquotes, code blocks with syntax styling',
      'Tables, horizontal dividers, task checkboxes',
      'Clean typography with reading progress'
    ],
    limitations: []
  },
  csv: {
    format: 'csv',
    displayName: 'Comma-Separated Values (.csv)',
    extension: '.csv',
    compatibilityLevel: 'fully_rendered',
    engineDescription: 'Streaming Delimited Table Parser',
    capabilities: [
      'Automatic delimiter detection (comma, semicolon, tab)',
      'Sortable table columns and fixed header',
      'Search across rows'
    ],
    limitations: []
  },
  rtf: {
    format: 'rtf',
    displayName: 'Rich Text Format (.rtf)',
    extension: '.rtf',
    compatibilityLevel: 'partially_rendered',
    engineDescription: 'RTF Control Word Tokenizer & Formatter',
    capabilities: ['Font styles, bold, italic, paragraph extracts'],
    limitations: ['Complex nested embedded OLE objects omitted']
  },
  image: {
    format: 'image',
    displayName: 'Image Document (.png, .jpg, .webp, .svg)',
    extension: '.png',
    compatibilityLevel: 'fully_rendered',
    engineDescription: 'High-DPI Hardware Accelerated Image Viewer',
    capabilities: [
      'Smooth pan & zoom up to 800%',
      'Metadata & dimensions display',
      'Rotation & fit to screen'
    ],
    limitations: []
  },
  unsupported: {
    format: 'unsupported',
    displayName: 'Unknown / Unsupported File',
    extension: '',
    compatibilityLevel: 'unsupported',
    engineDescription: 'Format Not Supported Offline',
    capabilities: ['Hex / raw text safe inspection preview'],
    limitations: ['Native visual rendering not available for this proprietary format']
  }
};
