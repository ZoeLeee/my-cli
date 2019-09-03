const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin=require('clean-webpack-plugin');

module.exports = {
  mode: "development",
  entry: path.join(__dirname,"../src/index.js"),
  module: {
    rules: [
      {
        test: /.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        }
      },
      {
        test: /.css$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              // modules: false, //是否开启模块化
              importLoaders: 1,
              // localIdentName: '[name]_[local]_[hash:base64]', 
              sourceMap: true,
              minimize: true
            }
          }
        ]
      }
    ]
  },
  resolve:{
    extensions: ['.js','.jsx','.css' ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "../src/index.html"),
      filename: "./index.html"
    }),
    new CleanWebpackPlugin(["dist"]),
  ],
  output: {
    filename: "[hash].bundle.js",
    path: path.resolve(__dirname,"../dist")
  },
  devServer: {
    port: 3333,
    open: true,
  }
}