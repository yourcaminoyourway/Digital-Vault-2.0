import { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { getDocuments } from '../../services/api'
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
}

type Stats = {
  total: number
}

export default function HomeScreen() {
  const { user } = useAuth()
  const { width } = useWindowDimensions()
  const isTablet = width >= 768

  const [recentDocs, setRecentDocs] = useState<Document[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string>('')

  async function fetchData() {
    try {
      const data = await getDocuments(1, 5)
      setRecentDocs(data.documents ?? [])
      setStats({ total: data.total ?? 0 })
      setError('')
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Could not load documents — pull down to retry'
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  function onRefresh() {
    setRefreshing(true)
    fetchData()
  }

  const firstName = user?.fullName?.split(' ')[0] ?? 'there'

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        isTablet && styles.contentTablet,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#6366f1"
        />
      }
      ListHeaderComponent={
        <>
          {/* Welcome header */}
          <View style={[styles.welcomeCard, isTablet && styles.cardTablet]}>
            <Text style={styles.greeting}>Good day, {firstName}! 👋</Text>
            <Text style={styles.subtitle}>
              Your documents are safe and organized.
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Documents</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{user?.role ?? 'user'}</Text>
                <Text style={styles.statLabel}>Role</Text>
              </View>
            </View>
          </View>

          {/* Quick actions */}
          <View style={[styles.actionsRow, isTablet && styles.actionsTablet]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/document/new')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>+ New Document</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonOutline}
              onPress={() => router.push('/(tabs)/documents')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonOutlineText}>Browse All</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Recent Documents</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchData}>
                <Text style={styles.errorRetry}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </>
      }
      data={recentDocs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.docItem, isTablet && styles.cardTablet]}
          onPress={() => router.push(`/document/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.docIcon}>
            <Text style={styles.docIconText}>📄</Text>
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={styles.docDesc} numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <Text style={styles.docMeta}>
              {new Date(item.createdAt).toLocaleDateString()} · {item.viewCount} views
            </Text>
          </View>
          <Text style={styles.docChevron}>›</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <EmptyState
          message="No documents yet"
          subMessage="Tap '+ New Document' to create one"
        />
      }
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  contentTablet: {
    maxWidth: 768,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  welcomeCard: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    padding: 20,
    marginBottom: 4,
  },
  cardTablet: {
    borderRadius: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#c7d2fe',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: 12,
    color: '#c7d2fe',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionsTablet: {
    maxWidth: 400,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  actionButtonOutline: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6366f1',
  },
  actionButtonOutlineText: {
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e1b4b',
    marginTop: 8,
    marginBottom: 4,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docIconText: {
    fontSize: 20,
  },
  docInfo: {
    flex: 1,
    gap: 2,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  docDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  docMeta: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  docChevron: {
    fontSize: 22,
    color: '#d1d5db',
    lineHeight: 26,
  },
  errorBanner: {
    marginTop: 4,
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
    fontWeight: '700',
    color: '#dc2626',
  },
})
