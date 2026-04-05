import path from "node:path";
import { fileURLToPath } from "node:url";
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env) => {
    let entry = [
        'babel-polyfill',
        './src/client/index'
    ];

    let plugins = [];

    let devtool = 'eval-source-map';
    let output = 'static/js/index.js';
    
    let PLATFORM = env.platform || 'web';
    let NODE_ENV = env.build ? 'production' : 'development';

    let target = 'web';
    if (PLATFORM === 'electron') target = 'electron-renderer';

    plugins.push(new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'PLATFORM': JSON.stringify(PLATFORM)
    }));

    if (env.build) {
        let outputDir;

        if (PLATFORM === 'web') {
            outputDir = 'web/';
        }

        if (PLATFORM === 'electron') {
            outputDir = '../electron/www/';
        }

        plugins.push(new CopyWebpackPlugin({
            patterns: [{from: 'src/client/resources', to: outputDir}]
        }));

        devtool = false;
        output = outputDir + 'static/js/index.js';
    }
    else {
        entry.push('webpack-dev-server/client?http://localhost:4000');
        plugins.push(new CopyWebpackPlugin({
            patterns: [{from: 'src/client/resources', to: './'}]
        }));
    }

    let config = {
        entry: entry,
        output: {
            path: __dirname + "/dist",
            filename: output
        },
        devtool: devtool,
        target: target,
        mode: NODE_ENV,
        module: {
            noParse: /.*[\/\\]bin[\/\\].+\.js/,
            rules: [
                {
                    test: /.jsx?$/,
                    include: [path.resolve(__dirname, 'src')],
                    use: [{loader: 'babel-loader', options: {presets: ['@babel/preset-react', '@babel/preset-env']}}]
                },
                {
                    test: /\.js$/,
                    include: [path.resolve(__dirname, 'src')],
                    use: [{loader: 'babel-loader', options: {presets: ['@babel/preset-env']}}]
                },
                {
                    test: /\.(html|htm)$/,
                    use: [{loader: 'dom'}]
                }
            ]
        },
        optimization: {
            minimize: false
        },
        plugins: plugins
    };

    if (target === 'electron-renderer') {
        config.resolve = {alias: {'platform': path.resolve(__dirname, './src/client/platform/electron')}};
    } else {
        config.resolve = {alias: {'platform': path.resolve(__dirname, './src/client/platform/web')}};
    }

    config.resolve.fallback = {
        "stream": import.meta.resolve("stream-browserify"),
        "timers": import.meta.resolve("timers-browserify"),
        "buffer": import.meta.resolve("buffer/")
    }

    return config;
}
