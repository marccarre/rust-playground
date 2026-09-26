const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

module.exports = {
  entry: "./www/index.js",
  output: {
    path: path.resolve(__dirname, "..", "dist", "game-of-life"),
    filename: "index.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./www/index.html",
    }),
    new WasmPackPlugin({
      crateDirectory: __dirname,
    }),
  ],
  mode: "development",
  experiments: {
    asyncWebAssembly: true,
  },
};
