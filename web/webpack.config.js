// Hand-written Webpack configuration for the PulseOps manager dashboard
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {
  const isProd = argv.mode === "production";

  return {
    entry: "./src/index.jsx",

    output: {
      path: path.resolve(__dirname, "dist"),
      // Content hashes change only when a file changes, so browsers can cache safely
      filename: isProd ? "js/[name].[contenthash:8].js" : "js/[name].js",
      chunkFilename: isProd ? "js/[name].[contenthash:8].chunk.js" : "js/[name].chunk.js",
      publicPath: "/",
      clean: true
    },

    resolve: { extensions: [".js", ".jsx"] },

    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                ["@babel/preset-env", { targets: "defaults" }],
                ["@babel/preset-react", { runtime: "automatic" }]
              ]
            }
          }
        },
        { test: /\.css$/, use: ["style-loader", "css-loader"] }
      ]
    },

    plugins: [
      new HtmlWebpackPlugin({ template: "./public/index.html", title: "PulseOps Manager Dashboard" })
    ],

    devtool: isProd ? "source-map" : "eval-cheap-module-source-map",

    devServer: {
      port: 8080,
      open: true,
      historyApiFallback: true,
      // Forward API calls to Express so the browser sees a single origin
      proxy: [{ context: ["/api"], target: "http://localhost:4000" }]
    }
  };
};