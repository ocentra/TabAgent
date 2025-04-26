import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel.js'),
        background: resolve(__dirname, 'src/background.js'),
        offscreen: resolve(__dirname, 'src/offscreen.js'),
        scriptingReadabilityHelper: resolve(__dirname, 'src/scriptingReadabilityHelper.js')
      },
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
      }
    },
    emptyOutDir: true,
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'src/sidepanel.html', dest: '.' },
        { src: 'src/content.js', dest: '.' },
        { src: 'src/webScraper.js', dest: '.' },
        { src: 'src/theme-loader.js', dest: '.' },
        { 
          src: 'node_modules/@mozilla/readability/Readability.js', 
          dest: '.' 
        },
        { src: 'src/offscreen.html', dest: '.' },
        { src: 'src/output.css', dest: '.' },
        { src: 'src/sidepanel.css', dest: '.' },
        { src: 'src/notifications.js', dest: '.' },
        { src: 'src/downloadFormatter.js', dest: '.' },
        { src: 'icons', dest: '.' }
      ]
    })
  ]
}); 