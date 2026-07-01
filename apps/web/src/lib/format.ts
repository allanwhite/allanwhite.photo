export function formatDate(value?: string): string {
  if (!value) return ''

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function hrefForType(type: string, slug?: string): string {
  if (!slug) return '#'

  if (type === 'photo') return `/photos/${slug}`
  if (type === 'gallery') return `/galleries/${slug}`
  if (type === 'post') return `/posts/${slug}`
  if (type === 'gear') return `/gear/${slug}`

  return '#'
}
