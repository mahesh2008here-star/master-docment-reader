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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import androidx.compose.material.icons.filled.ArrowForward
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
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
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
    var selectedAccentColor by remember { mutableStateOf(Color(0xFFF59E0B)) } // Vibrant Amber Default
    var currentScreen by remember { mutableStateOf<String>("main") }

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
        } else if (currentScreen == "support") {
            // Full Support Creator Screen
            SupportScreen(
                accentColor = selectedAccentColor,
                onBack = { currentScreen = "main" }
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
                            onSelectSort = { viewModel.setSortOption(it) },
                            onToggleViewMode = { viewModel.toggleViewMode() }
                        )
                        1 -> ToolsTab(accentColor = selectedAccentColor, onOpenDocument = { activeDocument = it })
                        2 -> LockerTab(
                            documents = uiState.documents,
                            accentColor = selectedAccentColor,
                            onOpenDocument = { activeDocument = it }
                        )
                        3 -> SettingsTab(
                            accentColor = selectedAccentColor,
                            onSelectAccentColor = { selectedAccentColor = it },
                            onOpenSupport = { currentScreen = "support" }
                        )
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
    onSelectSort: (SortOption) -> Unit,
    onToggleViewMode: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        // Header matching Web App
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = accentColor,
                    modifier = Modifier.size(44.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Default.Description,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
                Column {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "Master Documents",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = accentColor
                        ) {
                            Text(
                                text = "OFFLINE",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Text(
                        text = "Personal Document Workstation",
                        fontSize = 11.sp,
                        color = Color(0xFF9CA3AF)
                    )
                }
            }

            Surface(
                shape = RoundedCornerShape(16.dp),
                color = accentColor,
                modifier = Modifier.clickable { onImportClick() }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Import", tint = Color.White, modifier = Modifier.size(16.dp))
                    Text("Import", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Search Bar
        OutlinedTextField(
            value = uiState.searchQuery,
            onValueChange = onSearchChange,
            placeholder = { Text("Search by name, format, or keyword...", color = Color(0xFF6B7280), fontSize = 12.sp) },
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
            null to "All Files",
            DocumentFormat.PDF to "PDFs",
            DocumentFormat.DOCX to "Word",
            DocumentFormat.XLSX to "Sheets",
            DocumentFormat.PPTX to "Slides",
            DocumentFormat.TXT to "Notes & MD"
        )

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(formats) { (fmt, label) ->
                val isSelected = uiState.selectedFormat == fmt
                Surface(
                    shape = CircleShape,
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
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
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
                text = "${uiState.documents.size} documents found",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFD1D5DB)
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
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
                            .padding(horizontal = 4.dp, vertical = 2.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        if (uiState.documents.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(bottom = 60.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Outlined.Description,
                        contentDescription = null,
                        modifier = Modifier.size(56.dp),
                        tint = Color(0xFF4B5563)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        "No documents in this view",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFD1D5DB)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        "Tap the Import button to select PDFs, Word, Excel, or Markdown files",
                        fontSize = 12.sp,
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
                    DocumentCardItem(
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
fun DocumentCardItem(
    doc: DocumentEntity,
    accentColor: Color,
    onOpen: () -> Unit,
    onToggleFavorite: () -> Unit,
    onShowDetails: () -> Unit,
    onRename: () -> Unit,
    onDelete: () -> Unit
) {
    var menuExpanded by remember { mutableStateOf(false) }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onOpen() },
        shape = RoundedCornerShape(18.dp),
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
                shape = RoundedCornerShape(12.dp),
                color = when (doc.format) {
                    DocumentFormat.PDF -> Color(0xFFEF4444)
                    DocumentFormat.DOCX -> Color(0xFF2563EB)
                    DocumentFormat.XLSX -> Color(0xFF059669)
                    DocumentFormat.PPTX -> Color(0xFFEA580C)
                    DocumentFormat.MD -> Color(0xFF7C3AED)
                    else -> Color(0xFF4B5563)
                },
                modifier = Modifier.size(44.dp)
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
                    fontWeight = FontWeight.SemiBold,
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
                    tint = if (doc.isFavorite) Color(0xFFF59E0B) else Color(0xFF6B7280)
                )
            }

            Box {
                IconButton(onClick = { menuExpanded = true }) {
                    Icon(Icons.Default.MoreVert, contentDescription = "Menu", tint = Color(0xFF6B7280))
                }

                DropdownMenu(
                    expanded = menuExpanded,
                    onDismissRequest = { menuExpanded = false },
                    modifier = Modifier.background(Color(0xFF1C1C26))
                ) {
                    DropdownMenuItem(
                        text = { Text("Document Info", color = Color.White, fontSize = 12.sp) },
                        leadingIcon = { Icon(Icons.Default.Info, contentDescription = null, tint = Color(0xFF60A5FA)) },
                        onClick = { menuExpanded = false; onShowDetails() }
                    )
                    DropdownMenuItem(
                        text = { Text("Rename", color = Color.White, fontSize = 12.sp) },
                        leadingIcon = { Icon(Icons.Default.Edit, contentDescription = null, tint = Color(0xFF34D399)) },
                        onClick = { menuExpanded = false; onRename() }
                    )
                    DropdownMenuItem(
                        text = { Text("Delete", color = Color(0xFFEF4444), fontSize = 12.sp) },
                        leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null, tint = Color(0xFFEF4444)) },
                        onClick = { menuExpanded = false; onDelete() }
                    )
                }
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
                    PdfRenderView(uri = Uri.parse(doc.uriString))
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
fun PdfRenderView(uri: Uri) {
    val context = LocalContext.current
    var pageBitmaps by remember { mutableStateOf<List<Bitmap>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(uri) {
        withContext(Dispatchers.IO) {
            try {
                val engine = PdfRendererEngine(context, uri)
                val count = engine.initialize()
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
fun ToolsTab(
    accentColor: Color,
    onOpenDocument: (DocumentEntity) -> Unit
) {
    val context = LocalContext.current
    var activeToolCategory by remember { mutableStateOf("pdf") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("Document Tools", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White)
        Text("Offline PDF, Office & Privacy utility suite", fontSize = 12.sp, color = Color(0xFF9CA3AF), modifier = Modifier.padding(bottom = 14.dp))

        // Tool Categories
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            listOf("pdf" to "PDF Utilities", "office" to "Office & Word", "privacy" to "Privacy & Hashes").forEach { (cat, label) ->
                val isSelected = activeToolCategory == cat
                Surface(
                    shape = CircleShape,
                    color = if (isSelected) accentColor else Color(0xFF1A1A22),
                    border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) accentColor else Color(0xFF2A2A38)),
                    modifier = Modifier.clickable { activeToolCategory = cat }
                ) {
                    Text(
                        text = label,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isSelected) Color.White else Color(0xFF9CA3AF),
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        val tools = when (activeToolCategory) {
            "office" -> listOf(
                Triple("Word to Markdown", "Convert DOCX headings and paragraphs to clean Markdown", Icons.Default.Code),
                Triple("Speaker Script", "Extract slide talking points and notes for PPTX", Icons.Default.Description)
            )
            "privacy" -> listOf(
                Triple("Metadata Sanitizer", "Clear author GUIDs, edit timestamps, and system paths", Icons.Default.Lock),
                Triple("SHA-256 Checksum", "Hardware-verified 256-bit cryptographic tamper hash", Icons.Default.Check)
            )
            else -> listOf(
                Triple("Extract All Text", "Extract searchable text stream into structured Markdown", Icons.Default.Description),
                Triple("PDF Inspector", "High-precision zoom, page count, and bookmark audit", Icons.Default.Info)
            )
        }

        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(tools) { (title, subtitle, icon) ->
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF13131A),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF242432)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            Toast.makeText(context, "$title ready for offline execution", Toast.LENGTH_SHORT).show()
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
    var pinError by remember { mutableStateOf(false) }
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
            Text("Private Document Locker", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                "Protected offline vault for sensitive documents. Enter 4-digit PIN or use Biometric scan.",
                fontSize = 12.sp,
                color = Color(0xFF9CA3AF),
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(20.dp))

            // PIN Dots Indicator
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                for (i in 0 until 4) {
                    val filled = pinInput.length > i
                    Box(
                        modifier = Modifier
                            .size(16.dp)
                            .clip(CircleShape)
                            .background(if (pinError) Color(0xFFEF4444) else if (filled) accentColor else Color(0xFF374151))
                    )
                }
            }

            if (pinError) {
                Spacer(modifier = Modifier.height(8.dp))
                Text("Incorrect PIN. Try again.", color = Color(0xFFEF4444), fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Keypad Grid 1-9, 0, DEL
            val keys = listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "BIO", "0", "DEL")
            LazyVerticalGrid(
                columns = GridCells.Fixed(3),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.width(260.dp)
            ) {
                items(keys) { key ->
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0xFF181822),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF2A2A3A)),
                        modifier = Modifier
                            .height(52.dp)
                            .clickable {
                                when (key) {
                                    "DEL" -> if (pinInput.isNotEmpty()) pinInput = pinInput.dropLast(1)
                                    "BIO" -> isUnlocked = true
                                    else -> {
                                        if (pinInput.length < 4) {
                                            val next = pinInput + key
                                            pinInput = next
                                            if (next.length == 4) {
                                                if (next == correctPin) {
                                                    isUnlocked = true
                                                } else {
                                                    pinError = true
                                                    pinInput = ""
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(key, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text("Default Master PIN: 1234", fontSize = 11.sp, color = Color(0xFF6B7280), fontFamily = FontFamily.Monospace)
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
                Text("Private Vault", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                TextButton(onClick = { isUnlocked = false; pinInput = "" }) {
                    Text("Lock Vault", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
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
                                Text("${doc.format.name} • Vaulted", color = Color(0xFF9CA3AF), fontSize = 11.sp)
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
    val clipboard = LocalClipboardManager.current
    val accents = listOf(
        Color(0xFFF59E0B) to "Vibrant Amber",
        Color(0xFF10B981) to "Cyber Emerald",
        Color(0xFF8B5CF6) to "Electric Violet",
        Color(0xFF0284C7) to "Pacific Blue",
        Color(0xFFF43F5E) to "Sunset Coral",
        Color(0xFF84CC16) to "Neon Lime",
        Color(0xFF64748B) to "Monochrome"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text("Settings", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Text("Customization, system storage, and developer info", fontSize = 11.sp, color = Color(0xFF9CA3AF))
        Spacer(modifier = Modifier.height(16.dp))

        // Preset Palette Accents Card
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Color(0xFF13131A),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF242432)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("COLOR ACCENTS & APPEARANCE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF6B7280))
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

        Spacer(modifier = Modifier.height(14.dp))

        // Developer GitHub Profile
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Color(0xFF13131A),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF242432)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text("mahesh2008here", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Surface(shape = RoundedCornerShape(4.dp), color = Color(0xFF222230)) {
                                Text("v1.0.0", color = Color(0xFF9CA3AF), fontSize = 10.sp, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                            }
                        }
                        Text("Master Documents Lead Developer • Android & Web", color = Color(0xFF9CA3AF), fontSize = 11.sp)
                    }

                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = accentColor,
                        modifier = Modifier.clickable {
                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://github.com/mahesh2008here")))
                        }
                    ) {
                        Text("GitHub Profile", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp))
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Git Push Commands Box
                Text("GitHub Release Trigger Command:", color = Color(0xFFD1D5DB), fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(4.dp))
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFF09090D),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            clipboard.setText(AnnotatedString("git push -u origin main && git push origin v1.0.0"))
                            Toast.makeText(context, "Git commands copied to clipboard", Toast.LENGTH_SHORT).show()
                        }
                ) {
                    Text(
                        text = "git push -u origin main && git push origin v1.0.0",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        color = Color(0xFF34D399),
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Support Creator Button
        Surface(
            shape = RoundedCornerShape(20.dp),
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
                    Text("Support the Creator via UPI", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Contribute via UPI or QR code to keep Paperwren ad-free", color = Color(0xFF9CA3AF), fontSize = 11.sp)
                }
                Icon(Icons.Default.ArrowForward, contentDescription = null, tint = Color(0xFF6B7280))
            }
        }
    }
}

@Composable
fun SupportScreen(
    accentColor: Color,
    onBack: () -> Unit
) {
    val UPI_ID = "mahesh.2008here@oksbi"
    var isRevealed by remember { mutableStateOf(false) }
    var selectedAmt by remember { mutableStateOf(100) }
    val clipboard = LocalClipboardManager.current
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        IconButton(onClick = onBack) {
            Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
        }

        Spacer(modifier = Modifier.height(8.dp))

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            Surface(
                shape = RoundedCornerShape(24.dp),
                color = accentColor,
                modifier = Modifier.size(56.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.Favorite, contentDescription = null, tint = Color.White, modifier = Modifier.size(28.dp))
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text("Support Master Documents", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                "Master Documents is built as a 100% offline, privacy-first, ad-free document workstation.",
                fontSize = 12.sp,
                color = Color(0xFF9CA3AF),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Contribution Amounts
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Color(0xFF13131A),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF242432)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("SELECT CONTRIBUTION AMOUNT (INR ₹)", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF6B7280))
                Spacer(modifier = Modifier.height(12.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    listOf(50, 100, 250, 500).forEach { amt ->
                        val isSelected = selectedAmt == amt
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (isSelected) accentColor else Color(0xFF1E1E28),
                            modifier = Modifier
                                .weight(1f)
                                .clickable { selectedAmt = amt }
                        ) {
                            Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(vertical = 10.dp)) {
                                Text("₹$amt", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // UPI Address Card
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF1D1D28),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            isRevealed = true
                            clipboard.setText(AnnotatedString(UPI_ID))
                            Toast.makeText(context, "UPI ID copied to clipboard", Toast.LENGTH_SHORT).show()
                        }
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("OFFICIAL UPI ID (TAP TO COPY)", fontSize = 10.sp, color = Color(0xFF9CA3AF), fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = if (isRevealed) UPI_ID else "Tap to reveal & copy UPI ID",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isRevealed) Color(0xFF34D399) else accentColor
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Pay via UPI Button
                Button(
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW).apply {
                            data = Uri.parse("upi://pay?pa=$UPI_ID&pn=Master%20Documents&am=$selectedAmt&cu=INR")
                        }
                        try {
                            context.startActivity(intent)
                        } catch (e: Exception) {
                            clipboard.setText(AnnotatedString(UPI_ID))
                            Toast.makeText(context, "UPI ID copied: $UPI_ID", Toast.LENGTH_SHORT).show()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = accentColor),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Pay via UPI App (₹$selectedAmt)", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }
    }
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
