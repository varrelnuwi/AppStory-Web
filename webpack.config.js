const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  // 🟩 Entry utama
  entry: './src/index.js',

  // 🟩 Output build
  output: {
    filename: 'bundle.[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/', // biar path absolut (untuk SW & routing)
  },

  // 🟩 Dev server untuk mode development
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist'),
      },
      {
        directory: path.join(__dirname, 'public'),
      },
    ],
    historyApiFallback: true,
    port: 8080,
  },

  // 🟩 Loader untuk JS, CSS, dan asset
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { presets: ['@babel/preset-env'] },
        },
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },

  // 🟩 Plugin
  plugins: [
    // 🔹 Inject bundle ke public/index.html otomatis
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),

    // 🔹 Copy file static penting dari public → dist
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/manifest.webmanifest', to: '' },
        { from: 'public/icons', to: 'icons' },
        { from: 'public/sw.js', to: '' },
      ],
    }),
  ],
};
