package com.paperwren.documentreader.viewmodel

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.paperwren.documentreader.data.model.DocumentEntity
import com.paperwren.documentreader.data.model.DocumentFormat
import com.paperwren.documentreader.data.repository.DocumentRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class LibraryUiState(
    val documents: List<DocumentEntity> = emptyList(),
    val searchQuery: String = "",
    val selectedFormat: DocumentFormat? = null,
    val sortBy: SortOption = SortOption.DATE,
    val isAscending: Boolean = false,
    val isGridView: Boolean = true,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

enum class SortOption {
    NAME, DATE, SIZE, TYPE
}

class DocumentViewModel(
    private val repository: DocumentRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    private val _selectedFormat = MutableStateFlow<DocumentFormat?>(null)
    private val _sortBy = MutableStateFlow(SortOption.DATE)
    private val _isAscending = MutableStateFlow(false)
    private val _isGridView = MutableStateFlow(true)

    val uiState: StateFlow<LibraryUiState> = combine(
        repository.allDocuments,
        _searchQuery,
        _selectedFormat,
        _sortBy,
        _isAscending,
        _isGridView
    ) { docs, query, formatFilter, sort, asc, grid ->
        var filtered = docs

        if (query.isNotBlank()) {
            filtered = filtered.filter { it.displayName.contains(query, ignoreCase = true) }
        }

        if (formatFilter != null) {
            filtered = filtered.filter { it.format == formatFilter }
        }

        filtered = when (sort) {
            SortOption.NAME -> if (asc) filtered.sortedBy { it.displayName.lowercase() } else filtered.sortedByDescending { it.displayName.lowercase() }
            SortOption.DATE -> if (asc) filtered.sortedBy { it.lastOpenedAt } else filtered.sortedByDescending { it.lastOpenedAt }
            SortOption.SIZE -> if (asc) filtered.sortedBy { it.sizeBytes } else filtered.sortedByDescending { it.sizeBytes }
            SortOption.TYPE -> if (asc) filtered.sortedBy { it.format.name } else filtered.sortedByDescending { it.format.name }
        }

        LibraryUiState(
            documents = filtered,
            searchQuery = query,
            selectedFormat = formatFilter,
            sortBy = sort,
            isAscending = asc,
            isGridView = grid
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), LibraryUiState())

    val recentDocuments = repository.recentDocuments.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    val favoriteDocuments = repository.favoriteDocuments.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    fun importDocument(uri: Uri) {
        viewModelScope.launch {
            try {
                repository.importDocumentFromUri(uri)
            } catch (e: Exception) {
                // handle error state
            }
        }
    }

    fun toggleFavorite(document: DocumentEntity) {
        viewModelScope.launch {
            repository.toggleFavorite(document.id, document.isFavorite)
        }
    }

    fun deleteDocument(id: String) {
        viewModelScope.launch {
            repository.deleteDocument(id)
        }
    }

    fun renameDocument(id: String, newName: String) {
        viewModelScope.launch {
            repository.renameDocument(id, newName)
        }
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setFormatFilter(format: DocumentFormat?) {
        _selectedFormat.value = format
    }

    fun setSortOption(sort: SortOption) {
        if (_sortBy.value == sort) {
            _isAscending.value = !_isAscending.value
        } else {
            _sortBy.value = sort
            _isAscending.value = false
        }
    }

    fun toggleViewMode() {
        _isGridView.value = !_isGridView.value
    }
}
