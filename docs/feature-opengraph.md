# Feature: Open Graph Share Cards

## PRD

### Problem

Shared links need to look intentional on Slack, iMessage, LinkedIn, X, and other preview surfaces. Right now the site has no card system tied to photo, gallery, post, and gear content. If a page is shared, the preview may be generic, missing, or poorly cropped.

### Goal

Generate branded Open Graph share cards for public pages using Sanity content and site design rules. Cards should ship as static JPG files by default, with a preview route for local and Studio review.

### Recommended Approach

Start with static JPG generation at build or backfill time. Use this pipeline:

```txt
Sanity data -> Satori SVG -> resvg PNG -> sharp JPG -> public/opengraph/*.jpg
```

This keeps social crawlers away from live image generation. It also fits Cloudflare hosting because the final image is just a static file.

### Scope

In scope:

- Homepage default share card
- Photo share cards
- Gallery share cards
- Post share cards
- Gear share cards
- Static JPG output
- Astro metadata helpers for `og:image`, width, height, MIME type, and alt text
- Local preview endpoint
- Batch regeneration script

Out of scope for the first pass:

- Cloudflare R2 storage
- Sanity webhook-triggered generation
- Per-user or personalized cards
- Cloudflare Images
- Dynamic card generation as the main production path

### Product Requirements

1. Each public content page should have one Open Graph image.
2. Generated cards should be `1200x630` JPG.
3. JPG quality should default to `85`, adjustable in config.
4. Cards should use a solid background because JPG does not support transparency.
5. Cards should include enough content to identify the page.
6. Photo cards should include the image, title, date, and tags if available.
7. Gallery cards should include the cover image, title, and place name if available.
8. Post cards should include the title, excerpt, and date.
9. Gear cards should include the gear name, manufacturer, and rating if available.
10. Homepage cards should include the site name, tagline, and fallback image if available.
11. If source content is missing, the generator should fall back cleanly.
12. Page metadata should point to the generated JPG using an absolute URL.
13. Preview routes should be allowed for crawlers only if they are intended as public previews. Generation routes should stay blocked.

### Acceptance Criteria

- Sharing the homepage shows a custom JPG card.
- Sharing a photo page shows that photo, not a generic site image.
- Sharing pages with missing Sanity images still shows a valid branded card.
- `pnpm build` creates or verifies all required static OG assets.
- A script can regenerate all cards without running the dev server.
- The system does not require Vercel services.
- The system does not require Cloudflare Images.

## Implementation Plan

### 1. Add Shared Open Graph Modules

Suggested files:

```txt
apps/web/src/lib/openGraph/data.ts
apps/web/src/lib/openGraph/render.tsx
apps/web/src/lib/openGraph/generate.ts
apps/web/src/lib/openGraph/metadata.ts
apps/web/src/lib/openGraph/paths.ts
```

Responsibilities:

- `data.ts`: fetch and normalize Sanity data.
- `render.tsx`: define the Satori card layout.
- `generate.ts`: convert JSX to SVG, SVG to PNG, and PNG to JPG.
- `metadata.ts`: return Astro metadata values for pages.
- `paths.ts`: define stable output paths like `/opengraph/photos/{slug}.jpg`.

### 2. Add Generation Script

Suggested file:

```txt
scripts/regenerate-open-graph-images.mjs
```

The script should:

- Load Sanity config from env.
- Fetch slugs for photos, galleries, posts, and gear.
- Generate one JPG per document.
- Write files under `apps/web/public/opengraph`.

Suggested output structure:

```txt
apps/web/public/opengraph/
  home.jpg
  photos/{slug}.jpg
  galleries/{slug}.jpg
  posts/{slug}.jpg
  gear/{slug}.jpg
```

### 3. Add Preview Endpoint

Suggested route:

```txt
apps/web/src/pages/api/open-graph/card/[type]/[slug].jpg.ts
```

This route should:

- Fetch one item from Sanity.
- Generate a JPG in memory.
- Return `Content-Type: image/jpeg`.
- Add cache headers.
- Be used for previews, not as the main production URL.

### 4. Wire Page Metadata

Each page should use a helper that returns:

```html
<meta property="og:image" content="https://allanwhite.photo/opengraph/photos/foo.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="...">
```

Astro layouts can receive this through page props, or each route can build its own metadata object and pass it into `BaseLayout`.

### 5. Add Robots Rules

Add a `robots.txt` route or static file:

- Allow preview card routes if public preview is useful.
- Disallow generation routes if any are added later.
- Keep static `/opengraph/*.jpg` files crawlable.

### 6. Later Upgrade: Cloudflare R2

If the repo should not store generated images, move output to R2. The generator can stay the same, but the storage target changes from local files to R2 objects. Page metadata would point at the R2-backed public URL.

This should wait until repo-managed static JPGs become a real problem.

## Testing Plan

### Build Tests

- Run `pnpm build`.
- Confirm generated JPGs exist in `apps/web/public/opengraph`.
- Confirm no route depends on Vercel APIs.
- Confirm no Cloudflare Images binding is required.

### Image Tests

- Check every generated JPG is `1200x630`.
- Check file size stays reasonable, ideally under `500 KB`.
- Check broken or missing Sanity images produce a fallback card.
- Check text does not overflow on long titles.
- Check JPG output has no transparent areas.

### Metadata Tests

Inspect rendered HTML for:

- `og:image`
- `og:image:type`
- `og:image:width`
- `og:image:height`
- `og:image:alt`
- `twitter:card`
- `twitter:image`

Confirm image URLs are absolute in production.

### Route Tests

- Hit the preview endpoint for one photo, one post, one gallery, and one gear item.
- Confirm each returns `200`.
- Confirm `Content-Type` is `image/jpeg`.
- Confirm missing slugs return `404`.

### Visual Tests

- Open generated cards locally.
- Check desktop and mobile share contexts if possible: Slack, iMessage, LinkedIn, and X Card Validator.
- Compare one card with a high-contrast photo and one with a low-contrast photo.

### Regression Tests

- Re-run the generator twice and confirm stable output paths.
- Change a title and confirm the matching JPG updates.
- Remove an image from a Sanity document and confirm the fallback card still builds.

## Decision

Build static generated JPG cards first. Keep the code shaped so R2 delivery is a storage change later, not a rewrite.
