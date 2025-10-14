import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import packageJson from './package.json' with { type: 'json' };

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
        nodeResolve(),
        replace({
          __VERSION__: packageJson.version,
          __DEVELOPMENT__: 'PRODUCTION'
        }),
        commonjs({
          include: 'node_modules/**'
        }),
        typescript({
          tsconfig: './tsconfig.json'
        }),
        copy({
          verbose: true,
          flatten: false,
          targets: [{ src: ['src/templates/**/*.hbs'], dest: 'dist' }]
        })
      ]
    }
  ];
}

export default config;
