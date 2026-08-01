import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
// Reaches into the project's contracts/ directory (outside frontend/) —
// see vite.config.ts server.fs.allow. This re-uses the exact same compiled
// contract and witnesses the passing Node tests use; only the *providers*
// differ for the browser (see providers.ts).
import { Contract } from '../../../contracts/managed/voting/contract/index.js';
import * as Witnesses from '../../../contracts/witnesses.js';

export {
  PollStatus,
  ledger,
  pureCircuits,
  type Ledger,
} from '../../../contracts/managed/voting/contract/index.js';
export { createVotingPrivateState, type VotingPrivateState } from '../../../contracts/witnesses.js';

// Served over HTTP by Vite from frontend/public/zk/voting — populated by
// `node scripts/copy-zk-assets.mjs` (runs automatically before dev/build).
// Must be an absolute URL: FetchZkConfigProvider calls `new URL(...)`
// internally, which throws "Invalid URL" on a bare relative path like
// '/zk/voting' with no base to resolve it against.
export const ZK_ASSETS_PATH = new URL('/zk/voting', window.location.origin).toString();

export const CompiledVotingContract = CompiledContract.make<
  Contract<Witnesses.VotingPrivateState>
>('VotingContract', Contract<Witnesses.VotingPrivateState>).pipe(
  CompiledContract.withWitnesses(Witnesses.witnesses),
  // NOTE: on the Node side (contracts/index.ts) this same combinator is
  // given a filesystem path, backed by NodeZkConfigProvider. Here we give it
  // a URL instead. If your installed @midnight-ntwrk/midnight-js-protocol
  // version doesn't resolve a URL through withCompiledFileAssets, swap this
  // line for building the zkConfigProvider explicitly with
  // FetchZkConfigProvider(ZK_ASSETS_PATH) and passing it via whichever
  // combinator your version exposes (check the package's type declarations
  // locally — `node_modules/@midnight-ntwrk/midnight-js-protocol`).
  CompiledContract.withCompiledFileAssets(ZK_ASSETS_PATH),
);
