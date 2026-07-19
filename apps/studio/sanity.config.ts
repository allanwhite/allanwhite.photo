import { table } from '@sanity/table'
import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { presentationTool } from 'sanity/presentation'
import { structureTool } from 'sanity/structure'
import { cloudinarySchemaPlugin } from 'sanity-plugin-cloudinary'
import { media } from 'sanity-plugin-media'
import { getStudioDataset, getStudioProjectId } from './env'
import { presentationResolve } from './presentation/resolve'
import { schemaTypes } from './schemas'

const projectId = getStudioProjectId()
const dataset = getStudioDataset()
const previewUrl = process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:4321'

export default defineConfig({
  name: 'default',
  title: 'Allan White Photo',
  projectId,
  dataset,
  plugins: [
    structureTool(),
    media(),
    visionTool({ title: 'Data', defaultApiVersion: '2026-07-01' }),
    presentationTool({
      title: 'Preview',
      previewUrl: {
        initial: previewUrl,
        previewMode: {
          enable: '/api/draft-mode/enable',
          disable: '/api/draft-mode/disable',
        },
      },
      resolve: presentationResolve,
    }),
    cloudinarySchemaPlugin(),
    table(),
  ],
  schema: {
    types: schemaTypes,
  },
})
