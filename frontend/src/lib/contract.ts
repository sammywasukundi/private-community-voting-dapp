import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
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

// A single FetchZkConfigProvider instance, reused both here (attached to the
// compiled contract) and in lib/providers.ts (as providers.zkConfigProvider).
//
// The second constructor argument (a bound `fetch`) is required: internally,
// FetchZkConfigProvider calls `this.fetchFunc(url, options)` — a *method*
// call, which rebinds `this` to the provider instance instead of `window`.
// The browser's native fetch requires `this === window` and throws
// "Failed to execute 'fetch' on 'Window': Illegal invocation" otherwise.
// Confirmed by temporarily adding debug logging inside
// node_modules/@midnight-ntwrk/midnight-js-types — this was the actual root
// cause of every ZKConfigurationReadError seen up to this point; the
// underlying fetch was never even attempted.
export const zkConfigProvider = new FetchZkConfigProvider(ZK_ASSETS_PATH, window.fetch.bind(window));

export const CompiledVotingContract = CompiledContract.make<
  Contract<Witnesses.VotingPrivateState>
>('VotingContract', Contract<Witnesses.VotingPrivateState>).pipe(
  CompiledContract.withWitnesses(Witnesses.witnesses),
  CompiledContract.withCompiledFileAssets(zkConfigProvider),
);
