export type Slug = {
  current: string
}

export type SanityImage = {
  asset?: {
    _ref?: string
    _id?: string
    url?: string
    metadata?: {
      dimensions?: {
        width?: number
        height?: number
      }
    }
  }
  alt?: string
  hotspot?: unknown
  crop?: unknown
}

export type Tag = {
  _id?: string
  name?: string
  slug?: Slug
  category?: string
  description?: string
}

export type Gear = {
  _id?: string
  name?: string
  slug?: Slug
  manufacturer?: string
  type?: string
  specs?: unknown[]
  myReview?: unknown[]
  rating?: number
  hasAffiliateLinks?: boolean
  affiliateUrl?: string
  purchaseUrl?: string
  heroImage?: Photo
}

export type Photo = {
  _id?: string
  title?: string
  slug?: Slug
  captionBody?: unknown[]
  takenAt?: string
  image?: SanityImage
  exif?: {
    camera?: string
    lens?: string
    focalLength?: number
    aperture?: string
    shutterSpeed?: string
    iso?: number
  }
  gps?: {
    lat?: number
    lng?: number
  }
  companion?: {
    video?: {
      public_id?: string
    }
  }
  gear?: Gear[]
  tags?: Tag[]
}

export type Gallery = {
  _id?: string
  title?: string
  slug?: Slug
  description?: unknown[]
  coverPhoto?: Photo
  photos?: {
    captionOverride?: string
    photo?: Photo
  }[]
  location?: {
    lat?: number
    lng?: number
    placeName?: string
  }
  tags?: Tag[]
}

export type Post = {
  _id?: string
  title?: string
  slug?: Slug
  publishedAt?: string
  excerpt?: string
  featuredGallery?: Gallery
  body?: unknown[]
  tags?: Tag[]
  gear?: Gear[]
}

export type SiteSettings = {
  siteName?: string
  tagline?: string
  featuredGallery?: Gallery
  defaultSeoImage?: Photo
  affiliateDisclosure?: string
  socialLinks?: {
    instagram?: string
    mastodon?: string
  }
}

export type SearchResult = {
  _type: 'photo' | 'post' | 'gallery' | 'gear'
  _id: string
  title?: string
  slug?: Slug
  image?: SanityImage
  takenAt?: string
  excerpt?: string
}
