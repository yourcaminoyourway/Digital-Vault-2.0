import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { getDocument, deleteDocument } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'

type Document = {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  categoryName: string | null
  categoryColor: string | null
  tags: string[] | null
  userId: string
  fileUrl: string | null
  fileSize: number | null
  mimeType: string | null
}

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getDocument(id)
      .then((data) => setDocument(data.data))
      .catch(() => Alert.alert('Error', 'Failed to load document'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    Alert.alert('Delete Document', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(id!)
            router.back()
          } catch {
            Alert.alert('Error', 'Failed to delete document')
          }
        },
      },
    ])
  }

  if (loading) return <LoadingSpinner />

  if (!document) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Document not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.title}>{document.title}</Text>
        {document.description && (
          <Text style={styles.description}>{document.description}</Text>
        )}

        <View style={styles.badges}>
          <View
            style={[
              styles.badge,
              document.isPublic ? styles.badgeGreen : styles.badgeGray,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                document.isPublic ? styles.badgeTextGreen : styles.badgeTextGray,
              ]}
            >
              {document.isPublic ? '🌍 Public' : '🔒 Private'}
            </Text>
          </View>

          {document.categoryName && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: `${document.categoryColor ?? '#6366f1'}20`,
                  borderColor: `${document.categoryColor ?? '#6366f1'}40`,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: document.categoryColor ?? '#6366f1' },
                ]}
              >
                {document.categoryName}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Metadata */}
      <View style={styles.metaCard}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Created</Text>
          <Text style={styles.metaValue}>
            {new Date(document.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Views</Text>
          <Text style={styles.metaValue}>{document.viewCount}</Text>
        </View>
        {document.fileSize != null && (
          <>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>File Size</Text>
              <Text style={styles.metaValue}>
                {(document.fileSize / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Tags */}
      {document.tags && document.tags.length > 0 && (
        <View style={styles.tagsSection}>
          <Text style={styles.tagsLabel}>Tags</Text>
          <View style={styles.tagsRow}>
            {document.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Delete button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
        activeOpacity={0.8}
      >
        <Text style={styles.deleteButtonText}>Delete Document</Text>
      </TouchableOpacity>
    </ScrollView>
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
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  notFound: {
    fontSize: 16,
    color: '#6b7280',
  },
  backLink: {
    color: '#6366f1',
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 26,
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeGreen: {
    backgroundColor: '#d1fae5',
    borderColor: '#6ee7b7',
  },
  badgeGray: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextGreen: {
    color: '#065f46',
  },
  badgeTextGray: {
    color: '#6b7280',
  },
  metaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  metaLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },
  tagsSection: {
    gap: 8,
  },
  tagsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
})
