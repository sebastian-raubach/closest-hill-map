const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  configureWebpack: {
    // plugins: [
    //   new BundleAnalyzerPlugin()
    // ],
    resolve: {
      // ... rest of the resolve config
      fallback: {
        'path': require.resolve('path-browserify')
      }
    },
    devtool: 'eval-source-map',
    target: 'web'
  }
})
