import { defineConfig } from 'astro/config';

// Static output only: no server, no runtime secrets, nothing to attack at the edge.
export default defineConfig({
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'never' },
  devToolbar: { enabled: false },
});
