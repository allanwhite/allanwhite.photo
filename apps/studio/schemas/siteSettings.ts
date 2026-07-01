import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({ name: 'siteName', title: 'Site name', type: 'string' }),
    defineField({ name: 'tagline', type: 'string' }),
    defineField({
      name: 'featuredGallery',
      title: 'Featured gallery',
      type: 'reference',
      to: [{ type: 'gallery' }],
    }),
    defineField({
      name: 'defaultSeoImage',
      title: 'Default SEO image',
      type: 'reference',
      to: [{ type: 'photo' }],
    }),
    defineField({
      name: 'affiliateDisclosure',
      title: 'Affiliate disclosure',
      type: 'text',
      rows: 2,
      description: 'Shown on gear pages and posts that contain affiliate links.',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'object',
      fields: [
        defineField({ name: 'instagram', type: 'url' }),
        defineField({ name: 'mastodon', type: 'url' }),
      ],
    }),
  ],
})
