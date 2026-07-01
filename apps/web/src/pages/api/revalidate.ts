import type { APIRoute } from 'astro'

export const prerender = false

export const POST: APIRoute = async (context) => {
  const secret = context.request.headers.get('x-revalidate-secret')

  if (!import.meta.env.REVALIDATE_SECRET || secret !== import.meta.env.REVALIDATE_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await context.request.json().catch(() => ({}))
  const cache = 'cache' in context ? context.cache : undefined

  if (cache && typeof cache.invalidate === 'function') {
    if (body._type) await cache.invalidate({ tags: [body._type] })
    if (body.slug) await cache.invalidate({ path: `/tags/${body.slug}` })
  }

  return new Response('Revalidated')
}
