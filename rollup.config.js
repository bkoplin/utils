import esbuild from 'rollup-plugin-esbuild'
import dts from 'rollup-plugin-dts'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import alias from '@rollup/plugin-alias'

const entries = [
  'src/vendor.ts',
  'src/types.ts',
  'src/time.ts',
  'src/string.ts',
  'src/p.ts',
  'src/math.ts',
  'src/is.ts',
  'src/function.ts',
  'src/guards.ts',
  'src/array.ts',
  'src/base.ts',
  'src/equal.ts',
  'src/object.ts',
]

const plugins = [
  alias({
    entries: [
      { find: /^node:(.+)$/, replacement: '$1' },
    ],
  }),
  resolve({
    preferBuiltins: true,
  }),
  json(),
  commonjs(),
  esbuild({
    target: 'node14',
  }),
]

export default [
  ...entries.map(input => ({
    input,
    output: [
      {
        file: input.replace('src/', 'dist/').replace('.ts', '.js'),
        name: 'utils',
        format: 'umd',
      },
    ],
    external: [],
    plugins,
    clean: true,
  })),
  ...entries.map(input => ({
    input,
    output: [
      {
        file: input.replace('src/', 'dist/').replace('.ts', '.d.ts'),
        format: 'umd',
        name: 'utils',
      },
    ],
    external: [],
    clean: true,
    plugins: [
      dts({ respectExternal: true }),
    ],
  })),
]
