package com.paperwren.documentreader.engine

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import android.util.LruCache
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

class PdfRendererEngine(
    private val context: Context,
    private val uri: Uri
) : AutoCloseable {

    private var pfd: ParcelFileDescriptor? = null
    private var pdfRenderer: PdfRenderer? = null
    private var tempFile: File? = null

    // LRU Bitmap cache: max 1/8th of available app memory (~32MB on Motorola Moto G45)
    private val maxMemory = (Runtime.getRuntime().maxMemory() / 1024).toInt()
    private val cacheSize = maxMemory / 8
    private val bitmapCache = object : LruCache<Int, Bitmap>(cacheSize) {
        override fun sizeOf(key: Int, bitmap: Bitmap): Int {
            return bitmap.byteCount / 1024
        }
    }

    suspend fun initialize(): Int = withContext(Dispatchers.IO) {
        val inputStream = context.contentResolver.openInputStream(uri)
            ?: throw IllegalStateException("Cannot open document URI")

        // Copy SAF stream to private cache directory for random-access ParcelFileDescriptor
        val temp = File(context.cacheDir, "pdf_render_${System.currentTimeMillis()}.tmp")
        tempFile = temp

        FileOutputStream(temp).use { output ->
            inputStream.copyTo(output)
        }

        val descriptor = ParcelFileDescriptor.open(temp, ParcelFileDescriptor.MODE_READ_ONLY)
        pfd = descriptor
        val renderer = PdfRenderer(descriptor)
        pdfRenderer = renderer
        return@withContext renderer.pageCount
    }

    val pageCount: Int
        get() = pdfRenderer?.pageCount ?: 0

    suspend fun renderPage(pageIndex: Int, targetWidth: Int, targetHeight: Int): Bitmap? =
        withContext(Dispatchers.Default) {
            val cached = bitmapCache.get(pageIndex)
            if (cached != null && !cached.isRecycled) {
                return@withContext cached
            }

            val renderer = pdfRenderer ?: return@withContext null
            if (pageIndex < 0 || pageIndex >= renderer.pageCount) return@withContext null

            synchronized(renderer) {
                var page: PdfRenderer.Page? = null
                try {
                    page = renderer.openPage(pageIndex)
                    val width = if (targetWidth > 0) targetWidth else page.width
                    val height = if (targetHeight > 0) targetHeight else page.height

                    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                    bitmap.eraseColor(Color.WHITE)

                    page.render(
                        bitmap,
                        null,
                        null,
                        PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY
                    )

                    bitmapCache.put(pageIndex, bitmap)
                    return@withContext bitmap
                } catch (e: Exception) {
                    return@withContext null
                } finally {
                    page?.close()
                }
            }
        }

    fun clearCache() {
        bitmapCache.evictAll()
    }

    override fun close() {
        clearCache()
        pdfRenderer?.close()
        pdfRenderer = null
        pfd?.close()
        pfd = null
        tempFile?.delete()
    }
}
