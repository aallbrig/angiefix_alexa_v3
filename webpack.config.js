
var path = require('path');
var webpack = require('webpack');
var ignore = new webpack.IgnorePlugin(/^(aws-sdk|dynamodb-doc)$/);

module.exports = {
  entry: './src/main.js',
  output: {
    path: path.join(__dirname, 'dist'),
    library: '[name]',
    libraryTarget: 'commonjs2',
    filename: '[name].js'
  },
  target: 'node',
  module: {
    preLoaders: [
      {test: /\.js$/, loader: 'eslint-loader', exclude: /node_modules/}
    ],
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.json$/,
        loader: 'json'
      }
    ]
  },
  plugins: [ignore],
  eslint: {
    configFile: '.eslintrc'
  }
};
