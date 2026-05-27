/**
 * Human-readable file size. Picks the right unit so small files don't
 * show as "0.0 MB".
 *   840    -> "840 B"
 *   12_345 -> "12.1 KB"
 *   3_500_000 -> "3.3 MB"
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(mb < 10 ? 2 : 1)} MB`
}
