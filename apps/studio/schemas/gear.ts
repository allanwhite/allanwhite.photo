import { defineArrayMember, defineField, defineType } from 'sanity'

export const gear = defineType({
  name: 'gear',
  title: 'Gear',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'manufacturer', type: 'string' }),
    defineField({
      name: 'type',
      type: 'string',
      options: {
        list: ['camera-body', 'lens', 'filter', 'tripod', 'bag', 'accessory', 'software'],
      },
    }),
    defineField({
      name: 'exifMatchKeys',
      title: 'EXIF match keys',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description: 'Reserved for Phase 2 auto-matching.',
    }),
    defineField({
      name: 'specs',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'myReview',
      title: 'My review',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'rating',
      type: 'number',
      validation: (rule) => rule.min(1).max(10),
    }),
    defineField({
      name: 'hasAffiliateLinks',
      title: 'Has affiliate links',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({ name: 'affiliateUrl', title: 'Affiliate URL', type: 'url' }),
    defineField({ name: 'purchaseUrl', title: 'Purchase URL', type: 'url' }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'reference',
      to: [{ type: 'photo' }],
    }),
  ],
})
