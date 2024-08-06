import { Plugin } from 'vite';

interface Options {
  manual?: boolean;
  languages?: 'all' | string[];
  plugins?: string[];
  theme?: string;
  css?: boolean;
}

declare function prismjsPlugin(rawOptions?: Options): Plugin;

export { type Options, prismjsPlugin as default };
