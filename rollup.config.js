import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';

function getVersion(args) {
  const environment = args.environment;
  let version = null;
  if (typeof environment === 'string') {
    environment.split(' ').forEach((arg) => {
      const [key, value] = arg.split('=');
      if (key === 'version') {
        version = value;
      }
    });
  }
  if (version === null) {
    throw new Error('Build Version is not specified');
  }
  return version;
}

function config(args) {
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
          __VERSION__: getVersion(args),
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
