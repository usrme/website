import { z, defineCollection } from 'astro:content'
import { docsSchema } from '@astrojs/starlight/schema'

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    draft: z.boolean().optional(),
  }),
})

const tilsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    draft: z.boolean().optional(),
  }),
})

export const collections = {
  docs: defineCollection({ schema: docsSchema() }),
  posts: postsCollection,
  tils: tilsCollection,
}
