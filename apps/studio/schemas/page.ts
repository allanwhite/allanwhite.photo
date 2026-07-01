import { defineArrayMember, defineField, defineType } from 'sanity'

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'seoDescription', title: 'SEO description', type: 'text', rows: 2 }),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        defineArrayMember({ type: 'block' }),
        defineArrayMember({
          name: 'galleryEmbed',
          title: 'Gallery embed',
          type: 'object',
          fields: [defineField({ name: 'gallery', type: 'reference', to: [{ type: 'gallery' }] })],
        }),
        defineArrayMember({
          name: 'photoEmbed',
          title: 'Photo embed',
          type: 'object',
          fields: [defineField({ name: 'photo', type: 'reference', to: [{ type: 'photo' }] })],
        }),
      ],
    }),
  ],
})
