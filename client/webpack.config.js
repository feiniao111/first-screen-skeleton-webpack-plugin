const path = require('path')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  mode: 'development',
  module: {
    rules: [{
      test: /\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['env']
        }
      },
      exclude: /node_modules/ // TODO: 发布为插件时，这句话要去除
    }, {
      test: /\.css$/,
      use: [
        "style-loader",
        "css-loader"
      ]
    }, {
      test: /\.tpl\.html$/,
      use: {
        loader: 'raw-loader'
      }
    }, {
      test: /\.vue/,
      use: ['vue-loader']
    }]
  },
  plugins: [
    new VueLoaderPlugin()
  ]
}

if (process.env.NODE_ENV === 'production') {
  module.exports.mode = 'production'
}