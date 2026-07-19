# Frontend Architecture Review — July 2026

**Scope:** validation of the v2.2 plan and the current `apps/web` implementation against the July 2026 ecosystem (Astro 7.x, `@astrojs/cloudflare` 14, Cloudflare Workers Cache GA, Sanity Studio v4 / client v7). Requested before resuming the build; design comps are pending separately, so all recommendations here are design-neutral.

**Verdict:** the architecture holds up. Astro 7 + Sanity-native images + Cloudflare Workers remains the right stack for Phase 1; no plan-level decisions need reversing. The review found two implementation bugs, one architectural soft spot (SSR cache invalidation), one stale assumption that is now good news (Workers Cache is GA), and a set of maintainability gaps to close before or alongside the design pass.

**Decision made during review:** adopt `cacheCloudflare()` as the cache provider (replacing `memoryCache()`). See §2.

---

## 1. Bugs — fix before anything else

### 1.1 PhotoSwipe lightbox is broken (`GalleryGrid.astro`)

`<script define:vars={{ galleryId }}>` implicitly makes the script `is:inline`, which skips Astro's bundler. The bare import `import PhotoSwipeLightbox from 'photoswipe/lightbox'` is left as-is, and browsers cannot resolve bare module specifiers — the lightbox never initializes.

**Fix:** use a normal processed `<script>` (no `define:vars`) that selects all grids by class:

```astro
<script>
  import PhotoSwipeLightbox from 'photoswipe/lightbox'

  document.querySelectorAll('.gallery-grid').forEach((el) => {
    new PhotoSwipeLightbox({
      gallery: el,
      children: 'a',
      pswpModule: () => import('photoswipe'),
    }).init()
  })
</script>
```

This also removes the `Math.random()` element IDs, which make HTML output nondeterministic between builds (bad for caching and diffing) and were only needed to smuggle the ID into the inline script.

### 1.2 Image dimensions are never fetched — lightbox aspect ratios always wrong

`imageDimensions()` reads `image.asset.metadata.dimensions`, but every GROQ query projects bare `image`, which contains only `asset._ref`. Metadata lives on the asset *document*, so the fallback (1600×1200) is used for every photo. PhotoSwipe renders every non-4:3 image at the wrong ratio.

**Fix:** define one shared image projection fragment and use it in every query that returns an image:

```groq
image {
  alt, hotspot, crop,
  asset-> { _id, url, metadata { dimensions, lqip } }
}
```

`lqip` comes free with this and enables blur-up placeholders — worth wiring into the image component (§4.2) on a photography site.

---

## 2. Cache layer — adopt `cacheCloudflare()`

### 2.1 Why the current setup is a no-op

The `/api/revalidate` endpoint currently invalidates nothing, for two independent reasons:

1. **No cached response carries tags.** `cache.invalidate({ tags: [...] })` only purges entries that were tagged via `Astro.cache.set({ tags })` or a `routeRules` `tags:` entry. The current `routeRules` set only `maxAge`/`swr`. (Confirmed against the [Astro route caching docs](https://docs.astro.build/en/guides/caching/).)
2. **`memoryCache()` on Workers is per-isolate.** Worker isolates are ephemeral and unshared across instances/colos. The webhook request purges one isolate's memory; every other isolate keeps serving stale content until natural eviction. Invalidation on this provider is cosmetic on this platform.

### 2.2 Why `cacheCloudflare()` is now viable

The plan (v2.0, §7.2) rejected `cacheCloudflare()` because Workers Cache was in private beta. That is stale: **Workers Cache is GA** with no separate pricing — standard per-request Workers billing, and cache hits consume no CPU time ([Cloudflare docs](https://developers.cloudflare.com/workers/cache/)). `@astrojs/cloudflare@14` (already installed) ships the provider, which sets `Cloudflare-CDN-Cache-Control` / `Cache-Tag` headers and supports both tag- and path-based invalidation at the edge.

**Caveat:** enabling Workers Cache bills *all* requests to the Worker — including normally-free static asset requests — against the free tier's 100k requests/day. At portfolio scale this is comfortable (photo binaries are served by Sanity's CDN, not the Worker), but it is the tradeoff being accepted.

### 2.3 Changes required

```js
// astro.config.mjs
import cloudflare from '@astrojs/cloudflare'
import { cacheCloudflare } from '@astrojs/cloudflare/cache'
import { defineConfig } from 'astro/config'

export default defineConfig({
  adapter: cloudflare({ imageService: 'passthrough', inspectorPort: false }),
  cache: { provider: cacheCloudflare() },
  routeRules: {
    '/tags/[slug]': { maxAge: 300, swr: 60, tags: ['tag'] },
    '/search':      { maxAge: 60,  swr: 30, tags: ['search'] },
  },
})
```

- Add `tags:` to `routeRules` (above), and/or call `Astro.cache.set({ tags: [...] })` in the SSR pages for finer-grained tags (e.g. tag the tag page with its slug: `tags: ['tag', `tag:${slug}`]`).
- Update `/api/revalidate` to invalidate the tags actually in use. Gate path invalidation on document type — the current sketch would invalidate `/tags/{photo-slug}` when a *photo* publishes, which is never a valid path.
- Remove the unused `session` config (nothing calls `Astro.session`; the LRU driver is per-isolate anyway).

### 2.4 Runtime secret access

`import.meta.env.REVALIDATE_SECRET` is inlined by Vite **at build time**. If the secret is configured as a Workers runtime secret (dashboard or `wrangler secret`), `import.meta.env` will not see it and every webhook returns 401. Either:

- read it at runtime: `context.locals.runtime.env.REVALIDATE_SECRET` (or `astro:env/server` `getSecret`), **recommended**; or
- set it as a build-time variable in Workers Builds — works, but bakes the secret into the deployed bundle.

---

## 3. Publish → live pipeline (two webhooks, two jobs)

Static routes (home, `/photos/*`, `/galleries/*`, `/posts/*`, `/gear/*`) are rendered once at build time. Publishing in Studio updates the Content Lake but triggers nothing — new content does not appear until the next deploy. SSR routes (`/tags/*`, `/search`) refresh themselves, subject to cache staleness.

Required setup (dashboard config, not repo code):

1. **Deploy hook — rebuilds static pages.** [Deploy Hooks for Workers Builds](https://developers.cloudflare.com/changelog/post/2026-04-01-deploy-hooks/) (April 2026): Workers & Pages → worker → Settings → Builds → Deploy Hooks → create, copy URL. Then in Sanity (Project settings → API → Webhooks) create a webhook firing on create/update/delete of `photo`, `gallery`, `post`, `gear`, `siteSettings`, POSTing to that URL. Deploy hooks dedupe bursts: a trigger received before the previous build starts returns the in-progress build instead of queueing a duplicate. Treat the URL as a credential — it has no auth of its own.
2. **Revalidate hook — purges the SSR edge cache.** Second Sanity webhook → `POST /api/revalidate` with the `x-revalidate-secret` header and a GROQ projection supplying `{ _type, "slug": slug.current }`.

At personal publish cadence, one rebuild per publish session is well within free Workers Builds limits.

---

## 4. Maintainability recommendations (priority order)

### 4.1 Adopt Sanity TypeGen

`types.ts` is hand-written, all-optional, with `unknown[]` for Portable Text — it will drift from the schema silently. Switch queries to `defineQuery` and run `sanity typegen generate` to derive types from the Studio schema + the actual GROQ projections. Single biggest maintainability win; aligns with the plan's schema-first principle. Fits the monorepo naturally (schema lives in `apps/studio`, generated types consumed by `apps/web`).

### 4.2 Build one responsive image component

Every `<img>` today is a single fixed-width `src` with no `srcset`/`sizes`, no `width`/`height` attributes (CLS risk), and no `fetchpriority` on the hero (LCP). For a photography site this is the highest-value performance work. One `<SanityImg>` component should own: srcset width ladder via `@sanity/image-url`, `sizes`, intrinsic dimensions from `asset->metadata.dimensions` (fixed by §1.2), LQIP background, and eager/priority handling. Replace all ad-hoc `<img>` call sites with it.

### 4.3 Extract design tokens before the comps

All tokens and global styles live inside `BaseLayout.astro`. Move to `src/styles/tokens.css` + `src/styles/global.css` (optionally CSS cascade layers) so the coming redesign is a token/stylesheet edit, not layout surgery. Component markup is already semantically clean — good starting position for a reskin. Fold in during the design pass: `aria-current` on nav, a skip link, and the planned view transitions (§7.3.1 of the plan — not yet implemented; stable `transition:name` per photo ID).

### 4.4 Fail loudly at build time

`fetchSanity` swallows every error and returns fallbacks, and `getStaticPaths` silently returns `[]` when env is missing — a misconfigured CI build ships an empty site "successfully." Throw during prerender (build) and soft-fail only at SSR runtime. Simplest: pass or detect `import.meta.env.SSR`/prerender context, or split into `fetchOrThrow` (build) and `fetchOrFallback` (SSR).

### 4.5 SEO baseline (before the OG image pipeline)

Missing entirely: `site` in `astro.config.mjs`, canonical URLs, all OG/Twitter meta, sitemap, robots.txt, RSS. Roughly an hour: set `site`, add canonical + `og:title/description/image` (via `defaultSeoImage`/page image) to `BaseLayout`, add `@astrojs/sitemap`, static robots.txt, RSS for posts. The `feature-opengraph.md` generated-card pipeline layers on top later.

### 4.6 Tooling and CI

No lint/format config, no `astro check`, no CI. Add: `astro check` + `tsc --noEmit` scripts, a formatter/linter (Biome is a good single-tool fit for this repo size), and a GitHub Actions workflow running check + build on PR. Workers Builds already handles deploy; CI just needs to catch breakage.

---

## 5. Minor items

- **Search form drops state:** submitting loses `tag`, `gear`, `from`, `to`, `sort` params (only `q` + `type` are form fields). Add hidden inputs or full controls. No pagination links on search/tag pages either.
- **`Astro.redirect('/404')` on prerendered pages** emits a meta-refresh page. Unreachable today (getStaticPaths guards), but prefer `Astro.rewrite('/404')` or a proper 404 response.
- **`siteSettings` fetched by every page** — 2 queries per SSR request. Fine at current scale (500k/mo budget); memoize module-level with TTL if it ever matters.
- **VideoPlayer:** HLS `<source>` plays natively only in Safari; Chrome/Firefox fall through to MP4 — acceptable for 10–30s clips, no change needed. Hover-to-play plus `controls` covers touch.
- **`docs/` hygiene:** plan §7.2 config sketch and the `wrangler.jsonc` `main` entry differ from the working scaffold (adapter entrypoint vs `dist/_worker.js`) — the scaffold is authoritative; update the plan doc when §2.3 lands.

## 6. Reviewed and fine as-is

GROQ injection hygiene in `buildSearchQuery` (allowlisted `type`, `JSON.stringify` escaping); video-only Cloudinary scoping and URL helper; env split per `stack-notes.md`; pnpm monorepo layout; strict tsconfig + path aliases; query co-location in `queries.ts`; `@sanity/client` v7 with `useCdn` + published perspective; PhotoSwipe as lightbox choice; deferral decisions (HDR, maps, ingest CLI) all still look right.

---

## Sources

- [Astro — Route caching](https://docs.astro.build/en/guides/caching/) (tags requirement, providers, `cacheCloudflare()`)
- [Cloudflare — Workers Cache](https://developers.cloudflare.com/workers/cache/) (GA status, pricing/billing behavior)
- [Cloudflare changelog — Deploy Hooks for Workers Builds](https://developers.cloudflare.com/changelog/post/2026-04-01-deploy-hooks/) (April 2026)
- [Cloudflare — Workers Builds Deploy Hooks docs](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/)
