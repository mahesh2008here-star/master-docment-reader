package com.paperwren.documentreader.data.repository

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import com.paperwren.documentreader.data.dao.DocumentDao
import com.paperwren.documentreader.data.model.BookmarkEntity
import com.paperwren.documentreader.data.model.DocumentEntity
import com.paperwren.documentreader.data.model.DocumentFormat
import com.paperwren.documentreader.data.model.ReadingHistoryEntity
import com.paperwren.documentreader.engine.DocumentTypeDetector
import kotlinx.coroutines.flow.Flow
import java.util.UUID

class DocumentRepository(
    private val documentDao: DocumentDao,
    private val context: Context
) {

    val allDocuments: Flow<List<DocumentEntity>> = documentDao.getAllDocuments()
    val favoriteDocuments: Flow<List<DocumentEntity>> = documentDao.getFavoriteDocuments()
    val recentDocuments: Flow<List<DocumentEntity>> = documentDao.getRecentDocuments(8)
    val readingHistory: Flow<List<ReadingHistoryEntity>> = documentDao.getReadingHistory()

    suspend fun importDocumentFromUri(uri: Uri): DocumentEntity {
        var displayName = "Document"
        var sizeBytes = 0L

        context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
            if (cursor.moveToFirst()) {
                if (nameIndex != -1) displayName = cursor.getString(nameIndex) ?: displayName
                if (sizeIndex != -1) sizeBytes = cursor.getLong(sizeIndex)
            }
        }

        val format = DocumentTypeDetector.detectType(context, uri, displayName)
        val id = UUID.randomUUID().toString()
        val now = System.currentTimeMillis()

        val entity = DocumentEntity(
            id = id,
            uriString = uri.toString(),
            displayName = displayName,
            format = format,
            sizeBytes = sizeBytes,
            importedAt = now,
            lastOpenedAt = now,
            isFavorite = false,
            pageCount = 1,
            lastPageRead = 1
        )

        documentDao.insertDocument(entity)
        return entity
    }

    suspend fun getDocumentById(id: String): DocumentEntity? = documentDao.getDocumentById(id)

    suspend fun toggleFavorite(id: String, currentState: Boolean) {
        documentDao.updateFavorite(id, !currentState)
    }

    suspend fun updateReadingProgress(id: String, page: Int, totalPages: Int) {
        val now = System.currentTimeMillis()
        documentDao.updateReadingProgress(id, page, now)

        val doc = documentDao.getDocumentById(id) ?: return
        val progressPercent = if (totalPages > 0) (page * 100) / totalPages else 0

        documentDao.recordHistory(
            ReadingHistoryEntity(
                id = "hist_$id",
                documentId = id,
                documentTitle = doc.displayName,
                format = doc.format,
                lastOpenedAt = now,
                pageNumber = page,
                totalPages = totalPages,
                progressPercent = progressPercent
            )
        )
    }

    suspend fun renameDocument(id: String, newName: String) {
        documentDao.renameDocument(id, newName.trim())
    }

    suspend fun deleteDocument(id: String) {
        documentDao.deleteDocumentById(id)
    }

    fun getBookmarks(docId: String): Flow<List<BookmarkEntity>> =
        documentDao.getBookmarksForDocument(docId)

    suspend fun addBookmark(docId: String, pageNumber: Int, label: String) {
        val bookmark = BookmarkEntity(
            id = "bm_${System.currentTimeMillis()}",
            documentId = docId,
            pageNumber = pageNumber,
            label = label.ifBlank { "Page $pageNumber" },
            createdAt = System.currentTimeMillis()
        )
        documentDao.insertBookmark(bookmark)
    }

    suspend fun removeBookmark(bookmarkId: String) {
        documentDao.deleteBookmark(bookmarkId)
    }

    suspend fun clearHistory() {
        documentDao.clearHistory()
    }

    suspend fun seedSampleDocumentsIfEmpty() {
        val existing = documentDao.getDocumentById("sample_pdf_1")
        if (existing != null) return

        val now = System.currentTimeMillis()

        // Create sample Markdown file in cache
        val mdFile = java.io.File(context.cacheDir, "Release_Notes.md")
        try {
            mdFile.writeText(
                """
                # Master Documents v1.0.0
                
                Welcome to **Master Documents** - 100% Offline, Privacy-First Document Workstation.
                
                ## Features
                - Native PDF, Word, Excel, Slides, Markdown & Text Viewer
                - Encrypted Private File Vault (Locker)
                - Customizable Accent Color themes
                - PDF Merge, Split, Compress & Image-to-PDF Utilities
                """.trimIndent()
            )
        } catch (e: Exception) {}

        // Create sample Text file in cache
        val txtFile = java.io.File(context.cacheDir, "Design_System_Spec.txt")
        try {
            txtFile.writeText("Design System Specification for Master Documents App.\nColors: Deep Black #000000, Glass #141418, Accent Blue #3B82F6.")
        } catch (e: Exception) {}

        val mdUri = Uri.fromFile(mdFile).toString()
        val txtUri = Uri.fromFile(txtFile).toString()

        val samples = listOf(
            DocumentEntity(
                id = "sample_pdf_1",
                uriString = mdUri,
                displayName = "Project_Proposal_2026.pdf",
                format = DocumentFormat.PDF,
                sizeBytes = 245000L,
                importedAt = now,
                lastOpenedAt = now,
                isFavorite = true,
                pageCount = 12
            ),
            DocumentEntity(
                id = "sample_xlsx_1",
                uriString = txtUri,
                displayName = "Financial_Report_Q4.xlsx",
                format = DocumentFormat.XLSX,
                sizeBytes = 180000L,
                importedAt = now - 3600000,
                lastOpenedAt = now - 3600000,
                isFavorite = false,
                pageCount = 4
            ),
            DocumentEntity(
                id = "sample_docx_1",
                uriString = txtUri,
                displayName = "Design_System_Spec.docx",
                format = DocumentFormat.DOCX,
                sizeBytes = 312000L,
                importedAt = now - 7200000,
                lastOpenedAt = now - 7200000,
                isFavorite = true,
                pageCount = 8
            ),
            DocumentEntity(
                id = "sample_pptx_1",
                uriString = txtUri,
                displayName = "Presentation_Deck.pptx",
                format = DocumentFormat.PPTX,
                sizeBytes = 520000L,
                importedAt = now - 10800000,
                lastOpenedAt = now - 10800000,
                isFavorite = false,
                pageCount = 16
            ),
            DocumentEntity(
                id = "sample_md_1",
                uriString = mdUri,
                displayName = "Release_Notes.md",
                format = DocumentFormat.MD,
                sizeBytes = 12500L,
                importedAt = now - 14400000,
                lastOpenedAt = now - 14400000,
                isFavorite = false,
                pageCount = 2
            )
        )

        samples.forEach { documentDao.insertDocument(it) }
    }
}

