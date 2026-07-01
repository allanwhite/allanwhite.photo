import { defineCliConfig } from 'sanity/cli'
import { getStudioDataset, getStudioProjectId } from './env'

const projectId = getStudioProjectId()
const dataset = getStudioDataset()

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
})
