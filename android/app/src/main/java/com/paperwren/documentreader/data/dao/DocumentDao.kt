package com.paperwren.documentreader.data.dao

import androidx.room.*
import com.paperwren.documentreader.data.model.BookmarkEntity
import com.paperwren.documentreader.data.model.DocumentEntity
import com.paperwren.documentreader.data.model.DocumentFormat
import com.paperwren.documentreader.data.model.ReadingHistoryEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DocumentDao {

    @Query("SELECT * FROM documents ORDER BY lastOpenedAt DESC")
    fun getAllDocuments(): Flow<List<DocumentEntity>>

    @Query("SELECT * FROM documents WHERE id = :id LIMIT 1")
    suspend fun getDocumentById(id: String): DocumentEntity?

    @Query("SELECT * FROM documents WHERE isFavorite = 1 ORDER BY lastOpenedAt DESC")
    fun getFavoriteDocuments(): Flow<List<DocumentEntity>>

    @Query("SELECT * FROM documents ORDER BY lastOpenedAt DESC LIMIT :limit")
    fun getRecentDocuments(limit: Int = 10): Flow<List<DocumentEntity>>

    @Query("SELECT * FROM documents WHERE format = :format ORDER BY lastOpenedAt DESC")
    fun getDocumentsByFormat(format: DocumentFormat): Flow<List<DocumentEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDocument(document: DocumentEntity)

    @Update
    suspend fun updateDocument(document: DocumentEntity)

    @Query("DELETE FROM documents WHERE id = :id")
    suspend fun deleteDocumentById(id: String)

    @Query("UPDATE documents SET isFavorite = :isFavorite WHERE id = :id")
    suspend fun updateFavorite(id: String, isFavorite: Boolean)

    @Query("UPDATE documents SET lastPageRead = :page, lastOpenedAt = :timestamp WHERE id = :id")
    suspend fun updateReadingProgress(id: String, page: Int, timestamp: Long)

    @Query("UPDATE documents SET displayName = :newName WHERE id = :id")
    suspend fun renameDocument(id: String, newName: String)

    // Bookmarks
    @Query("SELECT * FROM bookmarks WHERE documentId = :documentId ORDER BY pageNumber ASC")
    fun getBookmarksForDocument(documentId: String): Flow<List<BookmarkEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBookmark(bookmark: BookmarkEntity)

    @Query("DELETE FROM bookmarks WHERE id = :bookmarkId")
    suspend fun deleteBookmark(bookmarkId: String)

    // Reading History
    @Query("SELECT * FROM reading_history ORDER BY lastOpenedAt DESC")
    fun getReadingHistory(): Flow<List<ReadingHistoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun recordHistory(history: ReadingHistoryEntity)

    @Query("DELETE FROM reading_history")
    suspend fun clearHistory()
}
