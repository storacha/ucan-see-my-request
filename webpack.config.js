const CopyPlugin = require('copy-webpack-plugin');

const path = require('path');
const outputPath = 'dist';
const entryPoints = {
    main: path.resolve(__dirname, 'src', 'main.ts'),
    panel: path.resolve(__dirname, 'src', 'panel.tsx'),
};

module.exports = {
  entry: entryPoints,
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
          patterns: [{ from: '.', to: '.', context: 'public' }]
      }),
  ]
};