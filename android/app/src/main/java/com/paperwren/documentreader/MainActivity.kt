package com.paperwren.documentreader

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import com.paperwren.documentreader.data.model.DocumentEntity
import com.paperwren.documentreader.data.model.DocumentFormat
import com.paperwren.documentreader.viewmodel.DocumentViewModel

class MainActivity : ComponentActivity() {

    private val openDocumentLauncher = registerForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        uri?.let {
            contentResolver.takePersistableUriPermission(
                it,
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            )
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
    var showSupportSheet by remember { mutableStateOf(false) }

    // Liquid Glass Palette (AMOLED Deep Black)
    val amoledBg = Color(0xFF000000)
    val glassCard = Color(0xFF141418)
    val glassBorder = Color(0xFF26262F)
    val accentBlue = Color(0xFF3B82F6)

    MaterialTheme(
        colorScheme = darkColorScheme(
            background = amoledBg,
            surface = glassCard,
            primary = accentBlue,
            onBackground = Color(0xFFF3F4F6),
            onSurface = Color(0xFFF3F4F6)
        )
    ) {
        Scaffold(
            containerColor = amoledBg,
            floatingActionButton = {
                if (selectedTab == 0) {
                    FloatingActionButton(
                        onClick = onImportDocument,
                        containerColor = accentBlue,
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
                    onSelectTab = { selectedTab = it },
                    onOpenSupport = { showSupportSheet = true }
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
                        onImportClick = onImportDocument,
                        onToggleFavorite = { viewModel.toggleFavorite(it) },
                        onDelete = { viewModel.deleteDocument(it.id) },
                        onSearchChange = { viewModel.setSearchQuery(it) },
                        onSelectFormat = { viewModel.setFormatFilter(it) }
                    )
                    1 -> ToolsTab()
                    2 -> LockerTab()
                    3 -> SettingsTab(
                        onOpenSupport = { showSupportSheet = true }
                    )
                }

                if (showSupportSheet) {
                    SupportSheet(onDismiss = { showSupportSheet = false })
                }
            }
        }
    }
}

@Composable
fun LiquidGlassBottomBar(
    selectedTab: Int,
    onSelectTab: (Int) -> Unit,
    onOpenSupport: () -> Unit
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
                Triple(0, "Documents", Icons.Default.Description),
                Triple(1, "Tools", Icons.Default.Build),
                Triple(2, "Locker", Icons.Default.Lock),
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
                        tint = if (isSelected) Color(0xFF3B82F6) else Color(0xFF9CA3AF),
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = label,
                        fontSize = 11.sp,
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                        color = if (isSelected) Color(0xFF3B82F6) else Color(0xFF9CA3AF)
                    )
                }
            }
        }
    }
}

@Composable
fun DocumentsTab(
    uiState: com.paperwren.documentreader.viewmodel.LibraryUiState,
    onImportClick: () -> Unit,
    onToggleFavorite: (DocumentEntity) -> Unit,
    onDelete: (DocumentEntity) -> Unit,
    onSearchChange: (String) -> Unit,
    onSelectFormat: (DocumentFormat?) -> Unit
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
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "Zero-Cloud • Fast Local Reader",
                    fontSize = 13.sp,
                    color = Color(0xFF9CA3AF)
                )
            }
            Surface(
                shape = CircleShape,
                color = Color(0xFF1F2937),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF374151))
            ) {
                IconButton(onClick = onImportClick) {
                    Icon(Icons.Default.Add, contentDescription = "Import", tint = Color(0xFF60A5FA))
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Search Bar
        OutlinedTextField(
            value = uiState.searchQuery,
            onValueChange = onSearchChange,
            placeholder = { Text("Search offline documents...", color = Color(0xFF6B7280)) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color(0xFF9CA3AF)) },
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp)),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = Color(0xFF16161D),
                unfocusedContainerColor = Color(0xFF16161D),
                focusedBorderColor = Color(0xFF3B82F6),
                unfocusedBorderColor = Color(0xFF272733),
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            ),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Document count indicator
        Text(
            text = "${uiState.documents.size} documents indexed",
            fontSize = 12.sp,
            color = Color(0xFF9CA3AF),
            modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
        )

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
                        "No documents imported yet",
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
                        onToggleFavorite = { onToggleFavorite(doc) },
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
    onToggleFavorite: () -> Unit,
    onDelete: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
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
                    imageVector = if (doc.isFavorite) Icons.Default.Favorite else Icons.Outlined.FavoriteBorder,
                    contentDescription = "Favorite",
                    tint = if (doc.isFavorite) Color(0xFFEF4444) else Color(0xFF6B7280)
                )
            }

            IconButton(onClick = onDelete) {
                Icon(
                    Icons.Outlined.Delete,
                    contentDescription = "Delete",
                    tint = Color(0xFF6B7280)
                )
            }
        }
    }
}

@Composable
fun ToolsTab() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Document Tools",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
        Text(
            text = "Offline document utilities & converters",
            fontSize = 13.sp,
            color = Color(0xFF9CA3AF),
            modifier = Modifier.padding(bottom = 16.dp)
        )

        val tools = listOf(
            Triple("Merge PDFs", "Combine multiple PDF files into one", Icons.Default.Layers),
            Triple("Split PDF", "Extract specific pages or page ranges", Icons.Default.ContentCut),
            Triple("Compress PDF", "Reduce document file size locally", Icons.Default.Archive),
            Triple("Extract Text", "Convert scans or docs to plain Markdown", Icons.Default.TextFields),
            Triple("Word to PDF", "Render Word documents to PDF", Icons.Default.Transform),
            Triple("Watermark Engine", "Add confidential or custom stamps", Icons.Default.Star)
        )

        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(tools) { (title, subtitle, icon) ->
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF13131A),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF242432)),
                    modifier = Modifier.fillMaxWidth()
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
                                Icon(icon, contentDescription = null, tint = Color(0xFF60A5FA))
                            }
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(title, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                            Text(subtitle, color = Color(0xFF9CA3AF), fontSize = 12.sp)
                        }
                        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = Color(0xFF4B5563))
                    }
                }
            }
        }
    }
}

@Composable
fun LockerTab() {
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
                Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF60A5FA), modifier = Modifier.size(36.dp))
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text("Private File Locker", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            "Encrypted offline vault for confidential contracts, ID proofs and private docs.",
            fontSize = 13.sp,
            color = Color(0xFF9CA3AF),
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = {},
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Set PIN & Unlock Locker", fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun SettingsTab(onOpenSupport: () -> Unit) {
    val context = LocalContext.current
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("Settings", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(modifier = Modifier.height(16.dp))

        Surface(
            shape = RoundedCornerShape(16.dp),
            color = Color(0xFF13131A),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF242432)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("APPEARANCE", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF6B7280))
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("AMOLED Deep Black Theme", color = Color.White)
                    Switch(
                        checked = true,
                        onCheckedChange = {},
                        colors = SwitchDefaults.colors(checkedThumbColor = Color(0xFF3B82F6))
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

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
                Icon(Icons.Default.Code, contentDescription = null, tint = Color(0xFF60A5FA))
                Spacer(modifier = Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("GitHub Source Code", color = Color.White, fontWeight = FontWeight.Medium)
                    Text("mahesh2008here / master-documents", color = Color(0xFF9CA3AF), fontSize = 12.sp)
                }
                Icon(Icons.Default.OpenInNew, contentDescription = null, tint = Color(0xFF6B7280))
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

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
                    Text("Support Project", color = Color.White, fontWeight = FontWeight.Medium)
                    Text("Support the developer via UPI / QR", color = Color(0xFF9CA3AF), fontSize = 12.sp)
                }
                Icon(Icons.Default.ChevronRight, contentDescription = null, tint = Color(0xFF6B7280))
            }
        }
    }
}

@Composable
fun SupportSheet(onDismiss: () -> Unit) {
    var revealed by remember { mutableStateOf(false) }
    val upiId = "mahesh.2008here@oksbi"

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
                    "Your contribution supports 100% offline, privacy-first software development with zero tracking.",
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
                        .clickable { revealed = !revealed }
                        .padding(8.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("UPI PAYMENT ADDRESS", fontSize = 11.sp, color = Color(0xFF9CA3AF), fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = if (revealed) upiId else "Tap to reveal UPI ID",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (revealed) Color(0xFF34D399) else Color(0xFF60A5FA)
                        )
                    }
                }
            }
        }
    )
}

fun formatSize(bytes: Long): String {
    if (bytes <= 0) return "0 B"
    val kb = bytes / 1024.0
    val mb = kb / 1024.0
    return if (mb >= 1.0) String.format("%.1f MB", mb) else String.format("%.0f KB", kb)
}
