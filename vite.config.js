import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

function stripVitePreloadPlugin() {
  return {
    name: 'strip-vite-preload',
    generateBundle(options, bundle) {
      for (const fileName in bundle) {
        if (fileName.includes('background') || fileName.includes('dbEvents')) {
          const file = bundle[fileName];
          if (file.type === 'chunk' && file.code.includes('__vitePreload')) {
            file.code = file.code.replace(
              /__vitePreload\(([^,]+),[^)]+\)/g,
              (match, moduleFactory) => {
                // Extract the module factory (e.g., () => import('./db.js'))
                return moduleFactory.trim(); // Keep the factory as-is (e.g., () => import('./db.js'))
              }
            );
            console.log(`[strip-vite-preload] Replaced __vitePreload in ${fileName}`);
          }
        }
      }
    }
  };
}

const isBackground = process.env.BUILD_TARGET === 'background';

export default defineConfig({
  define: isBackground
    ? { document: 'undefined' }
    : {},
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
        ...(isBackground ? { inlineDynamicImports: true } : {})
      }
    },
    emptyOutDir: true,
  },
  plugins: [
    stripVitePreloadPlugin(),
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
        { src: 'src/events', dest: '.' },
        { src: 'src/assets', dest: '.' },
        { src: 'src/xenova', dest: '.' },
        { src: 'src/model', dest: '.' },
        { src: 'src/wasm', dest: '.' }
      ]
    })
  ]
});