"use strict";

const path = require("path");
const fs = require("fs");

/** @typedef {import('webpack').Configuration} WebpackConfig **/

console.log("path:", path.resolve(__dirname, "src/webviews/scripts"));

const scripts = fs
  .readdirSync(path.resolve(__dirname, "src/webviews/scripts"))
  .filter((file) => file.endsWith(".ts") && !file.endsWith(".d.ts"))
  .map((file) => path.resolve(__dirname, "src/webviews/scripts", file));

console.log("scripts:", scripts);

const entryPoints = {};
scripts.forEach((script) => {
  const name = path.basename(script, ".ts");
  entryPoints[name] = script;
});
console.log("entryPoints:", entryPoints);

/** @type WebpackConfig */
const extensionConfig = {
  target: "web", // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  mode: process.env.NODE_ENV || "production", // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: entryPoints, // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "dist/scripts"),
    filename: "[name].js",
    clean: true,
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules|\.d\.ts$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: path.resolve(
                __dirname,
                "src/webviews/scripts",
                "tsconfig.webviews.json"
              ),
            },
          },
        ],
      },
      {
        test: /\.d\.ts$/,
        loader: "ignore-loader",
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
      },
    ],
  },
  devtool: "nosources-source-map",
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};
module.exports = [extensionConfig];
