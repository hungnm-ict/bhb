import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function parse(version) {
  const match = SEMVER.exec(String(version ?? ''));
  if (!match) {
    return null;
  }
  return match.slice(1, 4).map(Number);
}

function compare(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}

/**
 * Work out the version a bump asks for.
 *
 * Refuses anything not strictly above the current version: Tampermonkey never
 * downgrades, so a version published too high leaves every user stranded there
 * until the real version climbs past it.
 */
export function nextVersion(current, bump) {
  const parts = parse(current);
  if (!parts) {
    throw new Error(`current version "${current}" is not major.minor.patch`);
  }
  const [major, minor, patch] = parts;

  if (bump === 'major') {
    return `${major + 1}.0.0`;
  }
  if (bump === 'minor') {
    return `${major}.${minor + 1}.0`;
  }
  if (bump === 'patch') {
    return `${major}.${minor}.${patch + 1}`;
  }

  const wanted = parse(bump);
  if (!wanted) {
    throw new Error(`"${bump ?? ''}" is not major, minor, patch or a major.minor.patch version`);
  }
  if (compare(wanted, parts) <= 0) {
    throw new Error(`${bump} is not above the current ${current} — Tampermonkey will not downgrade`);
  }
  return wanted.join('.');
}

function run() {
  const bump = process.argv[2];
  const pkgText = readFileSync('./package.json', 'utf8');
  const current = JSON.parse(pkgText).version;
  const version = nextVersion(current, bump);

  // Rewrite just the one field so the file's formatting survives untouched.
  const stamped = pkgText.replace(
    /("version"\s*:\s*)"[^"]*"/,
    `$1"${version}"`
  );
  if (stamped === pkgText) {
    throw new Error('could not find the version field in package.json');
  }
  writeFileSync('./package.json', stamped);

  console.log(`  ${current} → ${version}`);

  const built = spawnSync(process.execPath, ['build.js'], { stdio: 'inherit' });
  if (built.status !== 0) {
    throw new Error('build failed — package.json is bumped, dist/ is not');
  }

  console.log('\nreview the diff, then commit and push to publish.');
}

if (process.argv[1] && process.argv[1].endsWith('bump.js')) {
  try {
    run();
  } catch (error) {
    console.error(`bump: ${error.message}`);
    process.exit(1);
  }
}
