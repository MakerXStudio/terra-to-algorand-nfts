/**
 * @type {import('@remix-run/dev/config').AppConfig}
 */
module.exports = {
  appDirectory: 'app',
  assetsBuildDirectory: 'public/_static/build/',
  publicPath: '/_static/build',
  serverBuildDirectory: 'build/server/build',
  devServerPort: 8002,
  ignoredRouteFiles: ['.*'],
  sourcemap: true,
  // routes(defineRoutes) {
  //   return defineRoutes((route) => {
  //     // When REMIX fix this: https://github.com/remix-run/remix/issues/1898
  //     // we will be able to have multiple custom routes going to the same route
  //   })
  // },
}
