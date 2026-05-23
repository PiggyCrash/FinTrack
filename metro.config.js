const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for openai SDK circular dependency issue in Metro bundler.
// The openai package uses ES modules (.mjs) with circular references
// that Metro can't handle by default. This forces Metro to treat them
// as standard JS modules so the bundle compiles correctly.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
