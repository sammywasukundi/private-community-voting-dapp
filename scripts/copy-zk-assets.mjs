// Copies the compiled contract artifacts (proving/verifying keys, zkir,
// generated JS/TS) from contracts/managed/voting into frontend/public/zk/voting
// so the Vite dev server / production build can serve them over plain HTTP.
// FetchZkConfigProvider (browser-side zk config provider) needs to fetch
// these files by URL — it cannot read them from disk like NodeZkConfigProvider
// does for the test/CLI flow.
//
// Runs automatically before `yarn dev` and `yarn build` (see package.json
// "predev"/"prebuild" scripts). Re-run manually with:
//   node scripts/copy-zk-assets.mjs
// any time you recompile the contract (`yarn compile`) and want the frontend
// to pick up the new circuits.

import { cpSync, existsSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const source = path.join(projectRoot, 'contracts', 'managed', 'voting');
const destination = path.join(projectRoot, 'frontend', 'public', 'zk', 'voting');

if (!existsSync(source)) {
  console.error(
    `Compiled contract not found at ${source}.\n` +
      `Run "yarn compile" first (compiles contracts/voting.compact).`,
  );
  process.exit(1);
}

rmSync(destination, { recursive: true, force: true });
mkdirSync(path.dirname(destination), { recursive: true });
cpSync(source, destination, { recursive: true });

// The Compact compiler emits a `//# sourceMappingURL=index.js.map` comment
// in the generated contract JS, but doesn't ship the original .ts sources
// that map points to. lib/contract.ts imports this file directly from
// contracts/managed/voting/contract/index.js (not the copy above), so Vite
// tries to resolve that map and logs a harmless
// "points to missing source files" warning. Stripping the comment there
// removes the warning at the source.
const generatedIndexJs = path.join(
  projectRoot,
  'contracts',
  'managed',
  'voting',
  'contract',
  'index.js',
);
if (existsSync(generatedIndexJs)) {
  const content = readFileSync(generatedIndexJs, 'utf8');
  const stripped = content.replace(/\n?\/\/# sourceMappingURL=.*\n?$/, '\n');
  if (stripped !== content) {
    writeFileSync(generatedIndexJs, stripped);
  }
}

console.log(`Copied compiled contract from ${source} to ${destination}`);
