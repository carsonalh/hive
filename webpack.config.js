const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (_, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.ts',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        'configuration': path.resolve(__dirname, isProduction
            ? './src/configuration-production.ts'
            : './src/configuration-development.ts'),
      }
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: './src/template.html',
      }),
    ],
    devServer: {
      static: [
        path.join(__dirname, 'dist'),
        path.join(__dirname, 'res'),
      ],
      compress: true,
      port: 9000,
      hot: true,
      open: true
    }
  };
};
