module.exports = function (api) {
  api.cache(true);

  const presets = ['babel-preset-expo'];

  const plugins = [];

  // Supprimer les console.log en production
  if (process.env.NODE_ENV === 'production') {
    plugins.push('transform-remove-console');
  }

  return {
    presets,
    plugins,
  };
};
