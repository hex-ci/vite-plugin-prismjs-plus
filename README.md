# vite-plugin-prismjs-plus

[![npm version](https://badgen.net/npm/v/vite-plugin-prismjs-plus)](https://www.npmjs.com/package/vite-plugin-prismjs-plus)

A Vite plugin to use PrismJS with standard bundlers.

## How to Use

This plugin allows you to treat PrismJS as a virtual module and configure what languages, plugins, & themes you want to bundle with Prism.

In your code, import `virtual:prismjs`:

```js
import Prism from 'virtual:prismjs';

Prism.highlightAll();
```

The exported `Prism` object will be the fully-configured Prism instance.

### Type

```ts
// vite-env.d.ts
/// <reference types="vite-plugin-prismjs-plus/client" />
```

### Limitations

- You must be using ES6 imports to load PrismJS.

## Configuring the plugin

### Install

```bash
npm install --save-dev vite-plugin-prismjs-plus
```

### Config

```js
// vite.config.js
import prismjsPlugin from 'vite-plugin-prismjs-plus'

export default {
  plugins: [
    prismjsPlugin({
      manual: true,
      languages: [
        'markup',
        'javascript',
        'css',
        'php',
        'ruby',
        'python',
        'java',
        'c',
        'csharp',
        'cpp',
      ],
      plugins: [
        'line-numbers',
        'copy-to-clipboard',
      ],
      theme: 'twilight',
      css: true,
    }),
  ],
}
```

Each key are used as follows:

* `manual`: Boolean indicating whether to use Prism functions manually. Defaults to `false`.
* `languages`: Array of languages to include in the bundle or `"all"` to include all languages. Those languages can be found [here](http://prismjs.com/#languages-list).
* `plugins`: Array of plugins to include in the bundle. Those plugins can be found [here](http://prismjs.com/#plugins).
* `theme`: Name of theme to include in the bundle. Themes can be found [here](http://prismjs.com/).
* `css`: Boolean indicating whether to include `.css` files in the result. Defaults to `false`. If `true`, `import`s will be added for `.css` files. Must be `true` in order for `theme` to work.
