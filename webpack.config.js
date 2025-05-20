import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import CopyWebpackPlugin from 'copy-webpack-plugin';

// ESM-compatible __dirname (fix for Windows)
const __dirname = path.dirname(
  new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
);

// Reusable function to generate patterns for all items in a folder
function copyFolder(srcDir, destDir) {
  const absSrcDir = path.resolve(__dirname, srcDir);
  if (!fs.existsSync(absSrcDir)) return [];
  return fs.readdirSync(absSrcDir).map(item => ({
    from: path.join(absSrcDir, item),
    to: path.join(destDir, item)
  }));
}

export default {
  mode: 'development', // Change to 'production' for minified output
  entry: {
    sidepanel: path.resolve(__dirname, 'src/sidepanel.ts'),
    background: path.resolve(__dirname, 'src/background.ts'),
    modelWorker: path.resolve(__dirname, 'src/model-worker.ts'),
    scriptingReadabilityHelper: path.resolve(__dirname, 'src/scriptingReadabilityHelper.ts'),
    pageExtractor: path.resolve(__dirname, 'src/PageExtractor.ts'),
    db: path.resolve(__dirname, 'src/DB/db.ts'),
    content: path.resolve(__dirname, 'src/content.ts'),
    indexedDBBackendWorker: path.resolve(__dirname, 'src/DB/indexedDBBackendWorker.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: (pathData) => {
      if (pathData.chunk && pathData.chunk.name === 'indexedDBBackendWorker') {
        return 'DB/[name].js'; // Output worker to dist/DB/indexedDBBackendWorker.js
      }
      return '[name].js'; // All others to dist/[name].js
    },
    chunkFilename: 'assets/[name]-[contenthash].js',
    assetModuleFilename: 'assets/[name]-[contenthash][ext]',
    clean: true,
  },
  devtool: 'source-map',
  optimization: {
    minimize: false,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },      
        { from: 'src/sidepanel.html', to: '.' },
        { from: 'src/output.css', to: '.' },
        { from: 'src/sidepanel.css', to: '.' },
        { from: 'src/events', to: 'events' },
        { from: 'src/theme-loader.js', to: '.' },
        ...copyFolder('icons', 'icons'),
        ...copyFolder('src/assets', 'assets'),
        ...copyFolder('src/xenova', 'xenova'),
        ...copyFolder('src/model', 'model'),
        ...copyFolder('src/wasm', 'wasm'),
      ],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      '@vendor': path.resolve(__dirname, 'src/vendor'),
    },
    fallback: {
      fs: false,
      path: false,
      crypto: false
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // Add loaders here if you need to handle CSS, images, etc.
    ],
  },
}; 