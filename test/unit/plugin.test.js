import { describe, it, expect, vi, beforeEach } from 'vitest';
import mockComponents from '../fixtures/components.js';

// Mock node:fs so readFileSync doesn't hit the real filesystem
vi.mock('node:fs', () => ({
  readFileSync: vi.fn((filePath) => `/* content of ${filePath} */`),
}));

// Mock prismjs/components.js with our fixture
vi.mock('prismjs/components.js', () => ({ default: mockComponents }));

// Mock prismjs/dependencies.js — we control getIds() per test
const mockGetIds = vi.fn();

vi.mock('prismjs/dependencies.js', () => ({
  default: vi.fn(() => ({ getIds: mockGetIds })),
}));

// Import after mocks are set up
const { default: prismjsPlugin } = await import('../../index.js');
const { readFileSync } = await import('node:fs');
const { default: getLoader } = await import('prismjs/dependencies.js');

beforeEach(() => {
  vi.clearAllMocks();
  mockGetIds.mockReturnValue([]);
});

// ─── Group 1: Plugin factory ───────────────────────────────────────────────

describe('plugin factory', () => {
  it('returns object with correct shape when called with no args', () => {
    const plugin = prismjsPlugin();
    expect(plugin).toBeTypeOf('object');
    expect(plugin.name).toBe('vite-plugin-prismjs-plus');
    expect(plugin.configResolved).toBeTypeOf('function');
    expect(plugin.resolveId).toBeTypeOf('function');
    expect(plugin.load).toBeTypeOf('function');
  });

  it('plugin.name is vite-plugin-prismjs-plus', () => {
    expect(prismjsPlugin().name).toBe('vite-plugin-prismjs-plus');
  });
});

// ─── Group 2: configResolved hook ─────────────────────────────────────────

describe('configResolved hook', () => {
  it('sets root from config.root', () => {
    const plugin = prismjsPlugin();
    plugin.configResolved({ root: '/project/root' });
    plugin.load('\0virtual:prismjs');
    expect(readFileSync).not.toThrow;
    // Verify root is used in path joining — readFileSync should not be called
    // (no deps), but if it were, it would use /project/root
  });

  it('defaults root to empty string when config has no root', () => {
    const plugin = prismjsPlugin();
    plugin.configResolved({});
    // Should not throw
    expect(() => plugin.load('\0virtual:prismjs')).not.toThrow();
  });
});

// ─── Group 3: resolveId hook ───────────────────────────────────────────────

describe('resolveId hook', () => {
  it('returns resolved id for virtual:prismjs', () => {
    const plugin = prismjsPlugin();
    expect(plugin.resolveId('virtual:prismjs')).toBe('\0virtual:prismjs');
  });

  it('returns undefined for other ids', () => {
    const plugin = prismjsPlugin();
    expect(plugin.resolveId('other-id')).toBeUndefined();
    expect(plugin.resolveId('prismjs')).toBeUndefined();
    expect(plugin.resolveId('')).toBeUndefined();
  });
});

// ─── Group 4: load hook — id guard ────────────────────────────────────────

describe('load hook — id guard', () => {
  it('returns undefined for non-virtual ids', () => {
    const plugin = prismjsPlugin();
    plugin.configResolved({ root: '' });
    expect(plugin.load('other-id')).toBeUndefined();
    expect(plugin.load('virtual:prismjs')).toBeUndefined();
  });

  it('returns a string for the resolved virtual id', () => {
    const plugin = prismjsPlugin();
    plugin.configResolved({ root: '' });
    expect(plugin.load('\0virtual:prismjs')).toBeTypeOf('string');
  });
});

// ─── Group 5: load hook — languages ───────────────────────────────────────

describe('load hook — languages', () => {
  it('calls getLoader with empty array when languages: []', () => {
    const plugin = prismjsPlugin({ languages: [] });
    plugin.configResolved({ root: '' });
    plugin.load('\0virtual:prismjs');
    expect(getLoader).toHaveBeenCalledWith(mockComponents, []);
  });

  it('calls getLoader with language ids when languages: ["javascript"]', () => {
    mockGetIds.mockReturnValue(['clike', 'javascript']);
    const plugin = prismjsPlugin({ languages: ['javascript'] });
    plugin.configResolved({ root: '/root' });
    plugin.load('\0virtual:prismjs');
    expect(getLoader).toHaveBeenCalledWith(mockComponents, ['javascript']);
  });

  it('output contains readFileSync content for language deps', () => {
    mockGetIds.mockReturnValue(['javascript']);
    const plugin = prismjsPlugin({ languages: ['javascript'] });
    plugin.configResolved({ root: '/root' });
    const output = plugin.load('\0virtual:prismjs');
    expect(output).toContain('/* content of');
    expect(readFileSync).toHaveBeenCalled();
  });

  it('calls getLoader with all language keys (excluding meta) when languages: "all"', () => {
    const plugin = prismjsPlugin({ languages: 'all' });
    plugin.configResolved({ root: '' });
    plugin.load('\0virtual:prismjs');
    const allLangs = Object.keys(mockComponents.languages).filter(k => k !== 'meta');
    // plugins arg is [] by default
    expect(getLoader).toHaveBeenCalledWith(mockComponents, expect.arrayContaining(allLangs));
    const callArgs = getLoader.mock.calls[0][1];
    expect(callArgs).not.toContain('meta');
  });
});

// ─── Group 6: load hook — css=false (default) ─────────────────────────────

describe('load hook — css=false (default)', () => {
  it('no CSS import lines in output', () => {
    mockGetIds.mockReturnValue(['line-numbers']);
    const plugin = prismjsPlugin({ plugins: ['line-numbers'] });
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    expect(output).not.toContain(".css'");
  });

  it('no theme import in output', () => {
    const plugin = prismjsPlugin({ theme: 'default' });
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    expect(output).not.toContain('themes/');
  });
});

// ─── Group 7: load hook — css=true with themes ────────────────────────────

describe('load hook — css=true with themes', () => {
  it('theme: "default" → imports prismjs/themes/prism.css', () => {
    const plugin = prismjsPlugin({ css: true, theme: 'default' });
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    expect(output).toContain("import 'prismjs/themes/prism.css'");
  });

  it('theme: "tomorrow" → imports prismjs/themes/prism-tomorrow.css', () => {
    const plugin = prismjsPlugin({ css: true, theme: 'tomorrow' });
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    expect(output).toContain("import 'prismjs/themes/prism-tomorrow.css'");
  });

  it('theme: "my-pkg/ocean" (slash syntax) → imports my-pkg/themes/prism-ocean.css', () => {
    const plugin = prismjsPlugin({ css: true, theme: 'my-pkg/ocean' });
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    expect(output).toContain("import 'my-pkg/themes/prism-ocean.css'");
  });

  it('theme: "" (falsy) → no theme import', () => {
    const plugin = prismjsPlugin({ css: true, theme: '' });
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    expect(output).not.toContain('themes/');
  });
});

// ─── Group 8: load hook — plugin CSS ──────────────────────────────────────

describe('load hook — plugin CSS', () => {
  it('plugin with CSS (line-numbers) + css:true → CSS import in output', () => {
    mockGetIds.mockReturnValue(['line-numbers']);
    const plugin = prismjsPlugin({ plugins: ['line-numbers'], css: true, theme: '' });
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    expect(output).toContain("import 'prismjs/plugins/line-numbers/prism-line-numbers.css'");
  });

  it('plugin with noCSS:true (normalize-whitespace) + css:true → no CSS import', () => {
    mockGetIds.mockReturnValue(['normalize-whitespace']);
    const plugin = prismjsPlugin({ plugins: ['normalize-whitespace'], css: true, theme: '' });
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    expect(output).not.toContain('normalize-whitespace.css');
  });

  it('language dep + css:true → no CSS import (only JS)', () => {
    mockGetIds.mockReturnValue(['javascript']);
    const plugin = prismjsPlugin({ languages: ['javascript'], css: true, theme: '' });
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    // languages don't produce CSS imports
    expect(output).not.toContain('prism-javascript.css');
  });
});

// ─── Group 9: load hook — manual mode ─────────────────────────────────────

describe('load hook — manual mode', () => {
  it('manual:true → output contains window.Prism.manual = true', () => {
    const plugin = prismjsPlugin({ manual: true });
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    expect(output).toContain('window.Prism.manual = true');
  });

  it('manual:false → output does NOT contain window.Prism.manual', () => {
    const plugin = prismjsPlugin({ manual: false });
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    expect(output).not.toContain('window.Prism.manual');
  });
});

// ─── Group 10: load hook — output structure ───────────────────────────────

describe('load hook — output structure', () => {
  it('always contains import Prism from prismjs/components/prism-core', () => {
    const plugin = prismjsPlugin();
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    expect(output).toContain("import Prism from 'prismjs/components/prism-core'");
  });

  it('always ends with export default Prism', () => {
    const plugin = prismjsPlugin();
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    expect(output.trimEnd()).toMatch(/export default Prism;?\s*$/);
  });

  it('readFileSync called with correct joined path for language deps', () => {
    mockGetIds.mockReturnValue(['javascript']);
    const plugin = prismjsPlugin({ languages: ['javascript'] });
    plugin.configResolved({ root: '/my/root' });
    plugin.load('\0virtual:prismjs');
    expect(readFileSync).toHaveBeenCalledWith(
      '/my/root/node_modules/prismjs/components/prism-javascript.js',
      'utf-8'
    );
  });
});

// ─── Group 11: load hook — languages + plugins combined ───────────────────

describe('load hook — languages + plugins combined', () => {
  it('getLoader receives both languages and plugins merged into one array', () => {
    const plugin = prismjsPlugin({ languages: ['javascript'], plugins: ['line-numbers'] });
    plugin.configResolved({ root: '' });
    plugin.load('\0virtual:prismjs');
    expect(getLoader).toHaveBeenCalledWith(
      mockComponents,
      expect.arrayContaining(['javascript', 'line-numbers'])
    );
    expect(getLoader.mock.calls[0][1]).toHaveLength(2);
  });

  it('output contains both language JS and plugin CSS when css:true', () => {
    mockGetIds.mockReturnValue(['javascript', 'line-numbers']);
    const plugin = prismjsPlugin({ languages: ['javascript'], plugins: ['line-numbers'], css: true, theme: '' });
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    expect(output).toContain('/* content of');
    expect(output).toContain("import 'prismjs/plugins/line-numbers/prism-line-numbers.css'");
  });

  it('languages: "all" + plugins still passes all languages and plugins to getLoader', () => {
    const plugin = prismjsPlugin({ languages: 'all', plugins: ['line-numbers'] });
    plugin.configResolved({ root: '' });
    plugin.load('\0virtual:prismjs');
    const callArgs = getLoader.mock.calls[0][1];
    const allLangs = Object.keys(mockComponents.languages).filter(k => k !== 'meta');
    expect(callArgs).toEqual(expect.arrayContaining([...allLangs, 'line-numbers']));
    expect(callArgs).not.toContain('meta');
  });

  it('empty languages + plugins still loads plugins', () => {
    mockGetIds.mockReturnValue(['line-numbers']);
    const plugin = prismjsPlugin({ languages: [], plugins: ['line-numbers'], css: true, theme: '' });
    plugin.configResolved({ root: '' });
    const output = plugin.load('\0virtual:prismjs');
    expect(getLoader).toHaveBeenCalledWith(mockComponents, ['line-numbers']);
    expect(output).toContain("import 'prismjs/plugins/line-numbers/prism-line-numbers.css'");
  });
});
