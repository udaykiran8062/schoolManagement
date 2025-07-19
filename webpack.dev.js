const path = require('path');
const nodeExternals = require("webpack-node-externals");
const webpack = require("webpack");
const Dotenv = require("dotenv").config({ path: "./.env.local" });

module.exports = {
    entry: {
        app: "./src/app.mjs"
    },
    externals: [nodeExternals()],
    output: {
        path: path.join(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].js',
        clean: true
    },
    mode: 'development',
    target: 'node',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }
        ]
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env": JSON.stringify(Dotenv.parsed),
      }),
    ],
    resolve: {
      extensions: [".js", ".json", ".cjs", ".mjs"],
    },
}