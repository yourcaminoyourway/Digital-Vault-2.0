export type ApiResponse<T> = {
  data?: T
  error?: string
  message?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  totalPages: number
  limit: number
}

export type DocumentFilters = {
  search?: string
  categoryId?: string
  isPublic?: boolean
  page?: number
  limit?: number
}

export type CreateDocumentInput = {
  title: string
  description?: string
  categoryId?: string
  isPublic?: boolean
  tags?: string[]
  fileUrl?: string
  fileKey?: string
  fileSize?: number
  mimeType?: string
}

export type UpdateDocumentInput = Partial<CreateDocumentInput>

export type UserStats = {
  totalDocuments: number
  publicDocuments: number
  privateDocuments: number
  totalCategories: number
  totalViews: number
}
