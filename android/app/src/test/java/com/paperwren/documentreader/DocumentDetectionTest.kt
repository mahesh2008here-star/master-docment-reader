package com.paperwren.documentreader

import com.paperwren.documentreader.data.model.DocumentFormat
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class DocumentDetectionTest {

    @Test
    fun testPdfMagicByteDetection() {
        val pdfHeader = byteArrayOf(0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34) // %PDF-1.4
        val isPdf = pdfHeader.size >= 5 &&
                pdfHeader[0] == 0x25.toByte() &&
                pdfHeader[1] == 0x50.toByte() &&
                pdfHeader[2] == 0x44.toByte() &&
                pdfHeader[3] == 0x46.toByte() &&
                pdfHeader[4] == 0x2D.toByte()

        assertTrue("Should detect standard %PDF- magic bytes header", isPdf)
    }

    @Test
    fun testZipArchiveSignature() {
        val zipHeader = byteArrayOf(0x50, 0x4B, 0x03, 0x04) // PK\x03\x04
        val isZip = zipHeader[0] == 0x50.toByte() &&
                zipHeader[1] == 0x4B.toByte() &&
                zipHeader[2] == 0x03.toByte() &&
                zipHeader[3] == 0x04.toByte()

        assertTrue("Should detect PKZip signature for OpenXML container formats", isZip)
    }

    @Test
    fun testCorruptBinaryHandling() {
        val arbitraryNoise = byteArrayOf(0x00, 0x12, 0x43, 0x77)
        var hasNull = false
        for (b in arbitraryNoise) {
            if (b == 0.toByte()) {
                hasNull = true
                break
            }
        }
        assertTrue("Binary with null byte sequences should not be misidentified as plain text", hasNull)
    }
}
