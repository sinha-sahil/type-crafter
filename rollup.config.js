import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import { dts } from 'rollup-plugin-dts';
import packageJson from './package.json' with { type: 'json' };

function basePlugins() {
  return [
    nodeResolve(),
    replace({
      preventAssignment: true,
      __VERSION__: packageJson.version,
      __DEVELOPMENT__: 'PRODUCTION'
    }),
    commonjs({
      include: 'node_modules/**'
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false
    })
  ];
}

function config() {
  return [
    {
      input: 'src/index.ts',
      output: {
        file: 'dist/index.js',
        format: 'esm',
        sourcemap: false
      },
      plugins: [
        ...basePlugins(),
        copy({
          verbose: true,
          flatten: false,
          targets: [{ src: ['src/templates/**/*.hbs'], dest: 'dist' }]
        })
      ]
    },
    {
      input: 'src/sdk/index.ts',
      output: {
        file: 'dist/sdk.js',
        format: 'esm',
        sourcemap: false
      },
      plugins: basePlugins()
    },
    {
      input: 'src/index.ts',
      output: { file: 'dist/index.d.ts', format: 'es' },
      plugins: [dts({ tsconfig: './tsconfig.json' })]
    },
    {
      input: 'src/sdk/index.ts',
      output: { file: 'dist/sdk.d.ts', format: 'es' },
      plugins: [dts({ tsconfig: './tsconfig.json' })]
    }
  ];
}

export default config;
