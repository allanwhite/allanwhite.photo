import { toHTML } from '@portabletext/to-html'

export function renderPortableText(value?: unknown[]): string {
  if (!value?.length) return ''

  return toHTML(value as Parameters<typeof toHTML>[0], {
    components: {
      types: {
        galleryEmbed: () => '',
        photoEmbed: () => '',
      },
    },
  })
}
