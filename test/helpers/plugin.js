import prismjsPlugin from '../../index.js';

// Creates a plugin instance with given options
export function createPlugin(options) {
  return prismjsPlugin(options);
}

// Creates a plugin instance and calls configResolved with the given root
export function createAndInitPlugin(options, root = '/project/root') {
  const plugin = prismjsPlugin(options);

  plugin.configResolved({ root });

  return plugin;
}
