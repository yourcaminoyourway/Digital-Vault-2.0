import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { getDocuments } from '../../services/api'
import DocumentCard from '../../components/DocumentCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'

type Document = {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  viewCount: number
  createdAt: string
  categoryName: string | null
  categoryColor: string | null
  tags: string[] | null
  userId: string
}

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [error, setError] = useState<string>('')

  const fetchDocuments = useCallback(
    async (pageNum = 1, searchTerm = search, reset = false) => {
      if (pageNum === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      try {
        const data = await getDocuments(pageNum, 20, searchTerm || undefined)
        const newDocs = data.documents ?? []

        if (reset || pageNum === 1) {
          setDocuments(newDocs)
        } else {
          setDocuments((prev) => [...prev, ...newDocs])
        }

        setTotalPages(data.totalPages ?? 1)
        setPage(pageNum)
        setError('')
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Network error — pull down to retry'
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
        setLoadingMore(false)
      }
    },
    [search]
  )

  useEffect(() => {
    fetchDocuments(1, search, true)
  }, [search])

  useEffect(() => {
    fetchDocuments(1)
  }, [])

  function onRefresh() {
    setRefreshing(true)
    fetchDocuments(1, search, true)
  }

  function handleSearch() {
    setSearch(searchInput)
  }

  function handleLoadMore() {
    if (!loadingMore && page < totalPages) {
      fetchDocuments(page + 1)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents..."
          placeholderTextColor="#9ca3af"
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchDocuments(1, search, true)}>
            <Text style={styles.errorRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        contentContainerStyle={styles.listContent}
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DocumentCard
            document={item}
            onPress={() => router.push(`/document/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <EmptyState
            message="No documents found"
            subMessage={
              search ? 'Try a different search term' : 'Create your first document'
            }
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              style={styles.loader}
              color="#6366f1"
              size="small"
            />
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/document/new')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  searchRow: {
    padding: 12,
    paddingBottom: 8,
    backgroundColor: '#f0f4ff',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  listContent: {
    padding: 12,
    paddingTop: 4,
    gap: 10,
    paddingBottom: 100,
  },
  loader: {
    paddingVertical: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
    marginTop: -2,
  },
  errorBanner: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
  },
  errorRetry: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
})
