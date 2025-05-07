import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel.js'),
        background: resolve(__dirname, 'src/background.js'),
        modelLoaderWorkerOffscreen: resolve(__dirname, 'src/modelLoaderWorkerOffscreen.js'),
        modelWorker: resolve(__dirname, 'src/model-worker.js'),
        scriptingReadabilityHelper: resolve(__dirname, 'src/scriptingReadabilityHelper.js'),
        pageExtractor: resolve(__dirname, 'src/PageExtractor.js'),
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
        { src: 'src/model-worker.js', dest: '.' },
        { src: 'src/theme-loader.js', dest: '.' },
        { src: 'src/modelLoaderWorkerOffscreen.html', dest: '.' },
        { src: 'src/output.css', dest: '.' },
        { src: 'src/sidepanel.css', dest: '.' },
        { src: 'src/notifications.js', dest: '.' },
        { src: 'src/downloadFormatter.js', dest: '.' },
        { src: 'icons', dest: '.' },
        { src: 'src/events/dbEvents.js', dest: 'events' },
        { src: 'node_modules/prismjs/prism.js', dest: 'assets' },
        { src: 'node_modules/prismjs/components/prism-json.min.js', dest: 'assets' },
        { src: 'node_modules/prismjs/themes/prism-okaidia.css', dest: 'assets' },
        { src: 'src/assets/marked.min.js', dest: 'assets' },
        // { src: 'node_modules/webextension-polyfill/dist/browser-polyfill.js', dest: 'assets' },
        {src: 'src/xenova', dest: '.'},
        {src: 'src/model', dest: '.'},
        {src: 'src/wasm', dest: '.'}
      ]
    })
  ]
});