module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for react-native-reanimated v3 and react-native-get-random-values (uuid)
      'react-native-reanimated/plugin',
    ],
  };
};
