// webpack.config.js

const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

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
    plugins: [new CleanWebpackPlugin()],
};

//__EOF__
