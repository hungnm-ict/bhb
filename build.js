import { build, context } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const REPO = 'hungnm-ict/bhb';
const RAW = `https://raw.githubusercontent.com/${REPO}/master/dist/bhb.user.js`;

/** Inlined so the icon shows up before the script is ever fetched from GitHub. */
const ICON = `data:image/png;base64,${readFileSync('./Assets/Icons/PixelProbe.png').toString('base64')}`;

/** Tampermonkey reads this block verbatim; @version drives auto-update. */
const banner = `// ==UserScript==
// @name         BHB
// @namespace    https://github.com/${REPO}
// @version      ${pkg.version}
// @description  ${pkg.description}
// @author       hungnm-ict
// @icon         ${ICON}
// @match        *://*.kongregate.com/*
// @match        *://*.bitheroesgame.com/*
// @run-at       document-start
// @grant        none
// @updateURL    ${RAW}
// @downloadURL  ${RAW}
// ==/UserScript==
`;

/**
 * Stamp the version into the READMEs.
 *
 * package.json is the only place a version is written by hand; anything else
 * that names one goes stale the first time someone forgets. The badge lives
 * between markers so the surrounding prose is never touched.
 */
function stampReadmeVersion() {
  for (const file of ['README.md', 'README.en.md']) {
    const text = readFileSync(file, 'utf8');
    const stamped = text.replace(
      /<!--version-->.*?<!--\/version-->/s,
      `<!--version-->v${pkg.version}<!--/version-->`
    );
    if (stamped !== text) {
      writeFileSync(file, stamped);
    }
  }
}

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
  define: { __BHB_VERSION__: JSON.stringify(pkg.version) },
  banner: { js: banner },
};

mkdirSync('dist', { recursive: true });

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('watching src/ — rebuilding dist/bhb.user.js on change');
} else {
  await build(options);
  stampReadmeVersion();
  const bytes = readFileSync(options.outfile).length;
  console.log(`built dist/bhb.user.js  v${pkg.version}  ${(bytes / 1024).toFixed(1)} KB`);
}
