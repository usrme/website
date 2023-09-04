import { z, defineCollection } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

const postsCollection = defineCollection({
    type: 'content',
    schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    })
});

export const collections = {
    docs: defineCollection({ schema: docsSchema() }),
    posts: postsCollection,
};
