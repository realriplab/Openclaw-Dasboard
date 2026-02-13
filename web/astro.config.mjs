// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    },
    imageService: 'passthrough'
  }),
  vite: {
    plugins: [tailwindcss()]
  },
  server: {
    port: 4321,
    host: true
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/noop'
    }
  }
});
