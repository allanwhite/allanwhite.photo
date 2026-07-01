import { defineArrayMember, defineField, defineType } from 'sanity'

export const gallery = defineType({
  name: 'gallery',
  title: 'Gallery',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'coverPhoto',
      title: 'Cover photo',
      type: 'reference',
      to: [{ type: 'photo' }],
    }),
    defineField({
      name: 'photos',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'photo', type: 'reference', to: [{ type: 'photo' }] }),
            defineField({ name: 'captionOverride', title: 'Caption override', type: 'string' }),
          ],
          preview: {
            select: {
              title: 'photo.title',
              media: 'photo.image',
              subtitle: 'captionOverride',
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'location',
      type: 'object',
      description: 'Optional representative point for this gallery.',
      fields: [
        defineField({ name: 'lat', title: 'Latitude', type: 'number' }),
        defineField({ name: 'lng', title: 'Longitude', type: 'number' }),
        defineField({ name: 'placeName', title: 'Place name', type: 'string' }),
      ],
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'tag' }] })],
    }),
  ],
})
