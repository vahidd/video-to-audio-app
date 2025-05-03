const {mergeConfig} = require('@react-native/metro-config');
const withMetroConfig = require('../codewiz-ui-lib/withMetroConfig');
const {getSentryExpoConfig} = require('@sentry/react-native/metro');

const config = mergeConfig(getSentryExpoConfig(__dirname), {});

module.exports = withMetroConfig(config);
