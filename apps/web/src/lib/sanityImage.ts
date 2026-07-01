import { createImageUrlBuilder } from '@sanity/image-url'
import { client } from './sanity'
import type { SanityImage } from './types'

const builder = createImageUrlBuilder(client)

export function sanityImageUrl(source: SanityImage) {
  return builder.image(source)
}

export function hasImage(source?: SanityImage): source is SanityImage {
  return Boolean(source?.asset?._ref || source?.asset?._id)
}

export function imageDimensions(source?: SanityImage) {
  return {
    width: source?.asset?.metadata?.dimensions?.width ?? 1600,
    height: source?.asset?.metadata?.dimensions?.height ?? 1200,
  }
}
