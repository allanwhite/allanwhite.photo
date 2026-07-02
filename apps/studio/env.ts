export function getStudioProjectId() {
  const projectId = process.env.SANITY_STUDIO_PROJECT_ID

  if (!projectId) {
    throw new Error(
      'Missing Sanity project ID. Start Studio with `pnpm dev:studio` so root .env.local is loaded, or set SANITY_STUDIO_PROJECT_ID.',
    )
  }

  return projectId
}

export function getStudioDataset() {
  return process.env.SANITY_STUDIO_DATASET || 'production'
}
