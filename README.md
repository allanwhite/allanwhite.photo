# Allan White Photo

A personal photography site and publishing workspace. The public site reads articles, photos, and other editorial content from Sanity, delivers video through Cloudinary, and runs on Cloudflare Workers.

## Stack

- `apps/web`: Astro 7, Sanity client, PhotoSwipe, and the Cloudflare adapter
- `apps/studio`: Sanity Studio 6 and React 19
- pnpm workspace with Node.js 22.12 or newer and pnpm 11.5.2

## Install

From the repository root:

```sh
pnpm install
cp .env.example .env.local
cp .env.example apps/web/.env.local
```

The root `.env.local` is read by Sanity Studio. Astro reads `apps/web/.env.local`. Add the same Sanity project and dataset values to both files.

The main local values are:

```sh
PUBLIC_SANITY_PROJECT_ID=
PUBLIC_SANITY_DATASET=production
PUBLIC_SANITY_API_VERSION=2026-07-01
PUBLIC_CLOUDINARY_CLOUD_NAME=
REVALIDATE_SECRET=
```

The Cloudinary cloud name is only needed for video delivery. Keep `REVALIDATE_SECRET` private. See [docs/stack-notes.md](docs/stack-notes.md) for the full environment variable notes.

## Run locally

Start the web app and Studio in separate terminals:

```sh
pnpm dev:web
pnpm dev:studio
```

By default, Astro runs at `http://localhost:4321` and Studio runs at `http://localhost:3333`.

Build both apps or preview the production web build:

```sh
pnpm build
pnpm preview:web
```

## Deploy

### Web app

The web app deploys to Cloudflare Workers using `apps/web/wrangler.jsonc`.

For a manual deploy, authenticate with Cloudflare, then build and deploy from the repository root:

```sh
pnpm --filter @allanwhite/photo-web exec wrangler login
pnpm build:web
pnpm --filter @allanwhite/photo-web exec wrangler deploy
```

For Workers Builds or another CI service, use `pnpm build:web` as the build command and `pnpm --filter @allanwhite/photo-web exec wrangler deploy` as the deploy command. Store production values and the Cloudflare credentials in the hosting or CI environment, not in committed env files.

### Sanity Studio

Deploy the Studio from the repository root:

```sh
pnpm --filter @allanwhite/photo-studio deploy
```

The Sanity CLI will ask you to sign in if needed.

## Project plan

See [docs/photography-platform-plan-v2.md](docs/photography-platform-plan-v2.md) for the current product and architecture plan.
