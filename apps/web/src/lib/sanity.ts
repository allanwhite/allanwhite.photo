import { createClient, type ClientPerspective } from '@sanity/client'

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'abc12345'
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production'
const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION || '2026-07-01'

export const hasSanityConfig = Boolean(
  import.meta.env.PUBLIC_SANITY_PROJECT_ID && import.meta.env.PUBLIC_SANITY_DATASET,
)

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
})

type SanityFetchOptions = {
  perspectiveCookie?: string
}

function parsePerspective(value?: string): ClientPerspective | undefined {
  if (!value) return undefined

  const decoded = decodeURIComponent(value)
  if (!decoded.startsWith('[')) return decoded as ClientPerspective

  try {
    return JSON.parse(decoded) as ClientPerspective
  } catch {
    return undefined
  }
}

export async function fetchSanity<T>(
  query: string,
  params: Record<string, unknown> = {},
  fallback: T,
  options: SanityFetchOptions = {},
): Promise<T> {
  if (!hasSanityConfig) return fallback

  const draftMode = Boolean(options.perspectiveCookie)
  const token = import.meta.env.SANITY_API_READ_TOKEN

  if (draftMode && !token) {
    throw new Error('SANITY_API_READ_TOKEN is required for live preview.')
  }

  const previewClient = draftMode
    ? client.withConfig({
        perspective: parsePerspective(options.perspectiveCookie) || 'drafts',
        useCdn: false,
        token,
        stega: {
          enabled: true,
          studioUrl:
            import.meta.env.PUBLIC_SANITY_STUDIO_URL ||
            import.meta.env.NEXT_PUBLIC_SANITY_STUDIO_URL ||
            'http://localhost:3333',
        },
      })
    : client

  try {
    return await previewClient.fetch<T>(query, params)
  } catch (error) {
    console.warn('Sanity fetch failed during render.', error)
    return fallback
  }
}
