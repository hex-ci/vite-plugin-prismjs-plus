// Minimal mock of prismjs/components.js covering all branches in index.js
const mockComponents = {
  languages: {
    meta: {
      path: 'components/prism-{id}',
      noCSS: true,
      examplesPath: 'examples/prism-{id}',
      addCheckAll: true,
    },
    javascript: {
      title: 'JavaScript',
      require: 'clike',
    },
    clike: {
      title: 'C-like',
    },
    markup: {
      title: 'Markup',
    },
  },
  plugins: {
    meta: {
      path: 'plugins/{id}/prism-{id}',
      link: 'plugins/{id}/',
    },
    'line-numbers': {
      title: 'Line Numbers',
      // no noCSS → has CSS
    },
    'normalize-whitespace': {
      title: 'Normalize Whitespace',
      noCSS: true,
    },
  },
  themes: {
    meta: {
      path: 'themes/{id}.css',
      link: 'index.html?theme={id}',
      exclusive: true,
    },
    prism: {
      title: 'Default',
      option: 'default',
    },
    'prism-tomorrow': {
      title: 'Tomorrow Night',
    },
  },
};

export default mockComponents;
