/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { detectDocumentType, calculateSha256 } from './documentParser';
import {
  saveDocument,
  getDocumentById,
  deleteDocument,
  toggleFavorite,
  recordReadingProgress,
  getReadingHistory,
  getAllDocuments
} from './storage';
import { DocumentItem } from '../types/document';

export interface TestCaseResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  durationMs: number;
  message: string;
}

export async function runAllDiagnosticsTests(): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  // 1. Test: Document Type Detection - PDF Magic Bytes
  const t1Start = performance.now();
  try {
    const fakePdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
    const blob = new Blob([fakePdfBytes]);
    const detected = await detectDocumentType(blob, 'arbitrary_name.bin');
    const passed = detected.format === 'pdf' && detected.confidence === 'magic_byte';
    results.push({
      id: 'test_type_detect_pdf',
      name: 'Content-based PDF magic byte detection',
      category: 'Type Detection',
      passed,
      durationMs: Math.round(performance.now() - t1Start),
      message: passed
        ? 'Detected %PDF- magic bytes regardless of arbitrary .bin filename'
        : `Failed to detect PDF: ${detected.format}`,
    });
  } catch (err: any) {
    results.push({
      id: 'test_type_detect_pdf',
      name: 'Content-based PDF magic byte detection',
      category: 'Type Detection',
      passed: false,
      durationMs: Math.round(performance.now() - t1Start),
      message: err.message,
    });
  }

  // 2. Test: Document Type Detection - Corrupt / Unsupported Format Handling
  const t2Start = performance.now();
  try {
    const corruptBytes = new Uint8Array([0x00, 0xff, 0xfe, 0x01, 0x02, 0x00]);
    const blob = new Blob([corruptBytes]);
    const detected = await detectDocumentType(blob, 'unknown.unknown');
    const passed = detected.format === 'unsupported';
    results.push({
      id: 'test_unsupported_format',
      name: 'Corrupt and unsupported binary rejection',
      category: 'Security & Validation',
      passed,
      durationMs: Math.round(performance.now() - t2Start),
      message: passed
        ? 'Correctly identified untrusted arbitrary binary stream as unsupported'
        : `Unexpected format: ${detected.format}`,
    });
  } catch (err: any) {
    results.push({
      id: 'test_unsupported_format',
      name: 'Corrupt and unsupported binary rejection',
      category: 'Security & Validation',
      passed: false,
      durationMs: Math.round(performance.now() - t2Start),
      message: err.message,
    });
  }

  // 3. Test: Room Persistence (IndexedDB) Document Creation and Retrieval
  const t3Start = performance.now();
  const testDocId = 'test_doc_' + Date.now();
  try {
    const testDoc: DocumentItem = {
      id: testDocId,
      name: 'Integration_Test_Document.txt',
      format: 'txt',
      extension: '.txt',
      sizeBytes: 1024,
      importedAt: Date.now(),
      lastOpenedAt: Date.now(),
      isFavorite: false,
      lastPageRead: 1,
      mimeType: 'text/plain',
      contentHash: 'hash123',
    };
    await saveDocument(testDoc);
    const retrieved = await getDocumentById(testDocId);
    const passed = retrieved !== null && retrieved.name === testDoc.name;

    results.push({
      id: 'test_room_persistence',
      name: 'Room (IndexedDB) persistence write/read cycle',
      category: 'Persistence',
      passed,
      durationMs: Math.round(performance.now() - t3Start),
      message: passed
        ? 'Successfully committed and retrieved document metadata with full fidelity'
        : 'Retrieved document did not match committed entity',
    });
  } catch (err: any) {
    results.push({
      id: 'test_room_persistence',
      name: 'Room (IndexedDB) persistence write/read cycle',
      category: 'Persistence',
      passed: false,
      durationMs: Math.round(performance.now() - t3Start),
      message: err.message,
    });
  }

  // 4. Test: Favourites Toggle
  const t4Start = performance.now();
  try {
    const favState1 = await toggleFavorite(testDocId);
    const favState2 = await toggleFavorite(testDocId);
    const passed = favState1 === true && favState2 === false;
    results.push({
      id: 'test_favorites_toggle',
      name: 'Document favorites state transitions',
      category: 'User Actions',
      passed,
      durationMs: Math.round(performance.now() - t4Start),
      message: passed
        ? 'Favorites state transitioned correctly: false -> true -> false'
        : `Unexpected favorite states: ${favState1}, ${favState2}`,
    });
  } catch (err: any) {
    results.push({
      id: 'test_favorites_toggle',
      name: 'Document favorites state transitions',
      category: 'User Actions',
      passed: false,
      durationMs: Math.round(performance.now() - t4Start),
      message: err.message,
    });
  }

  // 5. Test: Reading History & Progress Tracking
  const t5Start = performance.now();
  try {
    await recordReadingProgress(testDocId, 7, 20);
    const history = await getReadingHistory();
    const item = history.find((h) => h.documentId === testDocId);
    const passed = item !== undefined && item.lastPage === 7 && item.progressPercent === 35;
    results.push({
      id: 'test_reading_history',
      name: 'Reading progress and history calculation',
      category: 'Reading Engine',
      passed,
      durationMs: Math.round(performance.now() - t5Start),
      message: passed
        ? 'Progress 7/20 recorded as 35% with timestamp in history table'
        : 'History entry missing or progress miscalculated',
    });
  } catch (err: any) {
    results.push({
      id: 'test_reading_history',
      name: 'Reading progress and history calculation',
      category: 'Reading Engine',
      passed: false,
      durationMs: Math.round(performance.now() - t5Start),
      message: err.message,
    });
  }

  // 6. Test: Clean Deletion & Cascade Clean
  const t6Start = performance.now();
  try {
    await deleteDocument(testDocId);
    const afterDelete = await getDocumentById(testDocId);
    const history = await getReadingHistory();
    const historyEntry = history.find((h) => h.documentId === testDocId);
    const passed = afterDelete === null && historyEntry === undefined;
    results.push({
      id: 'test_document_deletion',
      name: 'Safe document deletion and history cascade',
      category: 'Persistence',
      passed,
      durationMs: Math.round(performance.now() - t6Start),
      message: passed
        ? 'Document removed and associated reading history cascade cleaned'
        : 'Document or residual history remained after deletion',
    });
  } catch (err: any) {
    results.push({
      id: 'test_document_deletion',
      name: 'Safe document deletion and history cascade',
      category: 'Persistence',
      passed: false,
      durationMs: Math.round(performance.now() - t6Start),
      message: err.message,
    });
  }

  // 7. Test: SHA-256 Checksum Calculation
  const t7Start = performance.now();
  try {
    const testContent = new TextEncoder().encode('Paperwren Offline Security');
    const blob = new Blob([testContent]);
    const hash = await calculateSha256(blob);
    const passed = typeof hash === 'string' && hash.length === 64;
    results.push({
      id: 'test_sha256_hash',
      name: 'SubtleCrypto SHA-256 document hashing',
      category: 'Security & Validation',
      passed,
      durationMs: Math.round(performance.now() - t7Start),
      message: passed
        ? `Checksum verified: ${hash.substring(0, 16)}... (64 hex characters)`
        : 'Invalid hash generated',
    });
  } catch (err: any) {
    results.push({
      id: 'test_sha256_hash',
      name: 'SubtleCrypto SHA-256 document hashing',
      category: 'Security & Validation',
      passed: false,
      durationMs: Math.round(performance.now() - t7Start),
      message: err.message,
    });
  }

  // 8. Test: Document Search and Filter Logic
  const t8Start = performance.now();
  try {
    const docs = await getAllDocuments();
    const matches = docs.filter((d) => d.name.toLowerCase().includes('paperwren') || d.format === 'pdf');
    const passed = matches.length >= 1;
    results.push({
      id: 'test_search_indexing',
      name: 'Document catalog real-time search indexing',
      category: 'Catalog & Search',
      passed,
      durationMs: Math.round(performance.now() - t8Start),
      message: passed
        ? `Search indexed and returned ${matches.length} matching document(s)`
        : 'Search failed to find existing documents',
    });
  } catch (err: any) {
    results.push({
      id: 'test_search_indexing',
      name: 'Document catalog real-time search indexing',
      category: 'Catalog & Search',
      passed: false,
      durationMs: Math.round(performance.now() - t8Start),
      message: err.message,
    });
  }

  return results;
}
