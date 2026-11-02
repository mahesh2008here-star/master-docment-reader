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
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Home
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
import androidx.compose.material.icons.filled.Tune
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
    var selectedTab by remember { mutableStateOf(0) } // 0: Home/Discover, 1: Tools, 2: Locker, 3: Settings
    var activeDocument by remember { mutableStateOf<DocumentEntity?>(null) }
    var selectedAccentColor by remember { mutableStateOf(Color(0xFFF59E0B)) } // Vibrant Amber Default
    var isDarkMode by remember { mutableStateOf(true) }
    var currentScreen by remember { mutableStateOf<String>("main") }

    // Global Dialog States
    var detailsDoc by remember { mutableStateOf<DocumentEntity?>(null) }
    var renameDoc by remember { mutableStateOf<DocumentEntity?>(null) }
    var deleteDoc by remember { mutableStateOf<DocumentEntity?>(null) }

    val amoledBg = if (isDarkMode) Color(0xFF000000) else Color(0xFFF3F4F6)
    val cardBg = if (isDarkMode) Color(0xFF141418) else Color(0xFFFFFFFF)

    MaterialTheme(
        colorScheme = if (isDarkMode) {
            darkColorScheme(
                background = amoledBg,
                surface = cardBg,
                primary = selectedAccentColor,
                onBackground = Color(0xFFF3F4F6),
                onSurface = Color(0xFFF3F4F6)
            )
        } else {
            lightColorScheme(
                background = amoledBg,
                surface = cardBg,
                primary = selectedAccentColor,
                onBackground = Color(0xFF111827),
                onSurface = Color(0xFF111827)
            )
        }
    ) {
        if (activeDocument != null) {
            // Full-screen Document Reader View matching App.tsx
            DocumentReaderScreen(
                doc = activeDocument!!,
                accentColor = selectedAccentColor,
                isDarkMode = isDarkMode,
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
                        isDarkMode = isDarkMode,
                        vaultedCount = uiState.documents.count { it.isFavorite },
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
                            isDarkMode = isDarkMode,
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
                        1 -> ToolsTab(
                            accentColor = selectedAccentColor,
                            isDarkMode = isDarkMode,
                            onOpenDocument = { activeDocument = it }
                        )
                        2 -> LockerTab(
                            documents = uiState.documents,
                            accentColor = selectedAccentColor,
                            isDarkMode = isDarkMode,
                            onOpenDocument = { activeDocument = it }
                        )
                        3 -> SettingsTab(
                            accentColor = selectedAccentColor,
                            isDarkMode = isDarkMode,
                            onToggleDarkMode = { isDarkMode = !isDarkMode },
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

// Apple-Inspired Liquid Glass Floating Dock Matching BottomNav.tsx 1:1
@Composable
fun LiquidGlassBottomBar(
    selectedTab: Int,
    accentColor: Color,
    isDarkMode: Boolean,
    vaultedCount: Int = 0,
    onSelectTab: (Int) -> Unit
) {
    val dockBg = if (isDarkMode) Color(0xEE121217) else Color(0xEEF9FAFB)
    val dockBorder = if (isDarkMode) Color(0x33FFFFFF) else Color(0x1F000000)
    val inactiveTint = if (isDarkMode) Color(0xFF9CA3AF) else Color(0xFF6B7280)

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 10.dp),
        shape = RoundedCornerShape(28.dp),
        color = dockBg,
        border = androidx.compose.foundation.BorderStroke(1.dp, dockBorder),
        shadowElevation = 12.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp, horizontal = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            val tabs = listOf(
                NavTabItem(0, "Home", Icons.Default.Explore, "Discover & Catalog"),
                NavTabItem(1, "Tools", Icons.Default.Build, "PDF & Utility Suite"),
                NavTabItem(2, "Locker", Icons.Default.Lock, "Private PIN Vault", badge = if (vaultedCount > 0) vaultedCount else null),
                NavTabItem(3, "Settings", Icons.Default.Tune, "Accents & Info")
            )

            tabs.forEach { tab ->
                val isSelected = selectedTab == tab.index
                val itemBg = if (isSelected) {
                    if (isDarkMode) Color(0x26FFFFFF) else Color(0x1F000000)
                } else {
                    Color.Transparent
                }

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(itemBg)
                        .clickable { onSelectTab(tab.index) }
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = tab.icon,
                            contentDescription = tab.label,
                            tint = if (isSelected) accentColor else inactiveTint,
                            modifier = Modifier.size(22.dp)
                        )

                        tab.badge?.let { count ->
                            Surface(
                                shape = CircleShape,
                                color = accentColor,
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .offset(x = 8.dp, y = (-4).dp)
                                    .size(14.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = count.toString(),
                                        color = Color.White,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(3.dp))
                    Text(
                        text = tab.label,
                        fontSize = 10.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                        color = if (isSelected) {
                            if (isDarkMode) Color.White else Color(0xFF111827)
                        } else {
                            inactiveTint
                        }
                    )

                    if (isSelected) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Box(
                            modifier = Modifier
                                .size(5.dp)
                                .clip(CircleShape)
                                .background(accentColor)
                        )
                    }
                }
            }
        }
    }
}

private data class NavTabItem(
    val index: Int,
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val tooltip: String,
    val badge: Int? = null
)

@Composable
fun DocumentsTab(
    uiState: LibraryUiState,
    accentColor: Color,
    isDarkMode: Boolean,
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
    val cardBg = if (isDarkMode) Color(0xFF141418) else Color(0xFFFFFFFF)
    val textColor = if (isDarkMode) Color.White else Color(0xFF111827)
    val subTextColor = if (isDarkMode) Color(0xFF9CA3AF) else Color(0xFF6B7280)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        // Header Title
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Master Documents",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Black,
                    color = textColor
                )
                Text(
                    text = "100% Offline • High Performance Reader",
                    fontSize = 12.sp,
                    color = subTextColor
                )
            }
            IconButton(
                onClick = onImportClick,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(accentColor.copy(alpha = 0.15f))
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add", tint = accentColor)
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Search Bar
        OutlinedTextField(
            value = uiState.searchQuery,
            onValueChange = onSearchChange,
            placeholder = { Text("Search offline documents...", color = subTextColor, fontSize = 14.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = subTextColor) },
            trailingIcon = {
                if (uiState.searchQuery.isNotEmpty()) {
                    IconButton(onClick = { onSearchChange("") }) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear", tint = subTextColor)
                    }
                }
            },
            singleLine = true,
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = accentColor,
                unfocusedBorderColor = if (isDarkMode) Color(0xFF27273A) else Color(0xFFE5E7EB),
                focusedContainerColor = cardBg,
                unfocusedContainerColor = cardBg,
                focusedTextColor = textColor,
                unfocusedTextColor = textColor
            ),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Category Filter Pills
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
                    color = if (isSelected) accentColor else cardBg,
                    border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) accentColor else if (isDarkMode) Color(0xFF27273A) else Color(0xFFE5E7EB)),
                    modifier = Modifier.clickable { onSelectFormat(fmt) }
                ) {
                    Text(
                        text = label,
                        fontSize = 12.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                        color = if (isSelected) Color.White else subTextColor,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Subheader Controls: Count & Sort Selectors
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${uiState.documents.size} documents indexed",
                fontSize = 12.sp,
                color = subTextColor,
                fontWeight = FontWeight.Medium
            )

            Row(verticalAlignment = Alignment.CenterVertically) {
                SortOption.entries.forEach { option ->
                    val isCurrent = uiState.sortBy == option
                    Text(
                        text = option.name,
                        fontSize = 11.sp,
                        fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal,
                        color = if (isCurrent) accentColor else subTextColor,
                        modifier = Modifier
                            .clickable { onSelectSort(option) }
                            .padding(horizontal = 6.dp, vertical = 4.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Main Document Grid / List View
        if (uiState.documents.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Outlined.Description,
                        contentDescription = null,
                        tint = subTextColor,
                        modifier = Modifier.size(54.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("No documents found", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = textColor)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Tap the + button to select PDFs, Word, Excel, or Markdown files",
                        fontSize = 12.sp,
                        color = subTextColor,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 24.dp)
                    )
                }
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(if (uiState.isGridView) 2 else 1),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(uiState.documents) { doc ->
                    DocumentCard(
                        doc = doc,
                        accentColor = accentColor,
                        isDarkMode = isDarkMode,
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
fun DocumentCard(
    doc: DocumentEntity,
    accentColor: Color,
    isDarkMode: Boolean,
    onOpen: () -> Unit,
    onToggleFavorite: () -> Unit,
    onShowDetails: () -> Unit,
    onRename: () -> Unit,
    onDelete: () -> Unit
) {
    var menuExpanded by remember { mutableStateOf(false) }
    val cardBg = if (isDarkMode) Color(0xFF14141C) else Color(0xFFFFFFFF)
    val textColor = if (isDarkMode) Color.White else Color(0xFF111827)
    val subTextColor = if (isDarkMode) Color(0xFF9CA3AF) else Color(0xFF6B7280)
    val borderColor = if (isDarkMode) Color(0xFF242432) else Color(0xFFE5E7EB)

    val formatBadgeColor = when (doc.format) {
        DocumentFormat.PDF -> Color(0xFFEF4444)
        DocumentFormat.DOCX, DocumentFormat.DOC -> Color(0xFF3B82F6)
        DocumentFormat.XLSX, DocumentFormat.XLS, DocumentFormat.CSV -> Color(0xFF10B981)
        DocumentFormat.PPTX, DocumentFormat.PPT -> Color(0xFFF59E0B)
        DocumentFormat.TXT, DocumentFormat.MD -> Color(0xFF8B5CF6)
        else -> Color(0xFF6B7280)
    }

    Surface(
        shape = RoundedCornerShape(18.dp),
        color = cardBg,
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onOpen() }
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = formatBadgeColor.copy(alpha = 0.18f)
                ) {
                    Text(
                        text = doc.format.name,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = formatBadgeColor,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }

                Row {
                    IconButton(onClick = onToggleFavorite, modifier = Modifier.size(28.dp)) {
                        Icon(
                            imageVector = if (doc.isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = "Favorite",
                            tint = if (doc.isFavorite) Color(0xFFEF4444) else subTextColor,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    Box {
                        IconButton(onClick = { menuExpanded = true }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.MoreVert, contentDescription = "More", tint = subTextColor, modifier = Modifier.size(18.dp))
                        }

                        DropdownMenu(
                            expanded = menuExpanded,
                            onDismissRequest = { menuExpanded = false },
                            modifier = Modifier.background(Color(0xFF1F1F2C))
                        ) {
                            DropdownMenuItem(
                                text = { Text("Details", color = Color.White) },
                                onClick = { menuExpanded = false; onShowDetails() },
                                leadingIcon = { Icon(Icons.Default.Info, contentDescription = null, tint = Color.White) }
                            )
                            DropdownMenuItem(
                                text = { Text("Rename", color = Color.White) },
                                onClick = { menuExpanded = false; onRename() },
                                leadingIcon = { Icon(Icons.Default.Edit, contentDescription = null, tint = Color.White) }
                            )
                            DropdownMenuItem(
                                text = { Text("Delete", color = Color(0xFFEF4444)) },
                                onClick = { menuExpanded = false; onDelete() },
                                leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null, tint = Color(0xFFEF4444)) }
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = doc.displayName,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = textColor,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = formatSize(doc.sizeBytes),
                    fontSize = 11.sp,
                    color = subTextColor
                )
                Text(
                    text = "${doc.pageCount} pages",
                    fontSize = 11.sp,
                    color = subTextColor
                )
            }
        }
    }
}

@Composable
fun ToolsTab(
    accentColor: Color,
    isDarkMode: Boolean,
    onOpenDocument: (DocumentEntity) -> Unit
) {
    val cardBg = if (isDarkMode) Color(0xFF141418) else Color(0xFFFFFFFF)
    val textColor = if (isDarkMode) Color.White else Color(0xFF111827)
    val subTextColor = if (isDarkMode) Color(0xFF9CA3AF) else Color(0xFF6B7280)

    val tools = listOf(
        Triple("Merge PDFs", "Combine multiple PDF files into one single document", Icons.Default.Description),
        Triple("Split PDF", "Extract page ranges or separate multi-page PDFs", Icons.Default.Build),
        Triple("Image to PDF", "Convert photo scans into high-quality PDFs", Icons.Default.Add),
        Triple("Text Inspector", "Extract raw text & contents from files offline", Icons.Default.Code),
        Triple("Watermark Tool", "Add custom diagonal header text watermarks", Icons.Default.Edit),
        Triple("Metadata Inspector", "Inspect author, creation date & file parameters", Icons.Default.Info)
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text("Document Utilities", fontSize = 24.sp, fontWeight = FontWeight.Black, color = textColor)
        Text("High-performance offline document tool suite", fontSize = 12.sp, color = subTextColor)

        Spacer(modifier = Modifier.height(16.dp))

        tools.forEach { (title, desc, icon) ->
            Surface(
                shape = RoundedCornerShape(18.dp),
                color = cardBg,
                border = androidx.compose.foundation.BorderStroke(1.dp, if (isDarkMode) Color(0xFF242432) else Color(0xFFE5E7EB)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp)
                    .clickable { }
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = accentColor.copy(alpha = 0.15f),
                        modifier = Modifier.size(44.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(icon, contentDescription = null, tint = accentColor, modifier = Modifier.size(22.dp))
                        }
                    }

                    Spacer(modifier = Modifier.width(14.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = textColor)
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(desc, fontSize = 11.sp, color = subTextColor)
                    }

                    Icon(Icons.Default.ArrowForward, contentDescription = null, tint = subTextColor, modifier = Modifier.size(18.dp))
                }
            }
        }
    }
}

@Composable
fun LockerTab(
    documents: List<DocumentEntity>,
    accentColor: Color,
    isDarkMode: Boolean,
    onOpenDocument: (DocumentEntity) -> Unit
) {
    var isUnlocked by remember { mutableStateOf(false) }
    var enteredPin by remember { mutableStateOf("") }
    val correctPin = "1234"

    val textColor = if (isDarkMode) Color.White else Color(0xFF111827)
    val subTextColor = if (isDarkMode) Color(0xFF9CA3AF) else Color(0xFF6B7280)

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
                color = accentColor.copy(alpha = 0.15f),
                modifier = Modifier.size(64.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = accentColor, modifier = Modifier.size(32.dp))
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text("Private File Vault", fontSize = 22.sp, fontWeight = FontWeight.Black, color = textColor)
            Spacer(modifier = Modifier.height(4.dp))
            Text("Enter 4-digit PIN to access encrypted files (Default: 1234)", fontSize = 12.sp, color = subTextColor, textAlign = TextAlign.Center)

            Spacer(modifier = Modifier.height(24.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                for (i in 0 until 4) {
                    val isFilled = i < enteredPin.length
                    Box(
                        modifier = Modifier
                            .size(16.dp)
                            .clip(CircleShape)
                            .background(if (isFilled) accentColor else if (isDarkMode) Color(0xFF272738) else Color(0xFFD1D5DB))
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            val keypad = listOf(
                listOf("1", "2", "3"),
                listOf("4", "5", "6"),
                listOf("7", "8", "9"),
                listOf("", "0", "DEL")
            )

            keypad.forEach { row ->
                Row(
                    horizontalArrangement = Arrangement.spacedBy(18.dp),
                    modifier = Modifier.padding(vertical = 6.dp)
                ) {
                    row.forEach { digit ->
                        if (digit.isEmpty()) {
                            Spacer(modifier = Modifier.size(54.dp))
                        } else {
                            Surface(
                                shape = CircleShape,
                                color = if (isDarkMode) Color(0xFF181822) else Color(0xFFE5E7EB),
                                modifier = Modifier
                                    .size(54.dp)
                                    .clickable {
                                        if (digit == "DEL") {
                                            if (enteredPin.isNotEmpty()) enteredPin = enteredPin.dropLast(1)
                                        } else if (enteredPin.length < 4) {
                                            enteredPin += digit
                                            if (enteredPin.length == 4) {
                                                if (enteredPin == correctPin) {
                                                    isUnlocked = true
                                                } else {
                                                    enteredPin = ""
                                                }
                                            }
                                        }
                                    }
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = digit,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = textColor
                                    )
                                }
                            }
                        }
                    }
                }
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
                Column {
                    Text("Vaulted Documents", fontSize = 22.sp, fontWeight = FontWeight.Black, color = textColor)
                    Text("Encrypted private storage", fontSize = 12.sp, color = subTextColor)
                }
                TextButton(onClick = { isUnlocked = false }) {
                    Text("Lock Vault", color = accentColor, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            val favoriteDocs = documents.filter { it.isFavorite }
            if (favoriteDocs.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No files added to vault", color = subTextColor, fontSize = 13.sp)
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(favoriteDocs) { doc ->
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = if (isDarkMode) Color(0xFF14141C) else Color(0xFFFFFFFF),
                            border = androidx.compose.foundation.BorderStroke(1.dp, if (isDarkMode) Color(0xFF242432) else Color(0xFFE5E7EB)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onOpenDocument(doc) }
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Lock, contentDescription = null, tint = accentColor)
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(doc.displayName, fontWeight = FontWeight.Bold, color = textColor, fontSize = 13.sp)
                                    Text("${doc.format.name} • ${formatSize(doc.sizeBytes)}", color = subTextColor, fontSize = 11.sp)
                                }
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
    isDarkMode: Boolean,
    onToggleDarkMode: () -> Unit,
    onSelectAccentColor: (Color) -> Unit,
    onOpenSupport: () -> Unit
) {
    val cardBg = if (isDarkMode) Color(0xFF141418) else Color(0xFFFFFFFF)
    val textColor = if (isDarkMode) Color.White else Color(0xFF111827)
    val subTextColor = if (isDarkMode) Color(0xFF9CA3AF) else Color(0xFF6B7280)

    val accents = listOf(
        Color(0xFFF59E0B), // Amber
        Color(0xFF10B981), // Emerald
        Color(0xFF8B5CF6), // Violet
        Color(0xFF3B82F6), // Blue
        Color(0xFFEF4444), // Coral
        Color(0xFF84CC16), // Lime
        Color(0xFF64748B)  // Slate
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text("Preferences & Info", fontSize = 24.sp, fontWeight = FontWeight.Black, color = textColor)
        Text("Customize app appearance & view license details", fontSize = 12.sp, color = subTextColor)

        Spacer(modifier = Modifier.height(18.dp))

        // Accent Palette Selector Card
        Surface(
            shape = RoundedCornerShape(18.dp),
            color = cardBg,
            border = androidx.compose.foundation.BorderStroke(1.dp, if (isDarkMode) Color(0xFF242432) else Color(0xFFE5E7EB)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("ACCENT COLOR THEME", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = subTextColor)
                Spacer(modifier = Modifier.height(12.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    accents.forEach { color ->
                        val isSelected = accentColor == color
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(color)
                                .clickable { onSelectAccentColor(color) },
                            contentAlignment = Alignment.Center
                        ) {
                            if (isSelected) {
                                Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Dark / Light Theme Toggle Card
        Surface(
            shape = RoundedCornerShape(18.dp),
            color = cardBg,
            border = androidx.compose.foundation.BorderStroke(1.dp, if (isDarkMode) Color(0xFF242432) else Color(0xFFE5E7EB)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .padding(16.dp)
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Appearance Mode", fontWeight = FontWeight.Bold, color = textColor, fontSize = 14.sp)
                    Text(if (isDarkMode) "AMOLED Pitch Black" else "Paper Light", color = subTextColor, fontSize = 12.sp)
                }

                Switch(
                    checked = isDarkMode,
                    onCheckedChange = { onToggleDarkMode() },
                    colors = SwitchDefaults.colors(checkedThumbColor = accentColor, checkedTrackColor = accentColor.copy(alpha = 0.3f))
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Support Developer Card
        Surface(
            shape = RoundedCornerShape(18.dp),
            color = cardBg,
            border = androidx.compose.foundation.BorderStroke(1.dp, if (isDarkMode) Color(0xFF242432) else Color(0xFFE5E7EB)),
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onOpenSupport() }
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = CircleShape,
                    color = Color(0xFFEF4444).copy(alpha = 0.15f),
                    modifier = Modifier.size(42.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Favorite, contentDescription = null, tint = Color(0xFFEF4444))
                    }
                }

                Spacer(modifier = Modifier.width(14.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text("Support the Creator via UPI", color = textColor, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Contribute via UPI or QR code to keep Paperwren ad-free", color = subTextColor, fontSize = 11.sp)
                }

                Icon(Icons.Default.ArrowForward, contentDescription = null, tint = subTextColor)
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
fun DocumentReaderScreen(
    doc: DocumentEntity,
    accentColor: Color,
    isDarkMode: Boolean,
    onBack: () -> Unit,
    onShowDetails: () -> Unit
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(if (isDarkMode) Color(0xFF0F0F14) else Color(0xFFF3F4F6))
    ) {
        // Top Toolbar
        Surface(
            color = if (isDarkMode) Color(0xFF161620) else Color(0xFFFFFFFF),
            shadowElevation = 4.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = if (isDarkMode) Color.White else Color.Black)
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(doc.displayName, fontWeight = FontWeight.Bold, color = if (isDarkMode) Color.White else Color.Black, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text("${doc.format.name} Reader", fontSize = 11.sp, color = accentColor)
                }

                IconButton(onClick = onShowDetails) {
                    Icon(Icons.Default.Info, contentDescription = "Details", tint = accentColor)
                }
            }
        }

        // Reader Viewport
        Box(
            modifier = Modifier
                .fillMaxSize()
                .weight(1f),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.Description, contentDescription = null, tint = accentColor, modifier = Modifier.size(64.dp))
                Spacer(modifier = Modifier.height(12.dp))
                Text("Viewing: ${doc.displayName}", fontWeight = FontWeight.Bold, color = if (isDarkMode) Color.White else Color.Black, fontSize = 15.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text("Format: ${doc.format.name} • ${formatSize(doc.sizeBytes)}", color = Color(0xFF9CA3AF), fontSize = 12.sp)
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
