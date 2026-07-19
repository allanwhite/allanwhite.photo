import { validatePreviewUrl } from '@sanity/preview-url-secret'
import { perspectiveCookieName } from '@sanity/preview-url-secret/constants'
import { client } from '@lib/sanity'
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const token = import.meta.env.SANITY_API_READ_TOKEN
  if (!token) {
    return new Response('Server misconfigured: missing Sanity read token.', { status: 500 })
  }

  const { isValid, redirectTo = '/', studioPreviewPerspective } = await validatePreviewUrl(
    client.withConfig({ token }),
    request.url,
  )

  if (!isValid) return new Response('Invalid preview secret.', { status: 401 })

  cookies.set(perspectiveCookieName, studioPreviewPerspective || 'drafts', {
    httpOnly: false,
    sameSite: 'none',
    secure: true,
    path: '/',
  })

  return redirect(redirectTo, 307)
}
