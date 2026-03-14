import { describe, it, expect, vi, beforeEach } from 'vitest';
import mockComponents from '../fixtures/components.js';

// Mock node:fs
vi.mock('node:fs', () => ({
  readFileSync: vi.fn((filePath) => `/* content of ${filePath} */`),
}));

// Mock prismjs/components.js
vi.mock('prismjs/components.js', () => ({ default: mockComponents }));

// Mock prismjs/dependencies.js
const mockGetIds = vi.fn();

vi.mock('prismjs/dependencies.js', () => ({
  default: vi.fn(() => ({ getIds: mockGetIds })),
}));

const { default: prismjsPlugin } = await import('../../index.js');

beforeEach(() => {
  vi.clearAllMocks();
  mockGetIds.mockReturnValue([]);
});

// Import each aliased Vite version
const viteVersions = [
  { name: 'vite5', pkg: await import('vite5'), expectedMajor: 5 },
  { name: 'vite6', pkg: await import('vite6'), expectedMajor: 6 },
  { name: 'vite7', pkg: await import('vite7'), expectedMajor: 7 },
  { name: 'vite8', pkg: await import('vite8'), expectedMajor: 8 },
];

describe.each(viteVersions)('Vite compatibility — $name', ({ name, pkg, expectedMajor }) => {
  it('package resolves and has expected version major', () => {
    expect(pkg).toBeDefined();
    // vite exports VERSION constant
    const version = pkg.VERSION ?? pkg.version;
    expect(version).toBeDefined();
    expect(Number(version.split('.')[0])).toBe(expectedMajor);
  });

  it('configResolved works with Vite-shaped config', () => {
    const plugin = prismjsPlugin();
    // Simulate the ResolvedConfig shape each Vite version provides
    const config = { root: `/project/with-${name}` };
    expect(() => plugin.configResolved(config)).not.toThrow();
  });

  it('resolveId works correctly', () => {
    const plugin = prismjsPlugin();
    plugin.configResolved({ root: '' });
    expect(plugin.resolveId('virtual:prismjs')).toBe('\0virtual:prismjs');
    expect(plugin.resolveId('something-else')).toBeUndefined();
  });

  it('load works correctly and returns module string', () => {
    const plugin = prismjsPlugin({ css: true, theme: 'default' });
    plugin.configResolved({ root: `/project/with-${name}` });
    const output = plugin.load('\0virtual:prismjs');
    expect(output).toBeTypeOf('string');
    expect(output).toContain("import Prism from 'prismjs/components/prism-core'");
    expect(output).toContain("import 'prismjs/themes/prism.css'");
    expect(output).toContain('export default Prism');
  });
});
