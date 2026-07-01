import { defineArrayMember, defineField, defineType } from 'sanity'

const richBodyMembers = [
  defineArrayMember({ type: 'block' }),
  defineArrayMember({
    name: 'galleryEmbed',
    title: 'Gallery embed',
    type: 'object',
    fields: [defineField({ name: 'gallery', type: 'reference', to: [{ type: 'gallery' }] })],
    preview: {
      select: {
        title: 'gallery.title',
      },
      prepare: ({ title }) => ({ title: title || 'Gallery embed' }),
    },
  }),
  defineArrayMember({
    name: 'photoEmbed',
    title: 'Photo embed',
    type: 'object',
    fields: [defineField({ name: 'photo', type: 'reference', to: [{ type: 'photo' }] })],
    preview: {
      select: {
        title: 'photo.title',
        media: 'photo.image',
      },
      prepare: ({ title, media }) => ({ title: title || 'Photo embed', media }),
    },
  }),
]

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime' }),
    defineField({ name: 'excerpt', type: 'text', rows: 3 }),
    defineField({
      name: 'featuredGallery',
      title: 'Featured gallery',
      type: 'reference',
      to: [{ type: 'gallery' }],
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: richBodyMembers,
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'tag' }] })],
    }),
    defineField({
      name: 'gear',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'gear' }] })],
    }),
    defineField({
      name: 'mapConfig',
      title: 'Map config',
      type: 'object',
      description: 'Deferred. Not rendered in Phase 1.',
      fields: [
        defineField({
          name: 'mode',
          type: 'string',
          options: { list: ['scroll', 'cluster', 'journey'] },
        }),
        defineField({
          name: 'style',
          type: 'string',
          options: { list: ['mono', 'terrain', 'satellite', 'outdoor'] },
        }),
        defineField({ name: 'defaultZoom', title: 'Default zoom', type: 'number' }),
        defineField({
          name: 'center',
          type: 'object',
          fields: [
            defineField({ name: 'lat', title: 'Latitude', type: 'number' }),
            defineField({ name: 'lng', title: 'Longitude', type: 'number' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'track',
      type: 'object',
      description: 'Deferred. Not rendered in Phase 1.',
      fields: [
        defineField({ name: 'geojson', title: 'GeoJSON', type: 'file' }),
        defineField({ name: 'sourceGpx', title: 'Source GPX', type: 'file' }),
        defineField({ name: 'distanceKm', title: 'Distance in km', type: 'number' }),
        defineField({ name: 'elevationGainM', title: 'Elevation gain in meters', type: 'number' }),
        defineField({ name: 'activityType', title: 'Activity type', type: 'string' }),
      ],
    }),
    defineField({
      name: 'mapStops',
      title: 'Map stops',
      type: 'array',
      description: 'Deferred. Not rendered in Phase 1.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'photo', type: 'reference', to: [{ type: 'photo' }] }),
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'narrative', type: 'text', rows: 2 }),
            defineField({
              name: 'coords',
              title: 'Coordinates',
              type: 'object',
              fields: [
                defineField({ name: 'lat', title: 'Latitude', type: 'number' }),
                defineField({ name: 'lng', title: 'Longitude', type: 'number' }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})
