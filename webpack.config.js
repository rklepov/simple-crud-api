// webpack.config.js

const path = require("path");
const webpack = require("webpack");

// https://dev.to/sanfra1407/how-to-use-env-file-in-javascript-applications-with-webpack-18df
const dotenv = require("dotenv").config({
    path: path.join(__dirname, ".env"),
});

module.exports = {
    // https://webpack.js.org/configuration/mode/
    mode: "production",
    // https://webpack.js.org/concepts/targets/
    target: "node",
    entry: "./crud-server.js",
    output: {
        filename: "server.js",
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.env": dotenv.parsed,
        }),
    ],
};

//__EOF__
