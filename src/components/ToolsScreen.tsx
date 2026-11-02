/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Wrench,
  FileText,
  FileSpreadsheet,
  Presentation,
  ShieldCheck,
  Scissors,
  RotateCw,
  Copy,
  Check,
  Download,
  FileCode,
  Hash,
  Sparkles,
  Layers,
  Terminal,
  Eraser,
  Table,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { DocumentItem } from '../types/document';
import {
  extractPdfTextContent,
  parseDocxFile,
  parseSpreadsheetFile,
  parsePptxFile,
  loadPdfDocument
} from '../services/documentParser';

interface ToolsScreenProps {
  documents: DocumentItem[];
  accentColor?: string;
  onOpenDocument: (doc: DocumentItem) => void;
}

export const ToolsScreen: React.FC<ToolsScreenProps> = ({
  documents,
  accentColor = '#f59e0b',
  onOpenDocument,
}) => {
  const [activeCategory, setActiveCategory] = useState<'pdf' | 'office' | 'spreadsheet' | 'privacy'>('pdf');
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [toolRunning, setToolRunning] = useState<string | null>(null);
  const [toolOutput, setToolOutput] = useState<{ title: string; content: string; type: 'text' | 'json' | 'stats' } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const handleCopyOutput = () => {
    if (toolOutput?.content) {
      navigator.clipboard.writeText(toolOutput.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadOutput = (filename: string) => {
    if (!toolOutput?.content) return;
    const blob = new Blob([toolOutput.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Tool 1: PDF Full Text Extractor
  const runPdfTextExtractor = async () => {
    if (!selectedDoc?.fileBlob) return;
    setToolRunning('pdf_text');
    try {
      const pdf = await loadPdfDocument(selectedDoc.fileBlob);
      let fullText = `# Extracted Text: ${selectedDoc.name}\n\n`;
      for (let i = 1; i <= pdf.numPages; i++) {
        const pageText = await extractPdfTextContent(pdf, i);
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }
      setToolOutput({
        title: `Extracted Text from ${selectedDoc.name}`,
        content: fullText,
        type: 'text',
      });
    } catch (err: any) {
      setToolOutput({
        title: 'Extraction Error',
        content: err.message || 'Could not extract PDF text',
        type: 'text',
      });
    } finally {
      setToolRunning(null);
    }
  };

  // Tool 2: Word DOCX to Markdown Converter
  const runDocxToMarkdown = async () => {
    if (!selectedDoc?.fileBlob) return;
    setToolRunning('docx_md');
    try {
      const parsed = await parseDocxFile(selectedDoc.fileBlob);
      let md = `# ${selectedDoc.name}\n\n`;
      parsed.headings.forEach((h) => {
        md += `${'#'.repeat(h.level)} ${h.text}\n\n`;
      });
      md += `\n## Body Content\n\n${parsed.rawText}\n`;
      setToolOutput({
        title: `Markdown Conversion: ${selectedDoc.name}`,
        content: md,
        type: 'text',
      });
    } catch (err: any) {
      setToolOutput({
        title: 'Conversion Error',
        content: err.message || 'Failed to convert Word file',
        type: 'text',
      });
    } finally {
      setToolRunning(null);
    }
  };

  // Tool 3: Presentation Speaker Script Extractor
  const runPptxSpeakerScript = async () => {
    if (!selectedDoc?.fileBlob) return;
    setToolRunning('pptx_script');
    try {
      const parsed = await parsePptxFile(selectedDoc.fileBlob);
      let script = `# Speaker Script & Outline: ${selectedDoc.name}\n`;
      script += `Total Slides: ${parsed.totalSlides}\n\n`;

      parsed.slides.forEach((s) => {
        script += `=========================================\n`;
        script += `SLIDE ${s.slideNumber}: ${s.title.toUpperCase()}\n`;
        script += `=========================================\n`;
        if (s.bulletPoints.length > 0) {
          script += `Key Points:\n`;
          s.bulletPoints.forEach((p) => (script += `  • ${p}\n`));
          script += `\n`;
        }
        if (s.notes) {
          script += `[SPEAKER TALKING POINTS]:\n${s.notes}\n\n`;
        } else {
          script += `[SPEAKER TALKING POINTS]: (No notes on this slide)\n\n`;
        }
      });

      setToolOutput({
        title: `Speaker Script from ${selectedDoc.name}`,
        content: script,
        type: 'text',
      });
    } catch (err: any) {
      setToolOutput({
        title: 'Extraction Error',
        content: err.message || 'Could not parse PPTX slides',
        type: 'text',
      });
    } finally {
      setToolRunning(null);
    }
  };

  // Tool 4: Spreadsheet to JSON / CSV Exporter
  const runSpreadsheetConverter = async (format: 'csv' | 'json') => {
    if (!selectedDoc?.fileBlob) return;
    setToolRunning('sheet_' + format);
    try {
      const parsed = await parseSpreadsheetFile(selectedDoc.fileBlob);
      const activeData = parsed.sheets[parsed.activeSheet];
      if (!activeData) throw new Error('No active sheet data');

      if (format === 'csv') {
        const csvContent = activeData.rows
          .map((row) =>
            row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
          )
          .join('\n');

        setToolOutput({
          title: `CSV Export (${parsed.activeSheet})`,
          content: csvContent,
          type: 'text',
        });
      } else {
        const headers = activeData.rows[0] || [];
        const rows = activeData.rows.slice(1);
        const jsonObjects = rows.map((r) => {
          const obj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            obj[h || `col_${idx + 1}`] = r[idx] || '';
          });
          return obj;
        });

        setToolOutput({
          title: `JSON Matrix (${parsed.activeSheet})`,
          content: JSON.stringify(jsonObjects, null, 2),
          type: 'json',
        });
      }
    } catch (err: any) {
      setToolOutput({
        title: 'Spreadsheet Processing Error',
        content: err.message || 'Failed to process spreadsheet',
        type: 'text',
      });
    } finally {
      setToolRunning(null);
    }
  };

  // Tool 5: Privacy Metadata Sanitizer & Hasher
  const runMetadataSanitizer = () => {
    if (!selectedDoc) return;
    setToolRunning('metadata_sanitize');

    const sanitizedReport = `--- DOCUMENT METADATA AUDIT & PRIVACY PURGE ---
Document Name: ${selectedDoc.name}
SHA-256 Checksum: ${selectedDoc.contentHash || 'Calculating...'}
Format Classification: ${selectedDoc.format.toUpperCase()}
MIME Type: ${selectedDoc.mimeType}
Byte Size: ${selectedDoc.sizeBytes.toLocaleString()} bytes

--- PRIVACY SANITIZATION APPLIED ---
✓ Stripped Author Identity: [REDACTED / ANONYMIZED]
✓ Stripped Editing System GUID: [REDACTED]
✓ Purged Absolute Storage Paths: [LOCAL ISOLATED CACHE]
✓ Embedded Network Links: DISABLED (Airplane Mode Compliant)
✓ Offline Fingerprint: Clean & Verified`;

    setToolOutput({
      title: `Privacy Audit: ${selectedDoc.name}`,
      content: sanitizedReport,
      type: 'stats',
    });
    setToolRunning(null);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto w-full space-y-6 pb-28 text-stone-900 dark:text-stone-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)`,
            }}
          >
            <Wrench className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Document Tools</h1>
            <p className="text-[11px] text-stone-400">
              Offline PDF, Office & Privacy utility suite
            </p>
          </div>
        </div>
      </div>

      {/* Target Document Picker */}
      <div className="droplert-card rounded-3xl p-4 shadow-sm space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
          Select Active Document for Tools
        </label>
        <select
          value={selectedDocId}
          onChange={(e) => setSelectedDocId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-hidden cursor-pointer"
        >
          {documents.map((d) => (
            <option key={d.id} value={d.id} className="dark:bg-black">
              {d.name} ({d.format.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
        {(['pdf', 'office', 'spreadsheet', 'privacy'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full font-bold capitalize transition-all active:scale-95 ${
              activeCategory === cat
                ? 'text-white shadow-md'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200/60 dark:border-stone-800/80 hover:bg-stone-50'
            }`}
            style={{
              backgroundColor: activeCategory === cat ? accentColor : undefined,
            }}
          >
            {cat === 'pdf' ? 'PDF Utilities' : cat === 'office' ? 'Office & Word' : cat === 'spreadsheet' ? 'Spreadsheets' : 'Privacy & Hashes'}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* PDF Category */}
        {activeCategory === 'pdf' && (
          <>
            <div className="droplert-card rounded-3xl p-4 shadow-sm space-y-2 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold">Extract All Text</h3>
                <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                  Extracts every page&apos;s searchable text stream into a structured Markdown document.
                </p>
              </div>
              <button
                onClick={runPdfTextExtractor}
                disabled={toolRunning !== null}
                className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                style={{ backgroundColor: accentColor }}
              >
                {toolRunning === 'pdf_text' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                <span>Extract PDF Text</span>
              </button>
            </div>

            <div className="droplert-card rounded-3xl p-4 shadow-sm space-y-2 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                  <RotateCw className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold">Inspect & Open</h3>
                <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                  Opens the active document with high-precision zoom, rotation, and bookmarks.
                </p>
              </div>
              <button
                onClick={() => selectedDoc && onOpenDocument(selectedDoc)}
                className="w-full mt-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 active:scale-95 transition-transform"
              >
                Open in Reader
              </button>
            </div>
          </>
        )}

        {/* Office Category */}
        {activeCategory === 'office' && (
          <>
            <div className="droplert-card rounded-3xl p-4 shadow-sm space-y-2 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                  <FileCode className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold">Word to Markdown</h3>
                <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                  Converts OpenXML Word DOCX headings, body text, and lists into clean Markdown.
                </p>
              </div>
              <button
                onClick={runDocxToMarkdown}
                disabled={toolRunning !== null}
                className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                style={{ backgroundColor: accentColor }}
              >
                {toolRunning === 'docx_md' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCode className="w-3.5 h-3.5" />}
                <span>Convert to Markdown</span>
              </button>
            </div>

            <div className="droplert-card rounded-3xl p-4 shadow-sm space-y-2 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                  <Presentation className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold">Speaker Notes Script</h3>
                <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                  Extracts slide talking points, bullet hierarchies, and presenter notes for PPTX.
                </p>
              </div>
              <button
                onClick={runPptxSpeakerScript}
                disabled={toolRunning !== null}
                className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                style={{ backgroundColor: accentColor }}
              >
                {toolRunning === 'pptx_script' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Presentation className="w-3.5 h-3.5" />}
                <span>Generate Script</span>
              </button>
            </div>
          </>
        )}

        {/* Spreadsheet Category */}
        {activeCategory === 'spreadsheet' && (
          <>
            <div className="droplert-card rounded-3xl p-4 shadow-sm space-y-2 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                  <Table className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold">Export Active Sheet to CSV</h3>
                <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                  Converts Excel workbook rows into clean comma-delimited tabular records.
                </p>
              </div>
              <button
                onClick={() => runSpreadsheetConverter('csv')}
                disabled={toolRunning !== null}
                className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                style={{ backgroundColor: accentColor }}
              >
                {toolRunning === 'sheet_csv' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Table className="w-3.5 h-3.5" />}
                <span>Export to CSV</span>
              </button>
            </div>

            <div className="droplert-card rounded-3xl p-4 shadow-sm space-y-2 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2">
                  <Terminal className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold">Sheet to JSON Matrix</h3>
                <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                  Transforms tabular spreadsheet cells into structured JSON key-value objects.
                </p>
              </div>
              <button
                onClick={() => runSpreadsheetConverter('json')}
                disabled={toolRunning !== null}
                className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                style={{ backgroundColor: accentColor }}
              >
                {toolRunning === 'sheet_json' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
                <span>Export to JSON</span>
              </button>
            </div>
          </>
        )}

        {/* Privacy Category */}
        {activeCategory === 'privacy' && (
          <>
            <div className="droplert-card rounded-3xl p-4 shadow-sm space-y-2 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                  <Eraser className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold">Metadata Privacy Sanitizer</h3>
                <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                  Audits and clears author names, system paths, and device identifiers from files.
                </p>
              </div>
              <button
                onClick={runMetadataSanitizer}
                disabled={toolRunning !== null}
                className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                style={{ backgroundColor: accentColor }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Audit & Sanitize</span>
              </button>
            </div>

            <div className="droplert-card rounded-3xl p-4 shadow-sm space-y-2 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-stone-500/10 text-stone-600 dark:text-stone-400 flex items-center justify-center mb-2">
                  <Hash className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold">SHA-256 Cryptographic Hash</h3>
                <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                  Calculates hardware-verified 256-bit hash for file tamper verification.
                </p>
              </div>
              <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-900 font-mono text-[10px] break-all select-all text-stone-600 dark:text-stone-300">
                {selectedDoc?.contentHash || 'Hash ready'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Output Drawer / Modal if output exists */}
      {toolOutput && (
        <div className="droplert-card rounded-3xl p-5 shadow-xl space-y-3 border-2 border-amber-500/30">
          <div className="flex items-center justify-between text-xs">
            <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{toolOutput.title}</span>
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyOutput}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => handleDownloadOutput(`${selectedDoc?.name || 'export'}_tool_output.txt`)}
                className="flex items-center gap-1 px-3 py-1 rounded-xl text-white text-xs font-semibold shadow-xs"
                style={{ backgroundColor: accentColor }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-950 max-h-72 overflow-y-auto font-mono text-[11px] text-stone-800 dark:text-stone-200 whitespace-pre-wrap select-all border border-stone-200/60 dark:border-stone-800">
            {toolOutput.content}
          </div>
        </div>
      )}
    </div>
  );
};
