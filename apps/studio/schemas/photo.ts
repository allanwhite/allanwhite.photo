import { defineArrayMember, defineField, defineType } from 'sanity'

export const photo = defineType({
  name: 'photo',
  title: 'Photo',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'captionBody',
      title: 'Caption',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({ name: 'takenAt', title: 'Taken at', type: 'datetime' }),
    defineField({
      name: 'image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (rule) => rule.warning('Add manual alt text before launch.'),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'exif',
      title: 'EXIF',
      type: 'object',
      fields: [
        defineField({ name: 'camera', type: 'string' }),
        defineField({ name: 'lens', type: 'string' }),
        defineField({ name: 'focalLength', title: 'Focal length', type: 'number' }),
        defineField({ name: 'aperture', type: 'string' }),
        defineField({ name: 'shutterSpeed', title: 'Shutter speed', type: 'string' }),
        defineField({ name: 'iso', title: 'ISO', type: 'number' }),
      ],
    }),
    defineField({
      name: 'gps',
      title: 'GPS',
      type: 'object',
      description: 'Simple single-point location, usually from EXIF GPS.',
      fields: [
        defineField({ name: 'lat', title: 'Latitude', type: 'number' }),
        defineField({ name: 'lng', title: 'Longitude', type: 'number' }),
      ],
    }),
    defineField({
      name: 'companion',
      title: 'Companion media',
      type: 'object',
      description: 'Optional short video clip stored in Cloudinary.',
      fields: [
        defineField({
          name: 'video',
          title: 'Companion video clip',
          type: 'cloudinary.asset',
        }),
      ],
    }),
    defineField({
      name: 'gear',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'gear' }] })],
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'tag' }] })],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      subtitle: 'takenAt',
    },
  },
})
