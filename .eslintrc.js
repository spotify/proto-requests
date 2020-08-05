const baseConfig = require('@spotify-internal/web-scripts/config/eslintrc.js');

module.exports = {
  ...baseConfig,
  plugins: [...(baseConfig.plugins || []), 'jsx-a11y'],
  extends: [...(baseConfig.extends || []), 'plugin:jsx-a11y/recommended'],
  rules: {
    ...(baseConfig.rules || {}),
    // added when the repo was moved to using web-scripts.
    // strive to turn these back into errors!
    'jsx-a11y/alt-text': 'warn',
    'jsx-a11y/anchor-is-valid': 'warn',
    'react/sort-comp': 'warn',
    'new-cap': 'warn',
  },
};
