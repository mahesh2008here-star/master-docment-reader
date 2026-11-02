package com.paperwren.documentreader.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class DocumentFormat {
    PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, TXT, MD, CSV, RTF, IMAGE, UNSUPPORTED
}

@Entity(tableName = "documents")
data class DocumentEntity(
    @PrimaryKey
    val id: String,
    val uriString: String,
    val displayName: String,
    val format: DocumentFormat,
    val sizeBytes: Long,
    val importedAt: Long,
    val lastOpenedAt: Long,
    val isFavorite: Boolean = false,
    val pageCount: Int = 1,
    val lastPageRead: Int = 1,
    val sha256Checksum: String = "",
    val thumbnailPath: String? = null
)

@Entity(tableName = "bookmarks")
data class BookmarkEntity(
    @PrimaryKey
    val id: String,
    val documentId: String,
    val pageNumber: Int,
    val label: String,
    val createdAt: Long
)

@Entity(tableName = "reading_history")
data class ReadingHistoryEntity(
    @PrimaryKey
    val id: String,
    val documentId: String,
    val documentTitle: String,
    val format: DocumentFormat,
    val lastOpenedAt: Long,
    val pageNumber: Int,
    val totalPages: Int,
    val progressPercent: Int
)
