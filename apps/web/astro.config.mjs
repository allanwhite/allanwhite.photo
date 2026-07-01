import cloudflare from '@astrojs/cloudflare'
import { defineConfig, memoryCache, sessionDrivers } from 'astro/config'

export default defineConfig({
  adapter: cloudflare({
    imageService: 'passthrough',
    inspectorPort: false,
  }),
  session: {
    driver: sessionDrivers.lruCache(),
  },
  cache: {
    provider: memoryCache(),
  },
  routeRules: {
    '/tags/[slug]': { maxAge: 300, swr: 60 },
    '/search': { maxAge: 60, swr: 30 },
  },
})
