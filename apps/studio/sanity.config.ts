import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { cloudinarySchemaPlugin } from 'sanity-plugin-cloudinary'
import { schemaTypes } from './schemas'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'abc12345'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

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
