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
        { src: 'src/PageExtractor.js', dest: '.' },
        { src: 'src/content.js', dest: '.' },
        { src: 'src/theme-loader.js', dest: '.' },
        { src: 'src/stage2-helper.js', dest: '.' },
        { src: 'src/offscreen.html', dest: '.' },
        { src: 'src/output.css', dest: '.' },
        { src: 'src/sidepanel.css', dest: '.' },
        { src: 'src/notifications.js', dest: '.' },
        { src: 'src/downloadFormatter.js', dest: '.' },
        { src: 'icons', dest: '.' },
        { src: 'node_modules/prismjs/prism.js', dest: 'assets' },
        { src: 'node_modules/prismjs/components/prism-json.min.js', dest: 'assets' },
        { src: 'node_modules/prismjs/themes/prism-okaidia.css', dest: 'assets' }
      ]
    })
  ]
}); 