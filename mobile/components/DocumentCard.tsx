import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'

type DocumentCardProps = {
  document: {
    id: string
    title: string
    description?: string | null
    isPublic: boolean
    viewCount: number
    createdAt: string
    categoryName?: string | null
    categoryColor?: string | null
    tags?: string[] | null
    userId?: string
  }
  onPress?: () => void
}

export default function DocumentCard({ document, onPress }: DocumentCardProps) {
  const formattedDate = new Date(document.createdAt).toLocaleDateString(
    'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' }
  )

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.iconRow}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>📄</Text>
        </View>
        <View style={styles.textContent}>
          <Text style={styles.title} numberOfLines={1}>
            {document.title}
          </Text>
          {document.description && (
            <Text style={styles.description} numberOfLines={2}>
              {document.description}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        {document.categoryName && (
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor: `${document.categoryColor ?? '#6366f1'}20`,
                borderColor: `${document.categoryColor ?? '#6366f1'}40`,
              },
            ]}
          >
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: document.categoryColor ?? '#6366f1' },
              ]}
            />
            <Text
              style={[
                styles.categoryText,
                { color: document.categoryColor ?? '#6366f1' },
              ]}
            >
              {document.categoryName}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.visibilityBadge,
            document.isPublic ? styles.publicBadge : styles.privateBadge,
          ]}
        >
          <Text
            style={[
              styles.visibilityText,
              document.isPublic ? styles.publicText : styles.privateText,
            ]}
          >
            {document.isPublic ? 'Public' : 'Private'}
          </Text>
        </View>
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaText}>{formattedDate}</Text>
        <Text style={styles.metaText}>{document.viewCount} views</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 18,
  },
  textContent: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  visibilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  publicBadge: {
    backgroundColor: '#d1fae5',
  },
  privateBadge: {
    backgroundColor: '#f3f4f6',
  },
  visibilityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  publicText: {
    color: '#065f46',
  },
  privateText: {
    color: '#6b7280',
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 11,
    color: '#9ca3af',
  },
})
