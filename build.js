import { build, context } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const REPO = 'hungnm-ict/bhb';
const RAW = `https://raw.githubusercontent.com/${REPO}/master/dist/bhb.user.js`;

/** Tampermonkey reads this block verbatim; @version drives auto-update. */
const banner = `// ==UserScript==
// @name         BHB — Bit Heroes Bot
// @namespace    https://github.com/${REPO}
// @version      ${pkg.version}
// @description  ${pkg.description}
// @author       hungnm-ict
// @match        *://*.kongregate.com/*
// @match        *://*.bitheroesgame.com/*
// @run-at       document-start
// @grant        none
// @updateURL    ${RAW}
// @downloadURL  ${RAW}
// ==/UserScript==
`;

const watch = process.argv.includes('--watch');

const options = {
  entryPoints: ['src/main.js'],
  outfile: 'dist/bhb.user.js',
  bundle: true,
  format: 'iife',
  target: 'es2020',
  charset: 'utf8',
  legalComments: 'none',
  // Never minify: Tampermonkey users must be able to audit what they install.
  minify: false,
  banner: { js: banner },
};

mkdirSync('dist', { recursive: true });

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('watching src/ — rebuilding dist/bhb.user.js on change');
} else {
  await build(options);
  const bytes = readFileSync(options.outfile).length;
  console.log(`built dist/bhb.user.js  v${pkg.version}  ${(bytes / 1024).toFixed(1)} KB`);
}
