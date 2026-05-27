import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import {
  createDocument,
  getCategories,
  uploadDocumentFile,
} from '../../services/api'

const MAX_FILE_BYTES = 3 * 1024 * 1024

type Category = {
  id: string
  name: string
  color: string
}

export default function NewDocumentScreen() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [tags, setTags] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [pickedFile, setPickedFile] = useState<{
    uri: string
    name: string
    size: number
    mimeType?: string | null
  } | null>(null)
  const [uploadMsg, setUploadMsg] = useState<string>('')

  async function pickFile() {
    setUploadMsg('')
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: '*/*',
      })
      if (result.canceled || !result.assets?.[0]) return
      const asset = result.assets[0]
      if (asset.size && asset.size > MAX_FILE_BYTES) {
        setUploadMsg(
          `File too large (${(asset.size / 1024 / 1024).toFixed(1)} MB). Max 3 MB.`
        )
        return
      }
      setPickedFile({
        uri: asset.uri,
        name: asset.name,
        size: asset.size ?? 0,
        mimeType: asset.mimeType,
      })
    } catch (err) {
      setUploadMsg(
        err instanceof Error ? err.message : 'Could not open file picker'
      )
    }
  }

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.data ?? []))
      .catch(() => {})
  }, [])

  async function handleCreate() {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required')
      return
    }

    setLoading(true)
    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const data = await createDocument({
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId || undefined,
        isPublic,
        tags: tagList,
      })

      const docId = data.data.id

      if (pickedFile) {
        try {
          await uploadDocumentFile(docId, pickedFile)
        } catch (uploadErr) {
          const msg =
            uploadErr instanceof Error
              ? uploadErr.message
              : 'File upload failed'
          Alert.alert(
            'File not attached',
            `${msg}\n\nThe document was created without the file. You can attach it from the edit screen.`
          )
        }
      }

      router.replace(`/document/${docId}`)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to create document'
      Alert.alert('Error', message)
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId)

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Document title"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Optional description..."
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Category picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text
                style={[
                  styles.pickerText,
                  !selectedCategory && styles.pickerPlaceholder,
                ]}
              >
                {selectedCategory ? selectedCategory.name : 'Select category'}
              </Text>
              <Text style={styles.pickerChevron}>
                {showCategoryPicker ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={styles.dropdownList}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setCategoryId('')
                    setShowCategoryPicker(false)
                  }}
                >
                  <Text style={styles.dropdownItemText}>No category</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCategoryId(cat.id)
                      setShowCategoryPicker(false)
                    }}
                  >
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: cat.color },
                      ]}
                    />
                    <Text style={styles.dropdownItemText}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Tags */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.input}
              placeholder="important, draft, review"
              placeholderTextColor="#9ca3af"
              value={tags}
              onChangeText={setTags}
            />
            <Text style={styles.hint}>Separate tags with commas</Text>
          </View>

          {/* Visibility toggle */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Public</Text>
              <Text style={styles.hint}>Anyone with the link can view</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
              thumbColor={isPublic ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          {/* Attach file */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Attach File (optional)</Text>
            {pickedFile ? (
              <View style={styles.filePill}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {pickedFile.name}
                  </Text>
                  <Text style={styles.fileMeta}>
                    {(pickedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPickedFile(null)}>
                  <Text style={styles.fileRemove}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.filePickerButton}
                onPress={pickFile}
                activeOpacity={0.7}
              >
                <Text style={styles.filePickerButtonText}>📎 Pick a file</Text>
                <Text style={styles.hint}>Max 3 MB · stored in your account</Text>
              </TouchableOpacity>
            )}
            {uploadMsg ? (
              <Text style={styles.errorHint}>{uploadMsg}</Text>
            ) : null}
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating...' : 'Create Document'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
  },
  pickerText: {
    fontSize: 15,
    color: '#111827',
  },
  pickerPlaceholder: {
    color: '#9ca3af',
  },
  pickerChevron: {
    fontSize: 12,
    color: '#9ca3af',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#374151',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
  filePickerButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  filePickerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  filePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3730a3',
  },
  fileMeta: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 2,
  },
  fileRemove: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '600',
  },
  errorHint: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
})
