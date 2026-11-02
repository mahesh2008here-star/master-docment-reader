package com.paperwren.documentreader.engine

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.xmlpull.v1.XmlPullParser
import org.xmlpull.v1.XmlPullParserFactory
import java.io.InputStream
import java.util.zip.ZipInputStream

data class DocxContent(
    val title: String,
    val paragraphs: List<String>,
    val headings: List<String>,
    val wordCount: Int
)

class DocxParserEngine(
    private val context: Context,
    private val uri: Uri
) {

    suspend fun parse(): DocxContent = withContext(Dispatchers.IO) {
        val stream: InputStream = context.contentResolver.openInputStream(uri)
            ?: throw IllegalStateException("Cannot open DOCX stream")

        val zip = ZipInputStream(stream)
        var entry = zip.nextEntry
        val paragraphs = mutableListOf<String>()
        val headings = mutableListOf<String>()

        while (entry != null) {
            if (entry.name == "word/document.xml") {
                val factory = XmlPullParserFactory.newInstance()
                factory.isNamespaceAware = true
                val parser = factory.newPullParser()
                parser.setInput(zip, "UTF-8")

                var eventType = parser.eventType
                var currentP = StringBuilder()
                var inHeading = false

                while (eventType != XmlPullParser.END_DOCUMENT) {
                    val name = parser.name
                    when (eventType) {
                        XmlPullParser.START_TAG -> {
                            if (name == "pStyle") {
                                val styleVal = parser.getAttributeValue(null, "val") ?: ""
                                if (styleVal.contains("Heading", ignoreCase = true)) {
                                    inHeading = true
                                }
                            }
                        }
                        XmlPullParser.TEXT -> {
                            val text = parser.text.trim()
                            if (text.isNotEmpty()) {
                                currentP.append(text).append(" ")
                            }
                        }
                        XmlPullParser.END_TAG -> {
                            if (name == "p") {
                                val fullText = currentP.toString().trim()
                                if (fullText.isNotEmpty()) {
                                    if (inHeading) {
                                        headings.add(fullText)
                                    }
                                    paragraphs.add(fullText)
                                }
                                currentP = StringBuilder()
                                inHeading = false
                            }
                        }
                    }
                    eventType = parser.next()
                }
                break
            }
            entry = zip.nextEntry
        }

        val allWords = paragraphs.joinToString(" ").split("\\s+".toRegex()).count { it.isNotBlank() }
        val title = headings.firstOrNull() ?: paragraphs.firstOrNull() ?: "Word Document"

        return@withContext DocxContent(
            title = title,
            paragraphs = paragraphs,
            headings = headings,
            wordCount = allWords
        )
    }
}
