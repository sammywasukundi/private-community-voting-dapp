import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { BrowserWalletProvider } from './browserWalletProvider';
import { zkConfigProvider } from './contract';

export type NetworkEndpoints = {
  indexer: string;
  indexerWS: string;
};

// Reuses the same local proof server your Node tests already exercise via
// `yarn proof:up` (see README / compose.yml). The wallet *can* delegate
// proving itself (ConnectedAPI.getProvingProvider), but that path uses a
// different, lower-level ProvingProvider interface than the one
// midnight-js-contracts expects here — sticking to the already-verified
// local proof server avoids stacking two unverified integrations at once.
export const LOCAL_PROOF_SERVER = 'http://127.0.0.1:6300';

export function buildBrowserProviders(
  wallet: BrowserWalletProvider,
  endpoints: NetworkEndpoints,
): MidnightProviders {
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'private-vote',
      privateStoragePasswordProvider: () => 'PrivateVote-Browser-2026!',
      accountId: wallet.getCoinPublicKey(),
    }),
    publicDataProvider: indexerPublicDataProvider(endpoints.indexer, endpoints.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(LOCAL_PROOF_SERVER, zkConfigProvider),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
}

/** Read-only providers, usable before any wallet is connected (for the
 * "join an existing poll and see its live results" flow). */
export function buildReadOnlyPublicDataProvider(endpoints: NetworkEndpoints) {
  return indexerPublicDataProvider(endpoints.indexer, endpoints.indexerWS);
}
