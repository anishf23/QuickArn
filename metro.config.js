const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // `@react-native-firebase/functions` publishes ESM files with explicit
    // `.js` relative imports. Strip that suffix for Metro's React Native
    // resolver, which otherwise incorrectly probes `HttpsError.js.js`.
    resolveRequest: (context, moduleName, platform) => {
      if (
        context.originModulePath.includes('@react-native-firebase/functions/dist/module')
        && moduleName.startsWith('.')
        && moduleName.endsWith('.js')
      ) {
        return context.resolveRequest(context, moduleName.slice(0, -3), platform);
      }

      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
