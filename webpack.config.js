const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  // 1. Entradas: Solo popup y content
  entry: {
    popup: './src/popup.js',
    content: './src/content.js',
    // ELIMINA 'background'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'public',
          to: '.',
        },
      ],
    }),
  ],
};