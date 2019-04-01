const {resolve} = require('path')

const webpack = require('webpack')

const mode = process.env.NODE_ENV || 'development'

module.exports = {
  mode,
  entry: {
    admin: './ui/admin/app',
    experiment: './ui/experiment/app',
  },
  output: {
    path: resolve(__dirname, 'ui', 'dist'),
  },
  plugins: [
    new webpack.DefinePlugin({
      process: {
        env: {
          NODE_ENV: JSON.stringify(mode),
        },
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
            plugins: ['transform-object-rest-spread', 'angularjs-annotate'],
          },
        },
      },
    ],
  },
}
