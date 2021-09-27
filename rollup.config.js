/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import svg from 'rollup-plugin-svg';
import typescript from 'rollup-plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import sveltePreprocess from 'svelte-preprocess';


/* Inline to single html */
import htmlBundle from 'rollup-plugin-html-bundle';

// eslint-disable-next-line no-undef
const production = !process.env.ROLLUP_WATCH;

export default [{
  input: 'src/scene/main.ts',
  output: {
    format: 'iife',
    name: 'ui',
    file: 'build/bundle.js'
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),

      compilerOptions: {
        dev: !production,
      }
    }),
    postcss(),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration —
    // consult the documentation for details:¡
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/'),
      extensions: ['.svelte', '.mjs', '.js', '.json', '.node']
    }),
    commonjs(),
    svg(),
    htmlBundle({
      template: 'src/scene/template.html',
      target: 'public/ui.html',
      inline: true
    }),
    typescript({
      sourceMap: !production,
      inlineSources: !production
    }),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `dist` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    // production && terser()
  ],
  watch: {
    clearScreen: false
  }
},
{
  input: 'src/browser/code.ts',
  output: {
    file: 'public/code.js',
    format: 'cjs',
    name: 'code'
  },
  plugins: [
    typescript(),
    commonjs(),
    // production && terser()
  ]
}];

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
      });

      process.on('SIGTERM', toExit);
      process.on('exit', toExit);
    }
  };
}
