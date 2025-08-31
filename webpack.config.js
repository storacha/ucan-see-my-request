const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

// Determine build target from environment variable
const isSafari = process.env.BUILD_TARGET === 'safari';
const outputPath = 'dist';

// Chrome entry points - original implementation
const chromeEntryPoints = {
  main: path.resolve(__dirname, 'src', 'main.ts'),
  panel: path.resolve(__dirname, 'src', 'panel.tsx'),
};

// Safari entry points - with polyfill and content script
const safariEntryPoints = {
  'safari-main': ['webextension-polyfill', path.resolve(__dirname, 'src', 'safari', 'main.ts')],
  'safari-panel': ['webextension-polyfill', path.resolve(__dirname, 'src', 'safari', 'panel.tsx')],
  'safari-content-script': ['webextension-polyfill', path.resolve(__dirname, 'src', 'safari', 'content-script.ts')],
  'safari-background': ['webextension-polyfill', path.resolve(__dirname, 'src', 'safari', 'background.ts')],
};

// Chrome copy patterns - original manifest
const chromeCopyPatterns = [
  { from: '.', to: '.', context: 'public', globOptions: { ignore: ['**/safari-manifest.json'] } }
];

// Safari copy patterns - Safari manifest renamed to manifest.json
const safariCopyPatterns = [
  { from: '.', to: '.', context: 'public', globOptions: { ignore: ['**/manifest.json'] } },
  { from: 'safari-manifest.json', to: 'manifest.json', context: 'public' }
];

module.exports = {
  entry: isSafari ? safariEntryPoints : chromeEntryPoints,
  output: {
    path: path.join(__dirname, outputPath),
    filename: '[name].js',
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(jpg|jpeg|png|gif|woff|woff2|eot|ttf|svg)$/i,
        use: 'url-loader?limit=1024'
      },
      {
        exclude: /node_modules/,
        test: /\.css$/i,
        use: [
          "style-loader",
          "css-loader"
        ]
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: isSafari ? safariCopyPatterns : chromeCopyPatterns
    }),
  ]
};