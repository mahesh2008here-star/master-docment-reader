package com.paperwren.documentreader.data.db

import androidx.room.TypeConverter
import com.paperwren.documentreader.data.model.DocumentFormat

class AppTypeConverters {

    @TypeConverter
    fun fromDocumentFormat(format: DocumentFormat?): String? {
        return format?.name
    }

    @TypeConverter
    fun toDocumentFormat(value: String?): DocumentFormat {
        if (value.isNullOrBlank()) return DocumentFormat.UNSUPPORTED
        return try {
            DocumentFormat.valueOf(value)
        } catch (e: Exception) {
            DocumentFormat.UNSUPPORTED
        }
    }
}
