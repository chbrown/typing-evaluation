const path = require('path')

const env = process.env.NODE_ENV || 'development'

module.exports = {
  mode: env,
  entry: {
    admin: './ui/admin/app',
    experiment: './ui/experiment/app',
  },
  output: {
    path: path.resolve(__dirname, 'ui', 'dist'),
  },
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
