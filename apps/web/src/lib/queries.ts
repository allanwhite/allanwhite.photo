import groq from 'groq'

export const imageProjection = groq`{
  alt,
  hotspot,
  crop,
  asset->{
    _id,
    url,
    metadata {
      dimensions,
      lqip
    }
  }
}`

export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    siteName,
    tagline,
    affiliateDisclosure,
    socialLinks,
    featuredGallery->{
      _id, title, slug,
      coverPhoto->{ title, slug, image ${imageProjection} }
    },
    defaultSeoImage->{ title, slug, image ${imageProjection} }
  }
`

export const latestPhotosQuery = groq`
  *[_type == "photo"]
  | order(takenAt desc) [0...12] {
    _id, title, slug, takenAt, image ${imageProjection},
    tags[]->{ name, slug, category }
  }
`

export const allPhotoSlugsQuery = groq`
  *[_type == "photo" && defined(slug.current)] { "slug": slug.current }
`

export const photoBySlugQuery = groq`
  *[_type == "photo" && slug.current == $slug][0] {
    _id, title, slug, captionBody, takenAt,
    image ${imageProjection}, exif, gps, companion,
    gear[]->{ _id, name, slug, type },
    tags[]->{ _id, name, slug, category }
  }
`

export const allGallerySlugsQuery = groq`
  *[_type == "gallery" && defined(slug.current)] { "slug": slug.current }
`

export const galleryBySlugQuery = groq`
  *[_type == "gallery" && slug.current == $slug][0] {
    _id, title, slug, description, location,
    coverPhoto->{ _id, title, slug, image ${imageProjection} },
    photos[] {
      captionOverride,
      photo->{ _id, title, slug, image ${imageProjection}, exif, takenAt }
    },
    tags[]->{ _id, name, slug, category }
  }
`

export const latestPostsQuery = groq`
  *[_type == "post"]
  | order(publishedAt desc) [0...12] {
    _id, title, slug, publishedAt, excerpt,
    featuredGallery->{
      title,
      slug,
      coverPhoto->{ title, slug, image ${imageProjection} }
    },
    tags[]->{ name, slug, category }
  }
`

export const allPostSlugsQuery = groq`
  *[_type == "post" && defined(slug.current)] { "slug": slug.current }
`

export const postBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id, title, slug, publishedAt, excerpt, body,
    featuredGallery->{
      _id, title, slug, description,
      coverPhoto->{ _id, title, slug, image ${imageProjection} },
      photos[] {
        captionOverride,
        photo->{ _id, title, slug, image ${imageProjection}, exif, takenAt }
      }
    },
    tags[]->{ _id, name, slug, category },
    gear[]->{ _id, name, slug, type }
  }
`

export const pageBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug][0] {
    _id, _type, title, slug, seoDescription, body
  }
`

export const gearListQuery = groq`
  *[_type == "gear"]
  | order(manufacturer asc, name asc) [0...48] {
    _id, name, slug, manufacturer, type, rating,
    hasAffiliateLinks,
    heroImage->{ _id, title, slug, image ${imageProjection} }
  }
`

export const allGearSlugsQuery = groq`
  *[_type == "gear" && defined(slug.current)] { "slug": slug.current }
`

export const gearBySlugQuery = groq`
  *[_type == "gear" && slug.current == $slug][0] {
    _id, name, slug, manufacturer, type, specs, myReview,
    rating, hasAffiliateLinks, affiliateUrl, purchaseUrl,
    heroImage->{ _id, title, slug, image ${imageProjection} }
  }
`

export const photosByGearQuery = groq`
  *[_type == "photo" && references($gearId)]
  | order(takenAt desc) [0...24] {
    _id, title, slug, image ${imageProjection}, takenAt
  }
`

export const tagBySlugQuery = groq`
  *[_type == "tag" && slug.current == $slug][0] {
    _id, name, slug, category, description
  }
`

export function buildPhotosByTagQuery(offset: number, limit: number): string {
  const start = Math.max(Math.trunc(offset), 0)
  const count = Math.min(Math.max(Math.trunc(limit), 1), 100)

  return groq`
    *[_type == "photo" && $tagSlug in tags[]->slug.current]
    | order(takenAt desc)
    [${start}...${start + count}] {
      _id, title, slug, image ${imageProjection}, takenAt,
      tags[]->{ name, slug, category }
    }
  `
}

type SearchParams = {
  q?: string
  tags: string[]
  type?: string
  gear?: string
  from?: string
  to?: string
  sort?: string
  offset: number
}

export function buildSearchQuery(params: SearchParams): string {
  const filters = [`_type in ["photo", "post", "gallery", "gear"]`]

  if (params.q) {
    const term = JSON.stringify(`${params.q}*`)
    filters.push(`[title, pt::text(captionBody), pt::text(body), excerpt] match ${term}`)
  }

  if (params.type && ['photo', 'post', 'gallery', 'gear'].includes(params.type)) {
    filters.push(`_type == ${JSON.stringify(params.type)}`)
  }

  for (const tag of params.tags) {
    filters.push(`${JSON.stringify(tag)} in tags[]->slug.current`)
  }

  if (params.gear) {
    filters.push(`${JSON.stringify(params.gear)} in gear[]->slug.current`)
  }

  if (params.from) filters.push(`coalesce(takenAt, publishedAt) >= ${JSON.stringify(params.from)}`)
  if (params.to) filters.push(`coalesce(takenAt, publishedAt) <= ${JSON.stringify(params.to)}`)

  const order =
    params.q && params.sort !== 'date'
      ? 'order(_score desc)'
      : 'order(coalesce(takenAt, publishedAt) desc)'

  return groq`
    *[${filters.join(' && ')}]
    | score(${params.q ? `boost(title match ${JSON.stringify(`${params.q}*`)}, 3)` : '1'})
    | ${order}
    [${params.offset}...${params.offset + 24}] {
      _type, _id, title, slug, image ${imageProjection}, excerpt,
      "takenAt": coalesce(takenAt, publishedAt)
    }
  `
}
