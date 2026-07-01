# Stack notes

## Cloudflare and Cloudinary environment variables

Question: What Cloudflare and Cloudinary API keys are needed, and must they be in `.env.local`?

Conclusion: No, not everything belongs in `.env.local`. Use `.env.local` for local development values. Put production secrets in Cloudflare Workers, Workers Builds, or CI secrets.

Use `.env.local`, not `env.local`. Astro and Vite look for `.env.local`.

### Web app runtime

These values are needed by the Astro web app:

```bash
PUBLIC_SANITY_PROJECT_ID=
PUBLIC_SANITY_DATASET=production
PUBLIC_SANITY_API_VERSION=2026-07-01
PUBLIC_CLOUDINARY_CLOUD_NAME=
REVALIDATE_SECRET=
```

`PUBLIC_CLOUDINARY_CLOUD_NAME` is enough for the Phase 1 video player because the app only builds Cloudinary delivery URLs. It does not upload, delete, or manage Cloudinary assets.

`REVALIDATE_SECRET` is private. Do not prefix it with `PUBLIC_`.

### Cloudinary

Only add these if this project uploads or manages Cloudinary assets from code, a CLI, or server-side scripts:

```bash
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Some Cloudinary SDK flows can also use:

```bash
CLOUDINARY_URL=
```

For Phase 1, Cloudinary is video-only. The public cloud name is needed for delivery. The API key and secret are only needed for upload or Admin API work.

### Cloudflare

These are deploy credentials, not app runtime variables:

```bash
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

Use `CLOUDFLARE_API_TOKEN` for Wrangler or CI deploys. Do not put the older global Cloudflare API key in the app environment.

Local deploys can read these from `.env.local` or the shell. Production deploys should read them from Cloudflare or CI secrets.

### Rule of thumb

`PUBLIC_` values can reach browser code. Anything secret must not use `PUBLIC_`.

`.env.local` is for local development. Production secrets belong in the hosting or CI platform.
