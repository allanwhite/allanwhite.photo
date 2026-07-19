import {
  defineDocuments,
  defineLocations,
  type PresentationPluginOptions,
} from 'sanity/presentation'

const mainDocuments = defineDocuments([
  {
    route: '/posts/:slug',
    filter: `_type == "post" && slug.current == $slug`,
  },
  {
    route: '/gear/:slug',
    filter: `_type == "gear" && slug.current == $slug`,
  },
  {
    route: '/:slug',
    filter: `_type == "page" && slug.current == $slug`,
  },
])

function missingSlug(type: string) {
  return {
    message: `Add a slug to preview this ${type}.`,
    tone: 'caution' as const,
  }
}

const locations = {
  post: defineLocations({
    select: {
      title: 'title',
      slug: 'slug.current',
    },
    resolve: (document) =>
      document?.slug
        ? {
            locations: [
              {
                title: document.title || 'Untitled post',
                href: `/posts/${document.slug}`,
              },
            ],
          }
        : missingSlug('post'),
  }),
  gear: defineLocations({
    select: {
      title: 'name',
      slug: 'slug.current',
    },
    resolve: (document) =>
      document?.slug
        ? {
            locations: [
              {
                title: document.title || 'Untitled gear',
                href: `/gear/${document.slug}`,
              },
            ],
          }
        : missingSlug('gear item'),
  }),
  page: defineLocations({
    select: {
      title: 'title',
      slug: 'slug.current',
    },
    resolve: (document) =>
      document?.slug
        ? {
            locations: [
              {
                title: document.title || 'Untitled page',
                href: `/${document.slug}`,
              },
            ],
          }
        : missingSlug('page'),
  }),
}

export const presentationResolve: PresentationPluginOptions['resolve'] = {
  mainDocuments,
  locations,
}
