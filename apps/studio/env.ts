import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'

const studioDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(studioDir, '../..')

for (const file of [
  resolve(studioDir, '.env.local'),
  resolve(studioDir, '.env'),
  resolve(repoRoot, '.env.local'),
  resolve(repoRoot, '.env'),
]) {
  if (existsSync(file)) {
    loadEnvFile(file)
  }
}

export function getStudioProjectId() {
  const projectId =
    process.env.SANITY_STUDIO_PROJECT_ID ||
    process.env.SANITY_PROJECT_ID ||
    process.env.PUBLIC_SANITY_PROJECT_ID ||
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID

  if (!projectId) {
    throw new Error(
      'Missing Sanity project ID. Set SANITY_STUDIO_PROJECT_ID, SANITY_PROJECT_ID, PUBLIC_SANITY_PROJECT_ID, or NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local.',
    )
  }

  return projectId
}

export function getStudioDataset() {
  return (
    process.env.SANITY_STUDIO_DATASET ||
    process.env.SANITY_DATASET ||
    process.env.PUBLIC_SANITY_DATASET ||
    process.env.NEXT_PUBLIC_SANITY_DATASET ||
    'production'
  )
}
