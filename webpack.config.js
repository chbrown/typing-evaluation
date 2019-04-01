const {resolve} = require('path')

const webpack = require('webpack')
const LessPluginCleanCSS = require('less-plugin-clean-css')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const postcssPresetEnv = require('postcss-preset-env')

const mode = process.env.NODE_ENV || 'development'

module.exports = {
  mode,
  entry: {
    admin: './ui/admin/app',
    experiment: './ui/experiment/app',
    site: './ui/site.less',
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
    new MiniCssExtractPlugin(),
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
      {
        test: /\.less$/,
        exclude: /node_modules/,
        use: [{
          loader: MiniCssExtractPlugin.loader,
        }, {
          loader: 'css-loader',
          options: {
            importLoaders: 2,
          },
        }, {
          loader: 'postcss-loader',
          options: {
            plugins: [
              postcssPresetEnv(),
            ],
          },
        }, {
          loader: 'less-loader',
          options: {
            plugins: [
              new LessPluginCleanCSS({keepBreaks: true, advanced: false}),
            ],
          },
        }],
      },
    ],
  },
}
