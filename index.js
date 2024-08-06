import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import components from 'prismjs/components.js';
import getLoader from 'prismjs/dependencies.js';

const getPath = (type, name) => `prismjs/${components[type].meta.path.replace(/\{id\}/g, name)}`;

const isPlugin = dep => components.plugins[dep] != null;

const getNoCSS = (type, name) => !!components[type][name].noCSS;

const getThemePath = theme => {
  if (theme.includes('/')) {
    const [themePackage, themeName] = theme.split('/');

    return `${themePackage}/themes/prism-${themeName}.css`;
  }

  if (theme === 'default') {
    theme = 'prism';
  }
  else {
    theme = `prism-${theme}`;
  }

  return getPath('themes', theme);
};

export default function prismjsPlugin({ manual = false, languages = [], plugins = [], theme = 'default', css = false } = {}) {
  const virtualModuleId = 'virtual:prismjs';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  let root = '';

  return {
    name: 'vite-plugin-prismjs-plus',

    configResolved(config) {
      root = config.root ?? '';
    },

    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        if (languages === 'all') {
          languages = Object.keys(components.languages).filter(item => item !== 'meta');
        }

        const dependencies = getLoader(components, [...languages, ...plugins]).getIds().reduce((deps, dep) => {
          deps.js.push((isPlugin(dep) ? getPath('plugins', dep) : getPath('languages', dep)) + '.js');

          if (css && isPlugin(dep) && !getNoCSS('plugins', dep)) {
            deps.css.push(getPath('plugins', dep) + '.css');
          }

          return deps;
        }, { js: [], css: [] });

        const themePackages = (css && theme ? [getThemePath(theme)] : []);
        const dependencyContent = dependencies.js.map(item => readFileSync(join(root, 'node_modules', item), 'utf-8'));

        const manualCode = manual ? `
if (typeof window !== 'undefined') {
  window.Prism = window.Prism || {};
  window.Prism.manual = true;
}` : '';

        return `
${manualCode}
${[...themePackages, ...dependencies.css].map(path => `import '${path}';`).join('\n')}
import Prism from 'prismjs/components/prism-core';

${dependencyContent.join('\n')}

export default Prism;
`;
      }
    },
  }
}
