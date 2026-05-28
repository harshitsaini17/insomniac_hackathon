const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to skip .mjs files so zustand resolves to CJS (no import.meta)
config.resolver.sourceExts = config.resolver.sourceExts.filter(
    (ext) => ext !== 'mjs'
);

// Ensure Metro does not pick up the "import" condition from package.json exports
// which points to ESM files containing import.meta.env
config.resolver.unstable_conditionNames = ['require', 'default'];

module.exports = config;
