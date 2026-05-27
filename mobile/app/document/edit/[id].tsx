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
import { router, useLocalSearchParams } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import {
  getDocument,
  getCategories,
  updateDocument,
  uploadDocumentFile,
  deleteDocumentFile,
} from '../../../services/api'
import LoadingSpinner from '../../../components/LoadingSpinner'

type Category = {
  id: string
  name: string
  color: string
}

const MAX_FILE_BYTES = 3 * 1024 * 1024

export default function EditDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [tags, setTags] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingDoc, setLoadingDoc] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [loadError, setLoadError] = useState<string>('')

  // File state
  const [currentFile, setCurrentFile] = useState<{
    fileName: string | null
    fileSize: number | null
  }>({ fileName: null, fileSize: null })
  const [fileBusy, setFileBusy] = useState(false)
  const [fileMsg, setFileMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  async function pickAndUpload() {
    setFileMsg(null)
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: '*/*',
      })
      if (result.canceled || !result.assets?.[0]) return
      const asset = result.assets[0]
      if (asset.size && asset.size > MAX_FILE_BYTES) {
        setFileMsg({
          type: 'error',
          text: `File too large (${(asset.size / 1024 / 1024).toFixed(1)} MB). Max 3 MB.`,
        })
        return
      }
      setFileBusy(true)
      const res = await uploadDocumentFile(id!, {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
      })
      setCurrentFile({
        fileName: res.data?.fileName ?? asset.name,
        fileSize: res.data?.fileSize ?? asset.size ?? null,
      })
      setFileMsg({ type: 'success', text: 'File uploaded successfully.' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setFileMsg({ type: 'error', text: msg })
    } finally {
      setFileBusy(false)
    }
  }

  async function removeFile() {
    setFileMsg(null)
    setFileBusy(true)
    try {
      await deleteDocumentFile(id!)
      setCurrentFile({ fileName: null, fileSize: null })
      setFileMsg({ type: 'success', text: 'File removed.' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not remove file'
      setFileMsg({ type: 'error', text: msg })
    } finally {
      setFileBusy(false)
    }
  }

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const [docRes, catRes] = await Promise.all([
          getDocument(id!),
          getCategories(),
        ])
        const doc = docRes.data
        if (!doc) {
          setLoadError('Document not found')
          return
        }
        setTitle(doc.title ?? '')
        setDescription(doc.description ?? '')
        setCategoryId(doc.categoryId ?? '')
        setIsPublic(!!doc.isPublic)
        setTags(Array.isArray(doc.tags) ? doc.tags.join(', ') : '')
        setCategories(catRes.data ?? [])
        setCurrentFile({
          fileName: doc.fileName ?? null,
          fileSize: doc.fileSize ?? null,
        })
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Failed to load document'
        setLoadError(message)
      } finally {
        setLoadingDoc(false)
      }
    }
    load()
  }, [id])

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required')
      return
    }
    setSaving(true)
    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      await updateDocument(id!, {
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId || undefined,
        isPublic,
        tags: tagList,
      })

      router.replace(`/document/${id}`)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update document'
      Alert.alert('Error', message)
    } finally {
      setSaving(false)
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId)

  if (loadingDoc) return <LoadingSpinner />

  if (loadError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>{loadError}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

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
            />
          </View>

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
                {selectedCategory ? selectedCategory.name : 'No category'}
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

          {/* File attachment */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Attached File</Text>
            {fileMsg ? (
              <View
                style={[
                  styles.msgPill,
                  fileMsg.type === 'success'
                    ? styles.msgPillSuccess
                    : styles.msgPillError,
                ]}
              >
                <Text
                  style={
                    fileMsg.type === 'success'
                      ? styles.msgPillSuccessText
                      : styles.msgPillErrorText
                  }
                >
                  {fileMsg.text}
                </Text>
              </View>
            ) : null}
            {currentFile.fileName ? (
              <View style={styles.fileRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileRowName} numberOfLines={1}>
                    📎 {currentFile.fileName}
                  </Text>
                  {currentFile.fileSize != null && (
                    <Text style={styles.fileRowMeta}>
                      {(currentFile.fileSize / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={pickAndUpload}
                  disabled={fileBusy}
                  style={styles.fileBtnSecondary}
                >
                  <Text style={styles.fileBtnSecondaryText}>
                    {fileBusy ? '…' : 'Replace'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={removeFile}
                  disabled={fileBusy}
                  style={styles.fileBtnDanger}
                >
                  <Text style={styles.fileBtnDangerText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.filePickerBtn}
                onPress={pickAndUpload}
                disabled={fileBusy}
                activeOpacity={0.7}
              >
                <Text style={styles.filePickerBtnText}>
                  {fileBusy ? 'Uploading…' : '📎 Attach a file'}
                </Text>
                <Text style={styles.hint}>Max 3 MB · stored in your account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {saving ? 'Saving...' : 'Save Changes'}
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
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
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
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  required: { color: '#ef4444' },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
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
  pickerText: { fontSize: 15, color: '#111827' },
  pickerPlaceholder: { color: '#9ca3af' },
  pickerChevron: { fontSize: 12, color: '#9ca3af' },
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
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  dropdownItemText: { fontSize: 15, color: '#374151' },
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
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelButton: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  cancelButtonText: { color: '#6b7280', fontSize: 15, fontWeight: '600' },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f0f4ff',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 12,
  },
  backLink: { color: '#6366f1', fontWeight: '600' },
  filePickerBtn: {
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  filePickerBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  fileRowName: { fontSize: 14, fontWeight: '600', color: '#3730a3' },
  fileRowMeta: { fontSize: 12, color: '#6366f1', marginTop: 2 },
  fileBtnSecondary: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  fileBtnSecondaryText: { fontSize: 12, fontWeight: '700', color: '#4338ca' },
  fileBtnDanger: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  fileBtnDangerText: { fontSize: 12, fontWeight: '700', color: '#b91c1c' },
  msgPill: { borderRadius: 8, padding: 10, marginBottom: 8 },
  msgPillSuccess: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  msgPillSuccessText: { color: '#166534', fontSize: 13, fontWeight: '600' },
  msgPillError: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  msgPillErrorText: { color: '#991b1b', fontSize: 13, fontWeight: '600' },
})
