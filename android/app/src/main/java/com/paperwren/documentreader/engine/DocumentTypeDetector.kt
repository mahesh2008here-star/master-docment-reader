package com.paperwren.documentreader.engine

import android.content.Context
import android.net.Uri
import com.paperwren.documentreader.data.model.DocumentFormat
import java.io.InputStream

object DocumentTypeDetector {

    /**
     * Inspects magic bytes and container structures from input stream.
     * Does not trust file extensions alone.
     */
    fun detectType(context: Context, uri: Uri, filename: String): DocumentFormat {
        val extension = filename.substringAfterLast('.', "").lowercase()

        try {
            context.contentResolver.openInputStream(uri)?.use { stream ->
                val header = ByteArray(4096)
                val bytesRead = stream.read(header)
                if (bytesRead < 4) return DocumentFormat.UNSUPPORTED

                // 1. PDF: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
                if (bytesRead >= 5 &&
                    header[0] == 0x25.toByte() &&
                    header[1] == 0x50.toByte() &&
                    header[2] == 0x44.toByte() &&
                    header[3] == 0x46.toByte() &&
                    header[4] == 0x2D.toByte()
                ) {
                    return DocumentFormat.PDF
                }

                // 2. PKZip (DOCX, XLSX, PPTX): PK\x03\x04
                if (header[0] == 0x50.toByte() &&
                    header[1] == 0x4B.toByte() &&
                    header[2] == 0x03.toByte() &&
                    header[3] == 0x04.toByte()
                ) {
                    return when (extension) {
                        "docx" -> DocumentFormat.DOCX
                        "xlsx" -> DocumentFormat.XLSX
                        "pptx" -> DocumentFormat.PPTX
                        else -> DocumentFormat.DOCX
                    }
                }

                // 3. OLE2 Compound Document (Legacy DOC, XLS, PPT)
                // 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1
                if (bytesRead >= 8 &&
                    (header[0].toInt() and 0xFF) == 0xD0 &&
                    (header[1].toInt() and 0xFF) == 0xCF &&
                    (header[2].toInt() and 0xFF) == 0x11 &&
                    (header[3].toInt() and 0xFF) == 0xE0
                ) {
                    return when (extension) {
                        "xls" -> DocumentFormat.XLS
                        "ppt" -> DocumentFormat.PPT
                        else -> DocumentFormat.DOC
                    }
                }

                // 4. RTF: {\rtf
                if (header[0] == 0x7B.toByte() &&
                    header[1] == 0x5C.toByte() &&
                    header[2] == 0x72.toByte() &&
                    header[3] == 0x74.toByte() &&
                    header[4] == 0x66.toByte()
                ) {
                    return DocumentFormat.RTF
                }

                // 5. Image (PNG, JPG)
                if (header[0] == 0x89.toByte() && header[1] == 0x50.toByte() && header[2] == 0x4E.toByte()) {
                    return DocumentFormat.IMAGE
                }
                if ((header[0].toInt() and 0xFF) == 0xFF && (header[1].toInt() and 0xFF) == 0xD8) {
                    return DocumentFormat.IMAGE
                }

                // Plain text check
                var isBinary = false
                val checkLen = minOf(bytesRead, 512)
                for (i in 0 until checkLen) {
                    if (header[i] == 0.toByte()) {
                        isBinary = true
                        break
                    }
                }

                if (!isBinary) {
                    return when (extension) {
                        "md", "markdown" -> DocumentFormat.MD
                        "csv" -> DocumentFormat.CSV
                        else -> DocumentFormat.TXT
                    }
                }
            }
        } catch (_: Exception) {
            return DocumentFormat.UNSUPPORTED
        }

        return DocumentFormat.UNSUPPORTED
    }
}
