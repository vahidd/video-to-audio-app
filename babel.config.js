const withBabelConfig = require('../codewiz-ui-lib/withBabelConfig');

module.exports = withBabelConfig({
  plugins: [
    ['module:react-native-dotenv'],
    [
      'module-resolver',
      {
        alias: {
          '@src': './src',
          '@components': './src/components',
          '@utils': './src/utils',
          '@screens': './src/screens',
          '@assets': './src/assets',
        },
      },
    ],
  ],
});
