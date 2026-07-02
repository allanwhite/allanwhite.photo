import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { loadEnvFile } from 'node:process'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const studioDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(studioDir, '../..')

for (const file of [
  resolve(repoRoot, '.env.local'),
  resolve(repoRoot, '.env'),
  resolve(studioDir, '.env.local'),
  resolve(studioDir, '.env'),
]) {
  if (existsSync(file)) {
    loadEnvFile(file)
  }
}

process.env.SANITY_STUDIO_PROJECT_ID ||= process.env.SANITY_PROJECT_ID
process.env.SANITY_STUDIO_PROJECT_ID ||= process.env.PUBLIC_SANITY_PROJECT_ID
process.env.SANITY_STUDIO_PROJECT_ID ||= process.env.NEXT_PUBLIC_SANITY_PROJECT_ID

process.env.SANITY_STUDIO_DATASET ||= process.env.SANITY_DATASET
process.env.SANITY_STUDIO_DATASET ||= process.env.PUBLIC_SANITY_DATASET
process.env.SANITY_STUDIO_DATASET ||= process.env.NEXT_PUBLIC_SANITY_DATASET
process.env.SANITY_STUDIO_DATASET ||= 'production'

const sanityBin = resolve(studioDir, 'node_modules/sanity/bin/sanity')
const result = spawnSync(process.execPath, [sanityBin, ...process.argv.slice(2)], {
  cwd: studioDir,
  env: process.env,
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
