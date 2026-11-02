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
}
