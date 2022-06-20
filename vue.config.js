const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  pwa: {
    name: 'ClosestHillMap',
    themeColor: '#20bf6b',
    msTileColor: '#ffffff',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    start_url: '/index.html',
    workboxOptions: {
      skipWaiting: true
    }
  },
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
