package com.paperwren.documentreader.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.paperwren.documentreader.data.dao.DocumentDao
import com.paperwren.documentreader.data.model.BookmarkEntity
import com.paperwren.documentreader.data.model.DocumentEntity
import com.paperwren.documentreader.data.model.ReadingHistoryEntity

@Database(
    entities = [DocumentEntity::class, BookmarkEntity::class, ReadingHistoryEntity::class],
    version = 1,
    exportSchema = false
)
abstract class PaperwrenDatabase : RoomDatabase() {

    abstract fun documentDao(): DocumentDao

    companion object {
        @Volatile
        private var INSTANCE: PaperwrenDatabase? = null

        fun getDatabase(context: Context): PaperwrenDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    PaperwrenDatabase::class.java,
                    "paperwren_room.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
