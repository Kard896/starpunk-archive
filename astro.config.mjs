// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Auto-wikilink plugin + tags map
import { remarkAutoLinkTerms } from './src/markdown/remark-auto-link-terms.js';
import { WIKI_TERMS } from './src/data/wiki-terms.js';

export default defineConfig({
  // Redirects
  redirects: {
    '/index/': '/',
    '/archive/': '/logs/',   // old Archive → new User Logs
    '/reference/luna/': '/reference/characters/luna/',
    '/characters/luna/': '/reference/characters/luna/',
  },

  // Markdown / auto-linking config
  markdown: {
    remarkPlugins: [
      [
        remarkAutoLinkTerms,
        {
          terms: WIKI_TERMS,
          caseInsensitive: true,
          maxPerPage: 8,
          linkHeadings: false,
          possessivesAndPlurals: true,
        },
      ],
    ],
  },

  // Alias so you can use "@/components/TagList.astro"
  vite: {
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },

  // Starlight config
  integrations: [
    starlight({
      title: 'Starpunk Archive',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' },
      ],
      sidebar: [
        {
          label: 'Home',
          items: [{ label: 'Welcome', link: '/' }],
        },
        {
          label: 'Reference',
          autogenerate: {
            directory: 'reference',
            // Sort by frontmatter 'order' first, then title
            sort: (a, b) => {
              const orderA = a.entry.data.order ?? 999;
              const orderB = b.entry.data.order ?? 999;
              if (orderA !== orderB) return orderA - orderB;
              return a.entry.data.title.localeCompare(b.entry.data.title);
            },
          },
        },
        {
          label: 'User Logs',
          autogenerate: {
            directory: 'logs',
            // Same sorting logic for logs
            sort: (a, b) => {
              const orderA = a.entry.data.order ?? 999;
              const orderB = b.entry.data.order ?? 999;
              if (orderA !== orderB) return orderA - orderB;
              return a.entry.data.title.localeCompare(b.entry.data.title);
            },
          },
        },
      ],

      components: {
        // Replace the default pagination footer with nothing
        Pagination: '@/components/starlight/Pagination.astro',
      },
    }),
  ],
});

