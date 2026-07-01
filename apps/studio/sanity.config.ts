import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { cloudinarySchemaPlugin } from 'sanity-plugin-cloudinary'
import { getStudioDataset, getStudioProjectId } from './env'
import { schemaTypes } from './schemas'

const projectId = getStudioProjectId()
const dataset = getStudioDataset()

export default defineConfig({
  name: 'default',
  title: 'Allan White Photo',
  projectId,
  dataset,
  plugins: [structureTool(), cloudinarySchemaPlugin()],
  schema: {
    types: schemaTypes,
  },
})
