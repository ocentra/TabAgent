const fs = require('fs');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Reusable function to generate patterns for all items in a folder
function copyFolder(srcDir, destDir) {
  const absSrcDir = path.resolve(__dirname, srcDir);
  if (!fs.existsSync(absSrcDir)) return [];
  return fs.readdirSync(absSrcDir).map(item => ({
    from: path.join(absSrcDir, item),
    to: path.join(destDir, item)
  }));
}

module.exports = {
  mode: 'development', // Change to 'production' for minified output
  entry: {
    sidepanel: path.resolve(__dirname, 'src/sidepanel.js'),
    background: path.resolve(__dirname, 'src/background.js'),
    modelWorker: path.resolve(__dirname, 'src/model-worker.js'),
    scriptingReadabilityHelper: path.resolve(__dirname, 'src/scriptingReadabilityHelper.js'),
    pageExtractor: path.resolve(__dirname, 'src/PageExtractor.js'),
    minimaldb: path.resolve(__dirname, 'src/minimaldb.js'),
    sqlWorker: path.resolve(__dirname, 'src/js/absurd-sql-backends/sql-worker.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: (pathData) => {
      if (pathData.chunk && pathData.chunk.name === 'sqlWorker') {
        return 'js/absurd-sql-backends/sql-worker.js';
      }
      return '[name].js';
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
        { from: 'src/content.js', to: '.' },
        { from: 'src/model-worker.js', to: '.' },
        { from: 'src/theme-loader.js', to: '.' },       
        { from: 'src/output.css', to: '.' },
        { from: 'src/sidepanel.css', to: '.' },
        { from: 'src/notifications.js', to: '.' },
        { from: 'src/downloadFormatter.js', to: '.' },
        { from: 'src/modelAssetDownloader.js', to: '.' },
        { from: 'src/events', to: 'events' },
        ...copyFolder('icons', 'icons'),
        ...copyFolder('src/events', 'events'),
        ...copyFolder('src/assets', 'assets'),
        ...copyFolder('src/xenova', 'xenova'),
        ...copyFolder('src/model', 'model'),
        ...copyFolder('src/wasm', 'wasm'),
        ...copyFolder('src/vendor/absurd-sql/dist', 'absurd-sql'),
        ...copyFolder('src/vendor/sql.js/dist', 'sql.js'),
      ],
    }),
  ],
  resolve: {
    extensions: ['.js', '.json'],
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
      // Add loaders here if you need to handle CSS, images, etc.
    ],
  },
}; 