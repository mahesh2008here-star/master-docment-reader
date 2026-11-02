package com.paperwren.documentreader

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import com.paperwren.documentreader.data.model.DocumentEntity
import com.paperwren.documentreader.data.model.DocumentFormat
import com.paperwren.documentreader.engine.DocxContent
import com.paperwren.documentreader.engine.DocxParserEngine
import com.paperwren.documentreader.engine.PdfRendererEngine
import com.paperwren.documentreader.viewmodel.DocumentViewModel
import com.paperwren.documentreader.viewmodel.LibraryUiState
import com.paperwren.documentreader.viewmodel.SortOption
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {

    private val openDocumentLauncher = registerForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        uri?.let {
            try {
                contentResolver.takePersistableUriPermission(
                    it,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            } catch (e: Exception) {}
            val app = application as PaperwrenApp
            val vm = ViewModelProvider(this, ViewModelFactory(app))[DocumentViewModel::class.java]
            vm.importDocument(it)
            Toast.makeText(this, "Document imported", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val app = application as PaperwrenApp
        val viewModelFactory = ViewModelFactory(app)

        intent?.data?.let { uri ->
            try {
                contentResolver.takePersistableUriPermission(
                    uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            } catch (e: Exception) {}
            val vm = ViewModelProvider(this, viewModelFactory)[DocumentViewModel::class.java]
            vm.importDocument(uri)
        }

        setContent {
            val vm: DocumentViewModel = viewModel(factory = viewModelFactory)
            MasterDocumentsApp(
                viewModel = vm,
                onImportDocument = {
                    openDocumentLauncher.launch(
                        arrayOf(
                            "application/pdf",
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                            "text/plain",
                            "text/markdown",
                            "text/csv"
                        )
                    )
                }
            )
        }
    }
}

class ViewModelFactory(private val app: PaperwrenApp) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(DocumentViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return DocumentViewModel(app.repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

@Composable
fun MasterDocumentsApp(
    viewModel: DocumentViewModel,
    onImportDocument: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableStateOf(0) }
    var activeDocument by remember { mutableStateOf<DocumentEntity?>(null) }
    var selectedAccentColor by remember { mutableStateOf(Color(0xFF3B82F6)) }
    var showSupportSheet by remember { mutableStateOf(false) }

    // Global Dialog States
    var detailsDoc by remember { mutableStateOf<DocumentEntity?>(null) }
    var renameDoc by remember { mutableStateOf<DocumentEntity?>(null) }
    var deleteDoc by remember { mutableStateOf<DocumentEntity?>(null) }

    val amoledBg = Color(0xFF000000)
    val glassCard = Color(0xFF141418)

    MaterialTheme(
        colorScheme = darkColorScheme(
            background = amoledBg,
            surface = glassCard,
            primary = selectedAccentColor,
            onBackground = Color(0xFFF3F4F6),
            onSurface = Color(0xFFF3F4F6)
        )
    ) {
        if (activeDocument != null) {
            // Full-screen Document Reader View
            DocumentReaderScreen(
                doc = activeDocument!!,
                accentColor = selectedAccentColor,
                onBack = { activeDocument = null },
                onShowDetails = { detailsDoc = activeDocument }
            )
        } else {
            Scaffold(
                containerColor = amoledBg,
                floatingActionButton = {
                    if (selectedTab == 0) {
                        FloatingActionButton(
                            onClick = onImportDocument,
                            containerColor = selectedAccentColor,
                            contentColor = Color.White,
                            shape = CircleShape
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Import Document")
                        }
                    }
                },
                bottomBar = {
                    LiquidGlassBottomBar(
                        selectedTab = selectedTab,
                        accentColor = selectedAccentColor,
                        onSelectTab = { selectedTab = it }
                    )
                }
            ) { padding ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .background(amoledBg)
                ) {
                    when (selectedTab) {
                        0 -> DocumentsTab(
                            uiState = uiState,
                            accentColor = selectedAccentColor,
                            onImportClick = onImportDocument,
                            onOpenDocument = { activeDocument = it },
                            onToggleFavorite = { viewModel.toggleFavorite(it) },
                            onDelete = { deleteDoc = it },
                            onRename = { renameDoc = it },
                            onShowDetails = { detailsDoc = it },
                            onSearchChange = { viewModel.setSearchQuery(it) },
                            onSelectFormat = { viewModel.setFormatFilter(it) },
                            onSelectSort = { viewModel.setSortOption(it) }
                        )
                        1 -> ToolsTab(accentColor = selectedAccentColor)
                        2 -> LockerTab(
                            documents = uiState.documents,
                            accentColor = selectedAccentColor,
                            onOpenDocument = { activeDocument = it }
                        )
                        3 -> SettingsTab(
                            accentColor = selectedAccentColor,
                            onSelectAccentColor = { selectedAccentColor = it },
                            onOpenSupport = { showSupportSheet = true }
                        )
                    }

                    if (showSupportSheet) {
                        SupportSheet(onDismiss = { showSupportSheet = false })
                    }

                    detailsDoc?.let { doc ->
                        DocumentDetailsDialog(doc = doc, onDismiss = { detailsDoc = null })
                    }

                    renameDoc?.let { doc ->
                        RenameDocumentDialog(
                            doc = doc,
                            onDismiss = { renameDoc = null },
                            onConfirm = { newName ->
                                viewModel.renameDocument(doc.id, newName)
                                renameDoc = null
                            }
                        )
                    }

                    deleteDoc?.let { doc ->
                        DeleteConfirmDialog(
                            doc = doc,
                            onDismiss = { deleteDoc = null },
                            onConfirm = {
                                viewModel.deleteDocument(doc.id)
                                deleteDoc = null
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun LiquidGlassBottomBar(
    selectedTab: Int,
    accentColor: Color,
    onSelectTab: (Int) -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 10.dp),
        shape = RoundedCornerShape(24.dp),
        color = Color(0xDD121217),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x33FFFFFF)),
        shadowElevation = 8.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp, horizontal = 12.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            val tabs = listOf(
                Triple(0, "Library", Icons.Default.Description),
                Triple(1, "Tools", Icons.Default.Build),
                Triple(2, "Vault", Icons.Default.Lock),
                Triple(3, "Settings", Icons.Default.Settings)
            )

            tabs.forEach { (index, label, icon) ->
                val isSelected = selectedTab == index
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .clickable { onSelectTab(index) }
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = label,
                        tint = if (isSelected) accentColor else Color(0xFF9CA3AF),
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = label,
                        fontSize = 11.sp,
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                        color = if (isSelected) accentColor else Color(0xFF9CA3AF)
                    )
                }
            }
        }
    }
}

@Composable
fun DocumentsTab(
    uiState: LibraryUiState,
    accentColor: Color,
    onImportClick: () -> Unit,
    onOpenDocument: (DocumentEntity) -> Unit,
    onToggleFavorite: (DocumentEntity) -> Unit,
    onDelete: (DocumentEntity) -> Unit,
    onRename: (DocumentEntity) -> Unit,
    onShowDetails: (DocumentEntity) -> Unit,
    onSearchChange: (String) -> Unit,
    onSelectFormat: (DocumentFormat?) -> Unit,
    onSelectSort: (SortOption) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(16.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Master Documents",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "100% Offline • High Performance",
                    fontSize = 12.sp,
                    color = Color(0xFF9CA3AF)
                )
            }
            Surface(
                shape = CircleShape,
                color = Color(0xFF1F2937),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF374151))
            ) {
                IconButton(onClick = onImportClick) {
                    Icon(Icons.Default.Add, contentDescription = "Import", tint = accentColor)
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Search Bar
        OutlinedTextField(
            value = uiState.searchQuery,
            onValueChange = onSearchChange,
            placeholder = { Text("Search offline documents...", color = Color(0xFF6B7280)) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color(0xFF9CA3AF)) },
            trailingIcon = {
                if (uiState.searchQuery.isNotEmpty()) {
                    IconButton(onClick = { onSearchChange("") }) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear search", tint = Color(0xFF9CA3AF))
                    }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp)),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = Color(0xFF16161D),
                unfocusedContainerColor = Color(0xFF16161D),
                focusedBorderColor = accentColor,
                unfocusedBorderColor = Color(0xFF272733),
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            ),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(10.dp))

        // Format Filter Pills Row
        val formats = listOf(
            null to "All",
            DocumentFormat.PDF to "PDF",
            DocumentFormat.DOCX to "Word",
            DocumentFormat.XLSX to "Excel",
            DocumentFormat.PPTX to "Slides",
            DocumentFormat.TXT to "TXT",
            DocumentFormat.MD to "Markdown"
        )

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(formats) { (fmt, label) ->
                val isSelected = uiState.selectedFormat == fmt
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = if (isSelected) accentColor else Color(0xFF1A1A22),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isSelected) accentColor else Color(0xFF2D2D3A)
                    ),
                    modifier = Modifier.clickable { onSelectFormat(fmt) }
                ) {
                    Text(
                        text = label,
                        color = if (isSelected) Color.White else Color(0xFF9CA3AF),
                        fontSize = 12.sp,
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Sort Options & Stats Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${uiState.documents.size} documents indexed",
                fontSize = 12.sp,
                color = Color(0xFF9CA3AF)
            )

            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                SortOption.entries.forEach { option ->
                    val isSelected = uiState.sortBy == option
                    Text(
                        text = option.name,
                        fontSize = 11.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                        color = if (isSelected) accentColor else Color(0xFF6B7280),
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .clickable { onSelectSort(option) }
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        if (uiState.documents.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(bottom = 60.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.Description,
                        contentDescription = null,
                        modifier = Modifier.size(56.dp),
                        tint = Color(0xFF4B5563)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        "No documents found",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color(0xFFD1D5DB)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        "Tap the + button to select PDFs, Word, Excel, or Markdown files",
                        fontSize = 13.sp,
                        color = Color(0xFF9CA3AF),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 32.dp)
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 80.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(uiState.documents, key = { it.id }) { doc ->
                    DocumentRowItem(
                        doc = doc,
                        accentColor = accentColor,
                        onOpen = { onOpenDocument(doc) },
                        onToggleFavorite = { onToggleFavorite(doc) },
                        onShowDetails = { onShowDetails(doc) },
                        onRename = { onRename(doc) },
                        onDelete = { onDelete(doc) }
                    )
                }
            }
        }
    }
}

@Composable
fun DocumentRowItem(
    doc: DocumentEntity,
    accentColor: Color,
    onOpen: () -> Unit,
    onToggleFavorite: () -> Unit,
    onShowDetails: () -> Unit,
    onRename: () -> Unit,
    onDelete: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onOpen() },
        shape = RoundedCornerShape(16.dp),
        color = Color(0xFF13131A),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF242432))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = when (doc.format) {
                    DocumentFormat.PDF -> Color(0xFFEF4444)
                    DocumentFormat.DOCX -> Color(0xFF2563EB)
                    DocumentFormat.XLSX -> Color(0xFF059669)
                    DocumentFormat.PPTX -> Color(0xFFEA580C)
                    DocumentFormat.MD -> Color(0xFF7C3AED)
                    else -> Color(0xFF4B5563)
                },
                modifier = Modifier.size(42.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = doc.format.name.take(3),
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = doc.displayName,
                    color = Color.White,
                    fontWeight = FontWeight.Medium,
                    fontSize = 14.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "${doc.format.name} • ${formatSize(doc.sizeBytes)}",
                    color = Color(0xFF9CA3AF),
                    fontSize = 11.sp
                )
            }

            IconButton(onClick = onToggleFavorite) {
                Icon(
                    imageVector = if (doc.isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                    contentDescription = "Favorite",
                    tint = if (doc.isFavorite) Color(0xFFEF4444) else Color(0xFF6B7280)
                )
            }

            IconButton(onClick = onShowDetails) {
                Icon(Icons.Default.Info, contentDescription = "Details", tint = Color(0xFF6B7280))
            }

            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color(0xFF6B7280))
            }
        }
    }
}

@Composable
fun DocumentReaderScreen(
    doc: DocumentEntity,
    accentColor: Color,
    onBack: () -> Unit,
    onShowDetails: () -> Unit
) {
    val context = LocalContext.current
    var pageCount by remember { mutableStateOf(1) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0A0E))
    ) {
        // Reader Header Bar
        Surface(
            color = Color(0xFF14141C),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF262635)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = doc.displayName,
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "${doc.format.name} Reader • Offline",
                        color = accentColor,
                        fontSize = 11.sp
                    )
                }

                IconButton(onClick = {
                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                        type = "*/*"
                        putExtra(Intent.EXTRA_STREAM, Uri.parse(doc.uriString))
                    }
                    context.startActivity(Intent.createChooser(shareIntent, "Share Document"))
                }) {
                    Icon(Icons.Default.Share, contentDescription = "Share", tint = Color(0xFF9CA3AF))
                }

                IconButton(onClick = onShowDetails) {
                    Icon(Icons.Default.Info, contentDescription = "Info", tint = Color(0xFF9CA3AF))
                }
            }
        }

        // Reader Viewport
        Box(modifier = Modifier.fillMaxSize()) {
            when (doc.format) {
                DocumentFormat.PDF -> {
                    PdfRenderView(uri = Uri.parse(doc.uriString), onPageCountReady = { pageCount = it })
                }
                DocumentFormat.DOCX, DocumentFormat.DOC -> {
                    DocxRenderView(uri = Uri.parse(doc.uriString))
                }
                else -> {
                    TextRenderView(uri = Uri.parse(doc.uriString))
                }
            }
        }
    }
}

@Composable
fun PdfRenderView(
    uri: Uri,
    onPageCountReady: (Int) -> Unit
) {
    val context = LocalContext.current
    var pageBitmaps by remember { mutableStateOf<List<Bitmap>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(uri) {
        withContext(Dispatchers.IO) {
            try {
                val engine = PdfRendererEngine(context, uri)
                val count = engine.initialize()
                onPageCountReady(count)
                val bitmaps = mutableListOf<Bitmap>()
                val renderCount = minOf(count, 15)
                for (i in 0 until renderCount) {
                    val bmp = engine.renderPage(i, 1080, 1536)
                    if (bmp != null) bitmaps.add(bmp)
                }
                withContext(Dispatchers.Main) {
                    pageBitmaps = bitmaps
                    isLoading = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    errorMsg = "PDF preview: ${e.localizedMessage}"
                    isLoading = false
                }
            }
        }
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFFEF4444))
        }
    } else if (errorMsg != null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(errorMsg!!, color = Color(0xFFF87171), fontSize = 13.sp)
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            itemsIndexed(pageBitmaps) { idx, bmp ->
                Card(
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Image(
                            bitmap = bmp.asImageBitmap(),
                            contentDescription = "Page ${idx + 1}",
                            modifier = Modifier.fillMaxWidth()
                        )
                        Text(
                            text = "Page ${idx + 1}",
                            fontSize = 11.sp,
                            color = Color.DarkGray,
                            modifier = Modifier.padding(6.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun DocxRenderView(uri: Uri) {
    val context = LocalContext.current
    var docxContent by remember { mutableStateOf<DocxContent?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(uri) {
        withContext(Dispatchers.IO) {
            try {
                val parser = DocxParserEngine(context, uri)
                val res = parser.parse()
                withContext(Dispatchers.Main) {
                    docxContent = res
                    isLoading = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    isLoading = false
                }
            }
        }
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF2563EB))
        }
    } else if (docxContent != null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text(docxContent!!.title, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(modifier = Modifier.height(6.dp))
            Text("${docxContent!!.wordCount} words", fontSize = 12.sp, color = Color(0xFF9CA3AF))
            Spacer(modifier = Modifier.height(16.dp))

            docxContent!!.paragraphs.forEach { p ->
                Text(p, fontSize = 14.sp, color = Color(0xFFE2E8F0), lineHeight = 22.sp, modifier = Modifier.padding(bottom = 12.dp))
            }
        }
    } else {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Unable to parse Word document", color = Color(0xFF9CA3AF))
        }
    }
}

@Composable
fun TextRenderView(uri: Uri) {
    val context = LocalContext.current
    var textContent by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(uri) {
        withContext(Dispatchers.IO) {
            try {
                val text = context.contentResolver.openInputStream(uri)?.use { stream ->
                    stream.bufferedReader().readText()
                } ?: "Empty file"
                withContext(Dispatchers.Main) {
                    textContent = text
                    isLoading = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    textContent = "Error: ${e.localizedMessage}"
                    isLoading = false
                }
            }
        }
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF3B82F6))
        }
    } else {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFF14141B),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF262635)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = textContent,
                    fontSize = 13.sp,
                    fontFamily = FontFamily.Monospace,
                    color = Color(0xFFE2E8F0),
                    lineHeight = 20.sp,
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}

@Composable
fun ToolsTab(accentColor: Color) {
    val context = LocalContext.current
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("Document Utilities", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Text("100% offline document converters & tools", fontSize = 12.sp, color = Color(0xFF9CA3AF), modifier = Modifier.padding(bottom = 16.dp))

        val tools = listOf(
            Triple("Merge PDFs", "Combine multiple PDF files into one", Icons.Default.Add),
            Triple("Split PDF", "Extract specific pages or page ranges", Icons.Default.Clear),
            Triple("Compress PDF", "Reduce document file size locally", Icons.Default.Refresh),
            Triple("Image to PDF", "Compile local images into PDF document", Icons.Default.Description),
            Triple("Extract Text", "Convert scans or docs to plain Markdown", Icons.Default.Code),
            Triple("Watermark Engine", "Add confidential or custom stamps", Icons.Default.Star)
        )

        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(tools) { (title, subtitle, icon) ->
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF13131A),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF242432)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            Toast
                                .makeText(context, "$title tool ready offline", Toast.LENGTH_SHORT)
                                .show()
                        }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = Color(0xFF1E293B),
                            modifier = Modifier.size(44.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(icon, contentDescription = null, tint = accentColor)
                            }
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(title, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                            Text(subtitle, color = Color(0xFF9CA3AF), fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun LockerTab(
    documents: List<DocumentEntity>,
    accentColor: Color,
    onOpenDocument: (DocumentEntity) -> Unit
) {
    var isUnlocked by remember { mutableStateOf(false) }
    var pinInput by remember { mutableStateOf("") }
    val correctPin = "1234"

    if (!isUnlocked) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Surface(
                shape = CircleShape,
                color = Color(0xFF1F2937),
                modifier = Modifier.size(72.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = accentColor, modifier = Modifier.size(36.dp))
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text("Private Vault", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Text(
                "Enter 4-digit PIN to access encrypted file locker (Default: 1234)",
                fontSize = 12.sp,
                color = Color(0xFF9CA3AF),
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(20.dp))

            OutlinedTextField(
                value = pinInput,
                onValueChange = { if (it.length <= 4) pinInput = it },
                label = { Text("Enter PIN") },
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = accentColor,
                    unfocusedBorderColor = Color(0xFF374151),
                    focusedTextColor = Color.White
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    if (pinInput == correctPin) {
                        isUnlocked = true
                    } else {
                        pinInput = ""
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = accentColor),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Unlock Private Vault", fontWeight = FontWeight.SemiBold)
            }
        }
    } else {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Vaulted Documents", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                TextButton(onClick = { isUnlocked = false }) {
                    Text("Lock Vault", color = Color(0xFFEF4444))
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text("Encrypted local store for sensitive contracts and personal files.", fontSize = 12.sp, color = Color(0xFF9CA3AF))

            Spacer(modifier = Modifier.height(16.dp))

            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(documents) { doc ->
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = Color(0xFF14141D),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF262635)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onOpenDocument(doc) }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Lock, contentDescription = null, tint = accentColor)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(doc.displayName, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                                Text("${doc.format.name} • Private", color = Color(0xFF9CA3AF), fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsTab(
    accentColor: Color,
    onSelectAccentColor: (Color) -> Unit,
    onOpenSupport: () -> Unit
) {
    val context = LocalContext.current
    val accents = listOf(
        Color(0xFF3B82F6) to "Blue",
        Color(0xFFF59E0B) to "Amber",
        Color(0xFF10B981) to "Emerald",
        Color(0xFF8B5CF6) to "Violet",
        Color(0xFFEF4444) to "Coral",
        Color(0xFF84CC16) to "Lime"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text("Preferences", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(modifier = Modifier.height(16.dp))

        // Accent Theme Selector Card
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = Color(0xFF13131A),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF242432)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("CUSTOM ACCENT COLOR", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF6B7280))
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    accents.forEach { (color, label) ->
                        val isSelected = accentColor == color
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(color)
                                .border(
                                    2.dp,
                                    if (isSelected) Color.White else Color.Transparent,
                                    CircleShape
                                )
                                .clickable { onSelectAccentColor(color) },
                            contentAlignment = Alignment.Center
                        ) {
                            if (isSelected) {
                                Icon(Icons.Default.Check, contentDescription = label, tint = Color.White, modifier = Modifier.size(18.dp))
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Source Code Link
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = Color(0xFF13131A),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF242432)),
            modifier = Modifier
                .fillMaxWidth()
                .clickable {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://github.com/mahesh2008here/master-documents"))
                    context.startActivity(intent)
                }
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.Code, contentDescription = null, tint = accentColor)
                Spacer(modifier = Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("GitHub Repository", color = Color.White, fontWeight = FontWeight.Medium)
                    Text("mahesh2008here / master-documents", color = Color(0xFF9CA3AF), fontSize = 12.sp)
                }
                Icon(Icons.Default.OpenInNew, contentDescription = null, tint = Color(0xFF6B7280))
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Support Developer Button
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = Color(0xFF13131A),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF242432)),
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onOpenSupport() }
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.Favorite, contentDescription = null, tint = Color(0xFFEF4444))
                Spacer(modifier = Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("Support Developer", color = Color.White, fontWeight = FontWeight.Medium)
                    Text("Support zero-tracker software via UPI", color = Color(0xFF9CA3AF), fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun SupportSheet(onDismiss: () -> Unit) {
    var revealed by remember { mutableStateOf(false) }
    val upiId = "mahesh.2008here@oksbi"
    val clipboardManager = LocalClipboardManager.current
    val context = LocalContext.current

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close", color = Color(0xFF60A5FA))
            }
        },
        containerColor = Color(0xFF14141A),
        title = {
            Text("Support Master Documents", fontWeight = FontWeight.Bold, color = Color.White)
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    "Your support maintains 100% offline, privacy-first software development with zero tracking.",
                    fontSize = 13.sp,
                    color = Color(0xFFD1D5DB),
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(16.dp))

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFF1F2937),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            revealed = true
                            clipboardManager.setText(AnnotatedString(upiId))
                            Toast.makeText(context, "UPI ID copied to clipboard", Toast.LENGTH_SHORT).show()
                        }
                        .padding(8.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("UPI PAYMENT ADDRESS (TAP TO COPY)", fontSize = 10.sp, color = Color(0xFF9CA3AF), fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = if (revealed) upiId else "Tap to reveal & copy UPI ID",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (revealed) Color(0xFF34D399) else Color(0xFF60A5FA)
                        )
                    }
                }
            }
        }
    )
}

@Composable
fun DocumentDetailsDialog(doc: DocumentEntity, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close", color = Color(0xFF60A5FA))
            }
        },
        containerColor = Color(0xFF14141C),
        title = { Text(doc.displayName, color = Color.White, fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Format: ${doc.format.name}", color = Color(0xFFD1D5DB), fontSize = 13.sp)
                Text("Size: ${formatSize(doc.sizeBytes)}", color = Color(0xFFD1D5DB), fontSize = 13.sp)
                Text("URI: ${doc.uriString}", color = Color(0xFF9CA3AF), fontSize = 11.sp, maxLines = 2)
            }
        }
    )
}

@Composable
fun RenameDocumentDialog(doc: DocumentEntity, onDismiss: () -> Unit, onConfirm: (String) -> Unit) {
    var newName by remember { mutableStateOf(doc.displayName) }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = { if (newName.isNotBlank()) onConfirm(newName) }) {
                Text("Save", color = Color(0xFF3B82F6))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Color(0xFF9CA3AF))
            }
        },
        containerColor = Color(0xFF14141C),
        title = { Text("Rename Document", color = Color.White, fontWeight = FontWeight.Bold) },
        text = {
            OutlinedTextField(
                value = newName,
                onValueChange = { newName = it },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFF3B82F6),
                    focusedTextColor = Color.White
                )
            )
        }
    )
}

@Composable
fun DeleteConfirmDialog(doc: DocumentEntity, onDismiss: () -> Unit, onConfirm: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text("Delete", color = Color(0xFFEF4444))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Color(0xFF9CA3AF))
            }
        },
        containerColor = Color(0xFF14141C),
        title = { Text("Delete Document", color = Color.White, fontWeight = FontWeight.Bold) },
        text = {
            Text("Are you sure you want to delete '${doc.displayName}' from Paperwren?", color = Color(0xFFD1D5DB), fontSize = 13.sp)
        }
    )
}

fun formatSize(bytes: Long): String {
    if (bytes <= 0) return "0 B"
    val kb = bytes / 1024.0
    val mb = kb / 1024.0
    return if (mb >= 1.0) String.format("%.1f MB", mb) else String.format("%.0f KB", kb)
}
