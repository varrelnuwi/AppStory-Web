const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production'; // deteksi mode build

module.exports = {
  // 🟩 Entry utama
  entry: './src/index.js',

  // 🟩 Output build
  output: {
    filename: 'bundle.[contenthash].js',
    path: path.resolve(__dirname, isProd ? 'docs' : 'dist'), 
    clean: true,
    publicPath: isProd ? '/AppStory-Web/' : '/', 
  },

  // 🟩 Dev server (untuk localhost)
  devServer: {
    static: [
      { directory: path.join(__dirname, 'dist') },
      { directory: path.join(__dirname, 'public') },
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

  // 🟩 Plugins
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: 'body',
      publicPath: isProd ? '/AppStory-Web/' : '/', // penting biar JS path benar di deploy
    }),

    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/manifest.webmanifest', to: '' },
        { from: 'public/icons', to: 'icons' },
        { from: 'public/sw.js', to: '' },
        { from: 'public/sw-register.js', to: '' },
        { from: path.resolve(__dirname, 'src/app.css'), to: 'app.css' },
        { from: 'node_modules/leaflet/dist/images', to: 'images' },
      ],
    }),
  ],
};
