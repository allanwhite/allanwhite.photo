# Photography Platform — Project Plan

**Version 2.3 · July 2026 · R. Allan White**

A personal photography publishing platform for HDR images, video clips, gear reviews, and editorial content. This revision re-scopes the build around a lean, low-cost **Phase 1 launch** — Sanity, Astro, and Cloudflare only — with HDR, map adventures, and the ingest CLI carried forward as clearly-scoped **Phase 2 / future initiatives** rather than blocking the initial launch.

---

## What changed since v1.1

v1.1 assumed Cloudinary as the asset source of truth for both photos and video, AVIF as the primary HDR delivery format, and an ingest CLI as part of the initial build. Working through the HDR ecosystem in more depth (and reconsidering launch priorities) changed several of those assumptions:

| Decision | v1.1 assumption | v2.0 decision |
|---|---|---|
| Photo storage/CDN | Cloudinary, dual AVIF variants | **Sanity native `image` type** — free tier, built-in transforms, no dual-variant complexity |
| Video storage/CDN | Cloudinary | **Cloudinary retained — video only.** Sanity doesn't transcode; Cloudinary's HLS/MP4 pipeline is still necessary here |
| HDR delivery | HDR AVIF + SDR AVIF via `<picture>` | **Deferred.** Revisit format choice (leaning JPG gain map per Greg Benz reference material) once the core site ships |
| Map adventures | MapLibre + MapTiler, GPX pipeline | **Deferred.** Schema fields drafted but dormant; no map library or GPX tooling built yet |
| Ingest CLI | Part of initial build | **Deferred to Phase 2**, immediately post-launch. Scope shrinks substantially once dual-variant HDR upload logic is removed |
| Astro version | 6.x | **7.x** — Rust compiler, Vite 8/Rolldown, stable route caching |
| Image transforms | Cloudinary named transformations | **Sanity's built-in image CDN** via `@sanity/image-url`; Cloudflare Image Resizing/Images considered and explicitly not used (requires paid plan) |
| Cache strategy for SSR routes | Manual `Cache-Control` header | **Astro 7 stable route caching** (`Astro.cache`, `routeRules`, webhook-driven `cache.invalidate()`) |

**v2.1 correction note.** The lean v2.0 scope still stands, but scaffold planning surfaced several implementation corrections: Astro 7 sets the project Node floor at `>=22.12.0`; Cloudflare Workers replaces the old Pages target for Astro SSR; Workers Builds + `wrangler.jsonc` become the deploy setup; `REVALIDATE_SECRET` is now part of the webhook contract; search is confirmed for Phase 1; alt text is manual with Studio validation warnings; and the affiliate disclosure fields are now included in the schema.

**v2.2 environment note.** Cloudflare and Cloudinary key placement now has a short companion note in [`docs/stack-notes.md`](stack-notes.md). Keep this plan focused on architecture; use the stack note for `.env.local`, Cloudflare deploy variables, and Cloudinary delivery/upload secrets.

**v2.3 image-ratio note.** Published photographs must keep their original aspect ratios. The current scaffold still crops images in `PhotoCard`, `GalleryGrid`, the home hero, the gear hero, and the photo-page video poster. Treat this as known design debt, not the intended architecture. Fix each call site during the relevant component or design pass rather than making it a separate launch blocker.

The result is a Phase 1 scope that launches on entirely free-tier infrastructure except for Cloudinary's video transcoding, with clear, non-blocking paths back to HDR, mapping, and automation once the core site is live and content is flowing.

---

## Roadmap summary

| Phase | Scope | Trigger to move forward |
|---|---|---|
| **Phase 1 — Launch** | Sanity Studio v4 + Astro 7 + Cloudflare Workers. Native Sanity images. Cloudinary for video only. Manual content authoring. Search, tagging, gear section all active. | Ship it. |
| **Phase 2 — Post-launch** | Ingest CLI (metadata extraction, upload, draft creation). Gear/tag auto-matching. Possibly CLI-driven video upload to Cloudinary. | Manual Studio entry starts feeling like a bottleneck — realistically, "more than a handful of shoots." |
| **Future initiatives** | HDR delivery (format TBD), Map Adventures (MapLibre/GPX), Cloudinary photo/CDN expansion, print sales, instant/fuzzy search. | Each has its own trigger — see §13 Growth Path. |

---

## Contents

1. [Goals & Principles](#1-goals--principles)
2. [Stack Overview](#2-stack-overview)
3. [HDR Image Strategy — Deferred](#3-hdr-image-strategy--deferred)
4. [Content Schema](#4-content-schema)
5. [Ingest CLI — Phase 2](#5-ingest-cli--phase-2)
6. [Cloudinary Configuration — Video Only](#6-cloudinary-configuration--video-only)
7. [Front-End Architecture](#7-front-end-architecture)
8. [Tagging & Taxonomy](#8-tagging--taxonomy)
9. [Gear Section](#9-gear-section)
10. [Video Clips](#10-video-clips)
11. [Search & Filtering](#11-search--filtering)
12. [Map Adventures — Deferred](#12-map-adventures--deferred)
13. [Growth Path](#13-growth-path)
14. [Open Questions](#14-open-questions)
15. [Appendix A: Cost & Hosting Boundaries](#appendix-a-cost--hosting-boundaries)
16. [Appendix B: Version History](#appendix-b-version-history)

---

## 1. Goals & Principles

This is a personal creative platform, not a commercial product. Every architectural decision should serve the photography first — and, for Phase 1 specifically, should serve *shipping* first.

### Primary goals

- Showcase photography at full resolution on capable displays
- Tell stories through locations, gear, and editorial writing
- Provide a clean, fast, mobile-first browsing experience
- Sell prints (future) — lightweight, not a full storefront

### Design principles

- **Images are the UI** — chrome should recede, photos should dominate
- **Schema-first** — model content correctly once, deliver everywhere
- **Ship on free tiers where possible** — Cloudinary is scoped narrowly to the one job (video transcoding) that Sanity genuinely can't do; every other layer runs on a free plan
- **Build growth paths in from day one, but don't build them yet** — HDR, mapping, and automation are all real plans with real designs (§3, §12, §5), just not blocking launch
- **Draft-first publishing is the target state, not the Phase 1 reality.** Phase 1 is direct author-and-publish in Sanity Studio. The CLI-drafts / Studio-approves workflow returns in Phase 2.

---

## 2. Stack Overview

| Layer | Technology | Role |
|---|---|---|
| CMS | Sanity Studio v4 (project Node floor `>=22.12.0`, free plan) | Content model, Studio authoring, GROQ API, **native image CDN** |
| Video CDN | Cloudinary (free → growth) | **Video only** — HLS + MP4 server-side transcoding for companion clips |
| Front-end | Astro 7.x (hybrid SSG/SSR) | Static build + dynamic routes for search/filtering |
| Hosting | Cloudflare Workers (free plan) | Static assets + SSR routes via `@astrojs/cloudflare`, configured with `wrangler.jsonc` and deployed through Workers Builds. **No Image Resizing / Cloudflare Images** — see Appendix A |
| Lightbox | PhotoSwipe 5 | Swipeable, zero-dep gallery viewer |
| Content authoring | Manual, in Sanity Studio | Phase 1. Ingest CLI is Phase 2 (§5) |

> **Free-tier math.** Sanity free: 10 GB assets, 500k API requests/month — this is now the binding constraint on photo storage, since photos live natively in Sanity rather than Cloudinary. Cloudflare Workers free is enough for this personal-site launch, and Workers Builds gives the same Git-based push-to-deploy shape previously expected from Pages. Cloudinary free: 25 GB storage, 25 GB bandwidth — comfortably enough for video-only usage at personal-portfolio scale.

### 2.1 Version notes (July 2026)

| Component | Version | What changed / why it matters here |
|---|---|---|
| **Astro** | 7.x | Rust-based `.astro` compiler (via oxc + Lightning CSS) and Vite 8 with the Rolldown bundler — 15–61% faster builds in Astro's own benchmarks, no config changes required for this project. **Route caching is now stable** (was experimental in 6.x) — see §7.2. Astro 7 sets the project Node floor at `>=22.12.0`. Two behavior changes worth knowing before writing templates: (1) no more automatic HTML correction — unclosed tags now error instead of being silently fixed; (2) whitespace between inline elements collapses per JSX conventions (no implicit space between adjacent elements on separate lines — use `{' '}` where a space is intended). |
| **Sanity Studio** | v4 (4.22+) | Studio v4 itself has a lower Node requirement, but this project pins `>=22.12.0` because Astro 7 is stricter. No schema/API changes from v3. |
| **`@sanity/client`** | v7.x | Current major, pairs with Studio v4 / `sanity` 5.x line. Used directly by the Phase 2 ingest CLI. |
| **`sanity-plugin-cloudinary`** | v1.4.x | Official Sanity-maintained plugin. Used narrowly for the `cloudinary.asset` schema type on the video companion field only (§6). |
| **Cloudinary Node SDK** | v2 | Unchanged API surface; still the right SDK for the video upload path whenever that's scripted. |
| **Cloudinary accounts** | New Roles & Permissions (May 2026+) | Scope the video-upload API key to upload + asset management, not admin. |

> **Pin Node `>=22.12.0` across the board.** Astro 7 sets the stricter floor, so `.nvmrc` and `package.json#engines` should use `22.12.0` or newer even though Sanity Studio can run on lower Node releases.

### 2.2 What's explicitly *not* in Phase 1

- Cloudinary for photos (native Sanity `image` instead)
- HDR delivery of any kind (§3)
- Map Adventures / MapLibre (§12)
- The ingest CLI (§5)
- Cloudflare Image Resizing or Cloudflare Images (Appendix A)
- Print sales, watermarking, alt-text automation

---

## 3. HDR Image Strategy — Deferred

**Status: parked.** This section is retained in full so the design isn't lost, but none of it is implemented in Phase 1. Revisit once the core site has shipped and real content is flowing.

### 3.1 Why this is deferred, not cancelled

HDR was the original centerpiece of this project (the OM-3's HDR capture is the whole reason for building a custom platform rather than using an off-the-shelf portfolio tool). Deferring it is purely a sequencing decision — ship a working site on the simplest possible stack first, then bring HDR back in deliberately rather than let it block launch indefinitely.

### 3.2 Open design question carried forward

The HDR reference research (Greg Benz's technical guides) points toward **JPG with gain map (ISO 21496-1)** as the pragmatic primary web delivery format — not the dual HDR-AVIF/SDR-AVIF `<picture>` approach originally sketched in v1.0/v1.1. Reasoning to revisit when this work resumes:

- JPG gain maps render correctly (HDR or graceful SDR fallback) on **all** modern browsers except Firefox, with zero risk of a broken/clipped image on any browser, including decades-old ones
- AVIF gain map support is still rolling out (Chrome behind a flag, Safari only v26+) — not yet safe as a *primary* format
- A gain map file is a single asset (no separate SDR file to manage, no `<picture>` two-source dance, no PhotoSwipe `src`-switching logic)
- The SDR base image in a gain map is artist-controlled (from Lightroom/ACR export), not auto-tone-mapped — quality-critical per the reference material

### 3.3 The real architectural tension to resolve

Phase 1 moved photo storage to Sanity's **native** `image` type specifically because it's simpler and free. Native Sanity images don't have a concept of "gain map" or "dual HDR/SDR variant" — that's an inherently Cloudinary-shaped (or self-hosted) problem, since it requires either:

- Storing the HDR-capable file as an opaque binary Sanity can serve as-is (a JPG gain map *is* just a JPG to any dumb file server — this might actually work with Sanity's native `image` type with zero transform-pipeline involvement, since gain maps degrade gracefully and don't need server-side variant generation), or
- Reintroducing Cloudinary (or another CDN) for photos specifically to get transform/variant capabilities HDR workflows tend to want

The gain-map-as-plain-JPG insight above is worth testing first when this resumes — it's possible Phase 1's "photos live in Sanity" decision doesn't need to be undone at all for HDR to work, since a gain map file needs no special server-side handling, just correct `Content-Type` and no transcoding. This should be the first thing validated in Phase 2 planning, before assuming a Cloudinary photo migration is necessary.

### 3.4 Reference material on file for when this resumes

- Greg Benz's HDR technical reference (gain maps, ISO 21496-1, transcoding hazards, browser support matrix)
- The HEIC Gain Map Converter brief (sibling macOS tool, Swift/Core Image, for Apple-ecosystem HDR delivery)
- Original v1.1 §3 HDR strategy draft (AVIF-based `<picture>` approach) — superseded in thinking, kept for reference only

---

## 4. Content Schema

Seven document types in Sanity. Photo binaries live natively in Sanity; video binaries live in Cloudinary and are referenced by a typed field.

### 4.1 `photo`

The core document. Phase 1: created and published directly in Studio.

```typescript
// sanity/schemas/photo.ts
export default defineType({
  name: 'photo',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'captionBody', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'takenAt', type: 'datetime' }),

    defineField({
      name: 'image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          validation: r => r.warning('Add manual alt text before launch.'),
        },
      ],
    }),

    defineField({
      name: 'exif',
      type: 'object',
      fields: [
        { name: 'camera',       type: 'string' },  // Make + Model
        { name: 'lens',         type: 'string' },  // LensModel
        { name: 'focalLength',  type: 'number' },  // mm
        { name: 'aperture',     type: 'string' },  // 'f/2.8'
        { name: 'shutterSpeed', type: 'string' },  // '1/250'
        { name: 'iso',          type: 'number' },
      ],
    }),

    defineField({
      name: 'gps',
      type: 'object',
      description: 'Simple single-point location, typically from EXIF GPS.',
      fields: [
        { name: 'lat', type: 'number' },
        { name: 'lng', type: 'number' },
      ],
    }),

    defineField({
      name: 'companion',
      type: 'object',
      title: 'Companion media',
      description: 'Optional short video clip shot alongside this photo. Stored in Cloudinary, not Sanity — see §6.',
      fields: [
        {
          name: 'video',
          type: 'cloudinary.asset',   // from sanity-plugin-cloudinary — video use only
          title: 'Companion video clip',
        },
      ],
    }),

    defineField({
      name: 'gear',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'gear' }] }],
    }),

    defineField({
      name: 'tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
  ],
})
```

Phase 1 alt text is manual. Studio should warn when `image.alt` is empty, but it should not block publish.

> **HDR fields removed for Phase 1.** The `hdr.transferCharacteristics` / `maxCLL` / `maxFALL` metadata block from v1.1 is dropped from the active schema — it described AVIF transfer-characteristic data that no longer applies once photos live as native Sanity images. When HDR work resumes (§3), this needs a fresh design pass rather than a straight re-add, since the gain-map approach carries its metadata differently than the AVIF approach did.

### 4.2 `gallery`

Standalone, reusable. Referenced by blog posts. Can appear on its own page.

```typescript
// sanity/schemas/gallery.ts
export default defineType({
  name: 'gallery',
  type: 'document',
  fields: [
    defineField({ name: 'title',       type: 'string' }),
    defineField({ name: 'slug',        type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'description', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'coverPhoto',  type: 'reference', to: [{ type: 'photo' }] }),
    defineField({
      name: 'photos',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'photo',           type: 'reference', to: [{ type: 'photo' }] },
          { name: 'captionOverride', type: 'string' },  // optional per-item override
        ],
      }],
    }),
    defineField({
      name: 'location',
      type: 'object',
      description: 'Optional single representative point for this gallery — a general area, not derived from any one photo\u2019s GPS. Set manually.',
      fields: [
        { name: 'lat', type: 'number' },
        { name: 'lng', type: 'number' },
        { name: 'placeName', type: 'string' },  // e.g. "Isle of Skye" — for display/alt text
      ],
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
  ],
})
```

### 4.3 `post`

Blog posts. Body is Portable Text with two custom embed block types. Map-adventure fields are present but dormant (§12).

```typescript
// sanity/schemas/post.ts
// Custom block types for body field:
//   galleryEmbed → reference to gallery document
//   photoEmbed   → reference to photo document

export default defineType({
  name: 'post',
  type: 'document',
  fields: [
    defineField({ name: 'title',           type: 'string' }),
    defineField({ name: 'slug',            type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'publishedAt',     type: 'datetime' }),
    defineField({ name: 'excerpt',         type: 'text', rows: 3 }),
    defineField({ name: 'featuredGallery', type: 'reference', to: [{ type: 'gallery' }] }),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'object', name: 'galleryEmbed',
          fields: [{ name: 'gallery', type: 'reference', to: [{ type: 'gallery' }] }],
        },
        {
          type: 'object', name: 'photoEmbed',
          fields: [{ name: 'photo', type: 'reference', to: [{ type: 'photo' }] }],
        },
      ],
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
    defineField({
      name: 'gear',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'gear' }] }],
    }),

    // ── Map adventure fields — DORMANT, see §12. Left in schema at zero cost;
    //    not rendered or populated in Phase 1. ──
    defineField({
      name: 'mapConfig',
      type: 'object',
      description: 'Deferred — Map Adventures (§12) not yet built.',
      fields: [
        { name: 'mode', type: 'string',
          options: { list: ['scroll', 'cluster', 'journey'] } },
        { name: 'style', type: 'string',
          options: { list: ['mono', 'terrain', 'satellite', 'outdoor'] } },
        { name: 'defaultZoom', type: 'number' },
        { name: 'center', type: 'object',
          fields: [{ name: 'lat', type: 'number' }, { name: 'lng', type: 'number' }] },
      ],
    }),
    defineField({
      name: 'track',
      type: 'object',
      description: 'Deferred — Map Adventures (§12) not yet built.',
      fields: [
        { name: 'geojson',        type: 'file' },
        { name: 'sourceGpx',      type: 'file' },
        { name: 'distanceKm',     type: 'number' },
        { name: 'elevationGainM', type: 'number' },
        { name: 'activityType',   type: 'string' },
      ],
    }),
    defineField({
      name: 'mapStops',
      type: 'array',
      description: 'Deferred — Map Adventures (§12) not yet built.',
      of: [{
        type: 'object',
        fields: [
          { name: 'photo',     type: 'reference', to: [{ type: 'photo' }] },
          { name: 'label',     type: 'string' },
          { name: 'narrative', type: 'text', rows: 2 },
          { name: 'coords',    type: 'object',
            fields: [{ name: 'lat', type: 'number' }, { name: 'lng', type: 'number' }] },
        ],
      }],
    }),
  ],
})
```

### 4.4 `gear`

First-class equipment documents with review content and affiliate linking.

```typescript
// sanity/schemas/gear.ts
export default defineType({
  name: 'gear',
  type: 'document',
  fields: [
    defineField({ name: 'name',         type: 'string' }),
    defineField({ name: 'slug',         type: 'slug', options: { source: 'name' } }),
    defineField({ name: 'manufacturer', type: 'string' }),
    defineField({
      name: 'type',
      type: 'string',
      options: {
        list: ['camera-body', 'lens', 'filter', 'tripod', 'bag', 'accessory', 'software'],
      },
    }),
    // Reserved for Phase 2 CLI auto-matching against EXIF Make/Model/LensModel.
    // Manually unused in Phase 1, but safe to populate now for a smoother Phase 2 transition.
    defineField({
      name: 'exifMatchKeys',
      type: 'array',
      of: [{ type: 'string' }],
      // e.g. ["OM Digital Solutions", "OM-3", "OM System OM-3"]
    }),
    defineField({ name: 'specs',        type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'myReview',     type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'rating',       type: 'number', validation: r => r.min(1).max(10) }),
    defineField({ name: 'hasAffiliateLinks', type: 'boolean', initialValue: false }),
    defineField({ name: 'affiliateUrl', type: 'url' }),
    defineField({ name: 'purchaseUrl',  type: 'url' }),
    defineField({ name: 'heroImage',    type: 'reference', to: [{ type: 'photo' }] }),
  ],
})
```

### 4.5 `tag`

Flat taxonomy. A single `tag` type covers all content — photos, galleries, posts, and gear all reference the same pool.

```typescript
// sanity/schemas/tag.ts
export default defineType({
  name: 'tag',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string' }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'name' } }),
    defineField({
      name: 'category',
      type: 'string',
      options: {
        list: ['subject', 'region', 'mood', 'technique', 'gear-type'],
      },
    }),
    defineField({ name: 'description', type: 'string' }),
  ],
})
```

### 4.6 `page`

Flexible landing pages — About, Prints, Home hero, etc.

```typescript
// sanity/schemas/page.ts
export default defineType({
  name: 'page',
  type: 'document',
  fields: [
    defineField({ name: 'title',          type: 'string' }),
    defineField({ name: 'slug',           type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'seoDescription', type: 'text', rows: 2 }),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'object', name: 'galleryEmbed',
          fields: [{ name: 'gallery', type: 'reference', to: [{ type: 'gallery' }] }] },
        { type: 'object', name: 'photoEmbed',
          fields: [{ name: 'photo', type: 'reference', to: [{ type: 'photo' }] }] },
      ],
    }),
  ],
})
```

### 4.7 `siteSettings` (singleton)

```typescript
// sanity/schemas/siteSettings.ts
export default defineType({
  name: 'siteSettings',
  type: 'document',
  fields: [
    defineField({ name: 'siteName',         type: 'string' }),
    defineField({ name: 'tagline',          type: 'string' }),
    defineField({ name: 'featuredGallery',  type: 'reference', to: [{ type: 'gallery' }] }),
    defineField({ name: 'defaultSeoImage',  type: 'reference', to: [{ type: 'photo' }] }),
    defineField({
      name: 'affiliateDisclosure',
      type: 'text',
      rows: 2,
      description: 'Shown on gear pages and posts that contain affiliate links.',
    }),
    defineField({
      name: 'socialLinks',
      type: 'object',
      fields: [
        { name: 'instagram', type: 'url' },
        { name: 'mastodon',  type: 'url' },
      ],
    }),
  ],
})
```

### 4.8 Studio plugin configuration

Only one third-party plugin is active in Phase 1, scoped to the one field that needs it:

```typescript
// sanity.config.ts
import { defineConfig } from 'sanity'
import { cloudinarySchemaPlugin } from 'sanity-plugin-cloudinary'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'default',
  projectId: '<projectId>',
  dataset: 'production',
  plugins: [
    cloudinarySchemaPlugin(),   // registers the `cloudinary.asset` field type — video companion only
  ],
  schema: { types: schemaTypes },
})
```

> **Discipline note, not an enforced constraint:** Cloudinary doesn't offer a way to scope an API key to "video resource type only" — Roles & Permissions scopes by action (upload/manage/admin), not by media type. The `companion.video` field is the only place `cloudinary.asset` is used; keep it that way by convention rather than assuming the platform will stop you from using it elsewhere.

---

## 5. Ingest CLI — Phase 2

**Status: deferred, immediately post-launch.** Not part of the Phase 1 build. Content is authored directly in Sanity Studio until this exists.

### 5.1 Why this got simpler

The original CLI design (v1.1) carried most of its complexity from dual-variant HDR/SDR upload logic — `sharp` tone-mapping, `--sdr-source` handling, parallel Cloudinary uploads with distinct `publicId` suffixes. With photos now on Sanity's native image pipeline and HDR fully deferred, a Phase 2 CLI is a much thinner tool:

```
1. Detect file type (JPEG/HEIC for now — no AVIF-specific handling needed)
2. Extract metadata via exiftool (EXIF, IPTC, GPS)
3. Upload to Sanity via @sanity/client's asset upload endpoint
4. Build the photo document (title, slug, exif, gps) and createIfNotExists() as a draft
5. Gear-match (EXIF Make/Model/LensModel → gear.exifMatchKeys) — safe to reintroduce
   immediately since gear.exifMatchKeys already exists in the Phase 1 schema (§4.4)
6. Tag-match (IPTC Keywords → tag slugs) — same story, tag schema unchanged
7. Log result: created / patched / error
```

No dual-target upload, no tone-mapping step, no `publicId` bookkeeping across two CDNs for photos.

### 5.2 Open question for Phase 2 planning

Should the CLI also handle the occasional companion video upload to Cloudinary (§10), making it a two-target tool (Sanity for photos, Cloudinary for video)? Reasonable to decide this when Phase 2 planning actually starts rather than now — video companions are the exception, not the rule, per the original workflow description (10–30s atmosphere clips, not primary content).

### 5.3 Dependencies (anticipated, subject to revision at Phase 2 kickoff)

```json
{
  "engines": { "node": ">=22.12.0" },
  "dependencies": {
    "@sanity/client": "^7.x",
    "chalk": "^5.x",
    "commander": "^12.x",
    "dotenv": "^16.x",
    "exiftool-vendored": "^28.x",
    "ora": "^8.x",
    "p-limit": "^6.x"
  }
}
```

Note `sharp` and `cloudinary` are absent from this list compared to v1.1's dependency set — both were there for HDR transcoding and photo upload, neither of which this scope needs. `cloudinary` would return only if the two-target question above is answered "yes."

---

## 6. Cloudinary Configuration — Video Only

Cloudinary's sole job in Phase 1 is server-side video transcoding for companion clips (§10) — something neither Sanity nor Cloudflare's free tier can do.

### 6.1 Folder scheme

```
videos/
  {year}/
    {month}/
      {slug}              e.g. videos/2026/07/skye-storr-timelapse
```

No `photos/` or `gear/` folder scheme — those existed in v1.1 for Cloudinary-hosted photos, which no longer applies.

### 6.2 Credentials and public env — `.env`

```sh
# .env.example

PUBLIC_SANITY_PROJECT_ID=
PUBLIC_SANITY_DATASET=production
PUBLIC_SANITY_API_VERSION=2026-07-01
PUBLIC_CLOUDINARY_CLOUD_NAME=
REVALIDATE_SECRET=

SANITY_STUDIO_PROJECT_ID=
SANITY_STUDIO_DATASET=production

CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

> **Scoping.** `PUBLIC_*` values are safe to expose because they configure browser-readable Sanity and Cloudinary delivery URLs. `REVALIDATE_SECRET`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are private and belong in local env plus the Workers environment. Under Cloudinary's current Roles & Permissions system, scope the private API key and secret to **upload + asset management** — not full admin. This key touches video only; there's no photo-upload code path in Phase 1 to accidentally scope-creep into.

For the current local-vs-production env split, see [`docs/stack-notes.md`](stack-notes.md). It is the source of truth for which Cloudflare and Cloudinary values belong in `.env.local`, CI secrets, and Workers settings.

### 6.3 Video URL helper

```typescript
// lib/cloudinary.ts — video only
const CLOUD = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME

export function cloudinaryVideoUrl(
  publicId: string,
  fmt: 'mp4' | 'm3u8' = 'mp4'
): string {
  return `https://res.cloudinary.com/${CLOUD}/video/upload/q_auto/${publicId}.${fmt}`
}
```

There is no `cloudinaryUrl()` (image) helper in Phase 1 — that responsibility belongs entirely to `sanityImageUrl()` (§7.3).

---

## 7. Front-End Architecture

### 7.1 Astro project structure

```
src/
├── pages/
│   ├── index.astro                 Homepage
│   ├── photos/
│   │   └── [slug].astro            Individual photo page
│   ├── galleries/
│   │   └── [slug].astro            Gallery page
│   ├── posts/
│   │   ├── index.astro             Blog index
│   │   └── [slug].astro            Blog post
│   ├── gear/
│   │   ├── index.astro             Gear index
│   │   └── [slug].astro            Gear detail page
│   ├── tags/
│   │   └── [slug].astro            Tag browse page (SSR)
│   ├── search.astro                Search (SSR)
│   └── api/
│       └── revalidate.ts           Sanity webhook → cache invalidation
├── components/
│   ├── PhotoCard.astro             Thumbnail + Sanity-CDN <img>
│   ├── GalleryGrid.astro           CSS Grid layout with PhotoSwipe init
│   ├── Lightbox.astro              PhotoSwipe 5 wrapper
│   ├── VideoPlayer.astro           Cloudinary HLS player (companion clips only)
│   ├── ExifBlock.astro             EXIF/gear display sidebar
│   └── MapEmbed.astro              Static map pin from a single {lat, lng} — no MapLibre
└── lib/
    ├── sanityImage.ts              Sanity image URL builder (see §7.3)
    ├── cloudinary.ts               Video URL construction only (see §6.3)
    ├── sanity.ts                   @sanity/client instance
    └── queries.ts                  All GROQ queries, co-located
```

### 7.2 Rendering strategy & route caching

| Route | Mode | Rationale |
|---|---|---|
| `/` | Static | Rarely changes, maximum performance |
| `/photos/[slug]` | Static | Build-time, rebuild on publish webhook |
| `/galleries/[slug]` | Static | Build-time |
| `/posts/[slug]` | Static | Build-time |
| `/gear/*` | Static | Low-change, SEO-valuable |
| `/tags/[slug]` | SSR | Tag pages grow without requiring a full rebuild |
| `/search` | SSR | GROQ query at request time |

SSR routes run on Cloudflare Workers via `@astrojs/cloudflare`.

Astro 7 makes **route caching** stable (it was experimental in 6.x). This replaces the manual `Cache-Control: s-maxage=300` header approach entirely:

```typescript
// astro.config.mjs
import { defineConfig, memoryCache } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  adapter: cloudflare(),
  cache: { provider: memoryCache() },
  routeRules: {
    '/tags/[slug]': { maxAge: 300, swr: 60 },
    '/search':      { maxAge: 60,  swr: 30 },
  },
});
```

> **On the Cloudflare CDN cache provider.** Astro 7 also ships `cacheCloudflare()` from `@astrojs/cloudflare/cache`, which pushes cache directives to Cloudflare's edge network instead of holding them in Worker memory. It's gated behind the **Cloudflare Workers Cache feature, currently in private beta** — intentionally not used here. `memoryCache()` means cache state is per-Worker-instance rather than edge-pushed, which is a perfectly fine tradeoff at personal-portfolio traffic levels.

**Webhook-driven invalidation** replaces any need for rebuild-triggered ISR:

```typescript
// src/pages/api/revalidate.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cache }) => {
  const secret = request.headers.get('x-revalidate-secret');

  if (!import.meta.env.REVALIDATE_SECRET || secret !== import.meta.env.REVALIDATE_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { _type, slug } = await request.json();

  if (_type) await cache.invalidate({ tags: [_type] });
  if (slug) await cache.invalidate({ path: `/tags/${slug}` });

  return new Response('Revalidated');
};
```

Wire this to a Sanity webhook (Project Settings → API → Webhooks) firing on document publish for `tag`, `photo`, `gallery`, `post`, and `gear` types. Configure the webhook to send the shared secret in the `x-revalidate-secret` header, backed by `REVALIDATE_SECRET` in the Workers environment.

Deployment uses Workers Builds connected to GitHub or GitLab, with `wrangler.jsonc` as the deploy source of truth:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "allanwhite-photo",
  "main": "./dist/_worker.js/index.js",
  "compatibility_date": "2026-07-01",
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist"
  }
}
```

### 7.3 Sanity image delivery

```typescript
// lib/sanityImage.ts
import imageUrlBuilder from '@sanity/image-url'
import { client } from './sanity'

const builder = imageUrlBuilder(client)

export function sanityImageUrl(source: any) {
  return builder.image(source)
}
```

Usage is chainable per call site rather than named presets (Sanity has no server-side named-transform config the way Cloudinary does — transforms are computed per request from URL params):

```astro
<img
  src={sanityImageUrl(photo.image).width(400).auto('format').url()}
  alt={photo.image.alt}
/>
```

`auto('format')` negotiates WebP/AVIF automatically per browser — no manual format branching needed.

Photo delivery may resize and reformat an image, but it must not crop it. Use intrinsic dimensions from Sanity metadata and let rendered height follow the source aspect ratio. Do not use `fit('crop')`, a forced container aspect ratio, or `object-fit: cover` for published photography. Open Graph cards and other fixed-size compositions should contain the complete photograph within their frame instead of cropping it.

> **On Cloudflare's own image products.** Cloudflare Image Resizing and the merged Cloudflare Images product both require a **paid Pro plan ($20/mo) or higher** to transform images from an external source (Sanity, in this case) — see Appendix A. Deliberately not used. Sanity's free-tier image CDN is the only transform layer in Phase 1.

### 7.3.1 View transitions

**v2.1 implementation note.** Add Astro view transitions for image-to-detail navigation. The priority states are: moving from a photo card on the homepage, gallery, search results, or tag results into `/photos/[slug]`; moving from a detail page back to the homepage or the originating browse view; and moving from search or tag filter results into a photo detail page. Use stable transition names based on the photo document ID or slug so the same image can animate across homepage, list, search, tag, and detail routes. Keep this scoped to photo thumbnails and hero/detail images in Phase 1; do not add custom route animation logic for posts, gear, or map-adventure views yet.

### 7.3.2 Open Graph share cards

**v2.1 implementation note.** Add static Open Graph share cards for the homepage, photos, galleries, posts, and gear pages. The first pass should generate `1200x630` JPG files at build or backfill time using the pipeline `Sanity data -> Satori SVG -> resvg PNG -> sharp JPG`, then write stable assets under `apps/web/public/opengraph/`. Page metadata should point at absolute JPG URLs and include `og:image:type`, width, height, and alt text. Keep Cloudflare Images and Vercel services out of scope. If repo-managed static files become a problem later, move the same generated JPGs to Cloudflare R2 without changing the render pipeline. Detailed PRD, implementation plan, and testing plan live in [`docs/feature-opengraph.md`](feature-opengraph.md).

### 7.4 GROQ queries

```typescript
// lib/queries.ts

export const photoBySlug = groq`
  *[_type == "photo" && slug.current == $slug][0] {
    title, slug, captionBody, takenAt,
    image, exif, gps,
    companion,
    gear[]->{ name, slug, type },
    tags[]->{ name, slug, category }
  }
`

export const galleryBySlug = groq`
  *[_type == "gallery" && slug.current == $slug][0] {
    title, description, location,
    coverPhoto->{ image },
    photos[] {
      captionOverride,
      photo->{ title, slug, image, exif }
    },
    tags[]->{ name, slug }
  }
`

export const photosByTag = groq`
  *[_type == "photo" && $tagSlug in tags[]->slug.current]
  | order(takenAt desc)
  [$offset...$offset + $limit] {
    title, slug, image, takenAt,
    tags[]->{ name, slug }
  }
`

export const photosByGear = groq`
  *[_type == "photo" && references($gearId)]
  | order(takenAt desc) [0...24] {
    title, slug, image
  }
`
```

### 7.5 PhotoSwipe 5 integration

With HDR deferred, the lightbox needs exactly one `src` per image — no HDR/SDR switching logic:

```astro
---
// components/GalleryGrid.astro
import type { Photo } from '../lib/types'
import { sanityImageUrl } from '../lib/sanityImage'
const { photos } = Astro.props as { photos: Photo[] }
---

<div class="gallery-grid" id="gallery">
  {photos.map(photo => (
    <a
      href={sanityImageUrl(photo.image).width(2400).auto('format').url()}
      data-pswp-width={photo.image.asset.metadata.dimensions.width}
      data-pswp-height={photo.image.asset.metadata.dimensions.height}
    >
      <img
        src={sanityImageUrl(photo.image).width(400).auto('format').url()}
        alt={photo.image.alt ?? photo.title}
        loading="lazy"
        decoding="async"
      />
    </a>
  ))}
</div>

<script>
  import PhotoSwipeLightbox from 'photoswipe/lightbox'
  import 'photoswipe/style.css'

  const lightbox = new PhotoSwipeLightbox({
    gallery: '#gallery',
    children: 'a',
    pswpModule: () => import('photoswipe'),
  })
  lightbox.init()
</script>

<style>
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 4px;
  }
  .gallery-grid a { display: block; overflow: hidden; }
  .gallery-grid img { display: block; width: 100%; height: auto; }
</style>
```

### 7.6 MapEmbed (static, non-interactive)

Deliberately minimal — a single point, no client-side JS, no mapping vendor lock-in ahead of the §12 decision:

```astro
---
// components/MapEmbed.astro
const { lat, lng, placeName } = Astro.props
---
<a
  href={`https://www.google.com/maps?q=${lat},${lng}`}
  target="_blank"
  rel="noopener"
  class="map-embed"
>
  {placeName ?? 'View location on map'}
</a>
```

Renders on `photo/[slug].astro` (from `photo.gps`) and `gallery/[slug].astro` (from `gallery.location`) wherever those fields are populated. No dependency on MapTiler, MapLibre, or any map tile provider — just a link out. If a visual static-image preview is wanted later, MapTiler's Static Maps API is a one-line addition that still doesn't require the full MapLibre GL stack from §12.

---

## 8. Tagging & Taxonomy

A single flat `tag` document type covers all content. The `category` field enables filtered browse views without a hierarchy.

### 8.1 Tag categories

| Category | Examples | Browse use |
|---|---|---|
| `subject` | Landscape, Architecture, Wildlife | Main navigation filter |
| `region` | Scotland, Iceland, Peak District | Geographic browse |
| `mood` | Golden hour, Stormy, Minimalist | Secondary filter |
| `technique` | HDR, Long exposure, Focus stack | Technical browse |
| `gear-type` | OM-3, M.Zuiko 12-100, ND filter | Gear-linked browse |

### 8.2 Phase 1 tagging behavior

Manual. Tags are created directly in Studio and linked to photos/galleries/posts/gear by hand. Auto-matching from IPTC keywords is a Phase 2 feature (§5.1) — the schema is already compatible, so nothing changes structurally when that arrives.

### 8.3 Tag browse page

```typescript
// pages/tags/[slug].astro — SSR route
export const prerender = false

const { slug } = Astro.params
const { page } = Astro.url.searchParams

const [tag, photos] = await Promise.all([
  client.fetch(tagBySlug, { slug }),
  client.fetch(photosByTag, { tagSlug: slug, offset: (page - 1) * 24, limit: 24 }),
])
```

---

## 9. Gear Section

Gear documents are first-class content. Each piece of equipment has its own page with specs, personal review, rating, and a gallery of photos taken with it. Unchanged from v1.1 — nothing about the Cloudinary/Sanity pivot affects this section structurally, since `gear.heroImage` was always a reference to a `photo` document rather than a direct asset field.

### 9.1 Gear detail page

```typescript
// pages/gear/[slug].astro
const photos = await client.fetch(photosByGear, { gearId: gear._id })
```

Page anatomy:
- Hero image — a photo taken with this gear (manually selected in Studio)
- Specs block — rendered from Portable Text
- Personal review — long-form Portable Text with embedded photo examples
- Numeric rating (1–10)
- Affiliate / purchase links with disclosed affiliate notice
- Photo grid — all photos referencing this gear document

### 9.2 Affiliate disclosure

All affiliate links must be clearly disclosed on gear pages and in any post containing them. Add a sitewide disclosure string to `siteSettings` and render it on every gear page. Per-gear flag `hasAffiliateLinks: boolean` enables conditional rendering.

---

## 10. Video Clips

Short companion clips (10–30s) shot alongside stills. Not standalone content — they accompany photo pages or appear in galleries as atmosphere. This is the one place Cloudinary remains active in Phase 1.

### 10.1 Storage and delivery

- Upload raw MOV/MP4 to Cloudinary manually via the console, or via the Studio's `cloudinary.asset` picker if it supports direct upload — either way, transcoding to HLS + MP4 happens server-side, no `ffmpeg` in this project's own tooling
- `companion.video` (a `cloudinary.asset` field) stores the reference on the `photo` document
- Standalone clips can have their own `gallery` entry if needed, following the same pattern

> **HDR video is deferred alongside the rest of HDR (§3).** Cloudinary's `dr_high` + `vc_h265` HDR video transcoding capability exists and is documented for future reference, but SDR-only video delivery is what's active in Phase 1.

### 10.2 VideoPlayer component

```astro
---
// components/VideoPlayer.astro
import { cloudinaryVideoUrl } from '../lib/cloudinary'

const { video, poster } = Astro.props   // video = companion.video (cloudinary.asset shape)
const videoUrl = cloudinaryVideoUrl(video.public_id, 'mp4')
const hlsUrl   = cloudinaryVideoUrl(video.public_id, 'm3u8')
---

<video
  class="video-player"
  poster={poster}
  muted
  loop
  playsinline
  preload="none"
>
  <source src={hlsUrl}   type="application/x-mpegURL">
  <source src={videoUrl} type="video/mp4">
</video>

<script>
  document.querySelectorAll('.video-player').forEach(v => {
    v.addEventListener('mouseenter', () => v.play())
    v.addEventListener('mouseleave', () => { v.pause(); v.currentTime = 0 })
  })
</script>
```

Note `video.public_id` (snake_case) reflects the shape `sanity-plugin-cloudinary`'s `cloudinary.asset` type actually stores — different from the `videoPublicId` string field name used in v1.1.

---

## 11. Search & Filtering

GROQ full-text search against Sanity's Content Lake — entirely unaffected by the Cloudinary/photo-storage pivot, since search operates over document fields (title, caption text, tags), not asset binaries.

Search is confirmed for Phase 1. It runs as an SSR route on Cloudflare Workers and uses Astro route caching as described in §7.2.

### 11.1 Supported filter combinations

```
?q=storr                          full-text across title + caption
?tag=scotland                     tag slug filter
?tag=scotland&tag=landscape       multiple tags (AND)
?type=photo|post|gallery|gear     content type filter
?gear=om-3                        gear slug filter
?from=2026-01-01&to=2026-06-30    date range on takenAt / publishedAt
?sort=date|relevance              sort order
?page=2                           pagination (24 per page)
```

### 11.2 GROQ filter composition

```typescript
// lib/queries.ts — composable filter builder

function buildSearchQuery(params: SearchParams): string {
  const filters = [`_type in ["photo", "post", "gallery", "gear"]`]

  if (params.q)
    filters.push(
      `[title, pt::text(captionBody), pt::text(body)] match ${JSON.stringify(params.q + '*')}`
    )

  if (params.tags?.length)
    params.tags.forEach(t => filters.push(`"${t}" in tags[]->slug.current`))

  if (params.gear)
    filters.push(`"${params.gear}" in gear[]->slug.current`)

  if (params.from) filters.push(`coalesce(takenAt, publishedAt) >= "${params.from}"`)
  if (params.to)   filters.push(`coalesce(takenAt, publishedAt) <= "${params.to}"`)

  const order = params.q && params.sort !== 'date'
    ? 'order(_score desc)'
    : 'order(coalesce(takenAt, publishedAt) desc)'

  return groq`
    *[${filters.join(' && ')}]
    | score(${params.q ? `boost(title match ${JSON.stringify(params.q + '*')}, 3)` : '1'})
    | ${order}
    [${params.offset}...${params.offset + 24}] {
      _type, _id, title, slug, image,
      "takenAt": coalesce(takenAt, publishedAt)
    }
  `
}
```

### 11.3 Deep-linking results to post anchors

When a `photo` or `gallery` is a search hit, the result links to the post that contains it, anchored to the nearest heading above the embed.

```typescript
// lib/anchors.ts
export function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function blockText(block: any): string {
  return (block.children ?? []).map((c: any) => c.text).join('')
}
```

```typescript
// lib/embedMap.ts — given a post, map embedded photo/gallery IDs → anchor id
export function buildEmbedMap(post: Post): Record<string, string> {
  const map: Record<string, string> = {}
  let currentAnchor = ''

  for (const block of post.body) {
    if (block._type === 'block' && ['h2', 'h3'].includes(block.style)) {
      currentAnchor = headingSlug(blockText(block))
    }
    if (block._type === 'photoEmbed' && block.photo?._ref) {
      map[block.photo._ref] = currentAnchor
    }
    if (block._type === 'galleryEmbed' && block.gallery?._ref) {
      map[block.gallery._ref] = currentAnchor
    }
  }
  return map
}
```

A photo that appears in no post links to its standalone `/photos/[slug]` page as the fallback.

---

## 12. Map Adventures — Deferred

**Status: parked.** Full design retained below; nothing in this section is built in Phase 1. The `mapConfig`, `track`, and `mapStops` schema fields exist on `post` (§4.3) but are dormant — no renderer reads them yet.

### 12.1 The core idea, for when this resumes

Some posts are journeys: a hike with a GPS track, a road trip with photo clusters at each stop. `photo.gps` gives point data; a separate **GPX file** (from Strava, AllTrails, or the OM-3's OI.Share companion-app workflow) gives the route line. Timestamp-matching photos to GPX trackpoints was identified as a co-primary placement mechanism (not just a fallback), since the OM-3 has no built-in GPS receiver.

### 12.2 Planned interaction patterns

Three MapLibre GL modes on a single mode-switched component:

- **`journey`** — track line + numbered stops (primary hike/road-trip case)
- **`cluster`** — Apple-Photos-style zoomable clustering of all geotagged photos
- **`scroll`** — scrollytelling, sticky map + `IntersectionObserver`-driven camera moves

### 12.3 Planned stack

MapLibre GL JS (open-source Mapbox GL fork) + MapTiler vector tiles (free tier). `@tmcw/togeojson` + `@turf/simplify` for the GPX → GeoJSON ingest pipeline, which would live in the Phase 2 CLI's `--track` flag.

### 12.4 What's already live and does *not* wait for this

The simple, static `MapEmbed.astro` component (§7.6) covers "show me roughly where this was taken" today, with zero dependency on any of the above. Map Adventures is specifically the *interactive route/journey* layer on top of that baseline.

---

## 13. Growth Path

| When | Trigger | Action |
|---|---|---|
| Manual authoring feels limiting | More than a handful of shoots | Build the Phase 2 ingest CLI (§5) |
| HDR is ready to revisit | Core site stable, content flowing | Resolve the gain-map-as-plain-JPG question (§3.3) before assuming a Cloudinary photo migration is needed |
| Map Adventures ready to revisit | You have a GPX-tracked adventure worth featuring | Build the GPX pipeline + MapLibre component (§12) |
| Sanity storage near 10 GB | Photo count growing | This is now the binding storage constraint (photos are native to Sanity) — evaluate Sanity Growth plan or reconsider Cloudinary-for-photos at this point |
| Cloudinary free tier limit | High video traffic/volume | Upgrade to Cloudinary Plus (~$89/mo). URL scheme unchanged |
| Print sales | Ready to monetise | Add Stripe + Printful/Prodigi. `photo` document gets a `prints[]` array |
| Better SEO on tag pages | Organic traffic goal | Route caching (§7.2) already gets you most of the ISR-equivalent benefit without a separate migration step |
| Instant/fuzzy search | Archive into the thousands | Add Pagefind or Typesense. Deep-link logic (§11.3) unchanged |
| Sanity paid plan | >500k API calls or collaboration | Upgrade to Sanity Growth. Schema and content migrate automatically |

---

## 14. Open Questions

| # | Question | Notes |
|---|---|---|
| 1 | Gain-map-as-plain-JPG hypothesis (§3.3) | Needs empirical validation before Phase 2/HDR planning assumes a photo-storage migration is required. Test: does a JPG gain map served as-is from Sanity's native image pipeline render correctly, or does Sanity's transform layer strip/break the gain map on any code path (even at `auto('format')` with no other params)? |
| 2 | Does the Phase 2 CLI handle video upload too? | Open per §5.2 — decide at Phase 2 kickoff, not now. |
| 3 | Watermarking | Not addressed in Phase 1 at all. Revisit once HDR is back in scope, since watermarking and gain maps interact (transform-based watermarking can destroy a gain map). |
| 4 | Print sales integration | Deferred, unchanged from v1.1 — Printful/Prodigi + Stripe, separate planning session when ready. |

---

## Appendix A: Cost & Hosting Boundaries

A deliberate list of what's available but **not** turned on, and why:

| Product | Available? | Why not used |
|---|---|---|
| Cloudflare Workers | Yes, free tier | This is the active Astro hosting target for Phase 1, not a deferred product |
| Workers Builds | Yes, free tier | Active deploy path for Git-based builds; `wrangler.jsonc` keeps deploy settings in the repo |
| Cloudflare Image Resizing | Yes, but requires **Pro plan ($20/mo)** for external-source images | Sanity's free image CDN already covers this need |
| Cloudflare Images (storage product) | Yes, usage-based pricing | Not storing originals with Cloudflare; irrelevant to this architecture |
| Cloudflare Workers Cache (private beta) | Not generally available | Astro 7's `cacheCloudflare()` provider depends on it; using `memoryCache()` instead |
| Cloudinary for photos | Was the v1.1 plan | Replaced by Sanity's native image type — see "What changed" table at top |
| `astro:assets` build-time image optimization | Available, works with `image.remotePatterns` | Would duplicate what Sanity's CDN already does per-request, and adds build time as photo count grows |

**Current Phase 1 recurring cost: $0**, except Cloudinary's free tier (25 GB storage / 25 GB bandwidth) for video, which is not expected to be exceeded at personal-portfolio video volume. Cloudflare Workers and Workers Builds stay on the free tier for the expected traffic and deploy cadence.

---

## Appendix B: Version History

| Version | Date | Summary |
|---|---|---|
| 1.0 | April 2026 | Original plan. Cloudinary for all assets, AVIF-based HDR strategy, ingest CLI in initial scope. |
| 1.1 | June 2026 | Stack version updates (Astro 6, Sanity Studio v4). Added Search (§11) and Map Adventures (§12) as major features. |
| **2.0** | **June 2026** | **Lean launch pivot.** Photos moved to native Sanity images; Cloudinary scoped to video only; HDR, Map Adventures, and the ingest CLI all deferred to Phase 2/future; Astro 6→7; route caching adopted; Cloudflare's paid image products explicitly evaluated and rejected. |
| **2.1** | **July 2026** | **Scaffold correction pass.** Cloudflare Workers replaces the old Pages target; Node floor moves to `>=22.12.0`; Workers Builds + `wrangler.jsonc` become the deploy setup; `REVALIDATE_SECRET` is added; affiliate disclosure fields are added; search is confirmed for Phase 1; alt text is manual with Studio warnings. |
| **2.2** | **July 2026** | **Environment note pass.** Added [`docs/stack-notes.md`](stack-notes.md) as the source of truth for Cloudflare and Cloudinary env placement, including `.env.local`, CI secrets, Workers settings, and the split between public delivery values and private upload/deploy secrets. |
| **2.3** | **July 2026** | **Image-ratio decision.** Published photographs must keep their original aspect ratios. Existing crop transforms and cover-style layouts are tracked as design debt to remove during component redesign. |
