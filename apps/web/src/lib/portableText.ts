import { toHTML } from '@portabletext/to-html'

export function renderPortableText(value?: unknown[]): string {
  if (!value?.length) return ''

  return toHTML(value, {
    components: {
      types: {
        galleryEmbed: () => '',
        photoEmbed: () => '',
      },
    },
  })
}
