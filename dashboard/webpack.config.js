const WebpackShellPlugin = require('webpack-shell-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

module.exports = {
    entry: ['whatwg-fetch', './src/'],
    output: { path: __dirname + '/dist', filename: 'bundle.js' },
    module: {
        loaders: [
            {
                test: /\.js?$/,
                loader: 'babel',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'react']
                }
            },
            {
                test: /\.scss$/,
                loaders: ['style', 'css', 'sass']
            },
            {
                test: /\.svg$/,
                loader: 'svg-sprite'
            },            {
                test: /\.(woff2?|png|gif)$/,
                loader: 'file'
            }
        ],
        noParse: [
            /aws\-sdk/
        ]
    },
    plugins: [
        new WebpackShellPlugin({
            onBuildStart: ['npm install; npm prune']
        }),
        new CleanWebpackPlugin(['dist'])
    ]
}
