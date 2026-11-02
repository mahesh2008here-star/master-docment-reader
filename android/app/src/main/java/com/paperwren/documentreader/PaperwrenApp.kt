package com.paperwren.documentreader

import android.app.Application
import com.paperwren.documentreader.data.db.PaperwrenDatabase
import com.paperwren.documentreader.data.repository.DocumentRepository

class PaperwrenApp : Application() {

    val database by lazy { PaperwrenDatabase.getDatabase(this) }
    val repository by lazy { DocumentRepository(database.documentDao(), applicationContext) }

    override fun onCreate() {
        super.onCreate()
        // Initialize memory-bounded cache configurations
    }
}
