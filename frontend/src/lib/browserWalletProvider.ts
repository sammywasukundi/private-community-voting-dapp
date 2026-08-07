import type {
  MidnightProvider,
  UnboundTransaction,
  WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';
import type {
  CoinPublicKey,
  EncPublicKey,
  FinalizedTransaction,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { Transaction } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-utils';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

/**
 * Bridges a connected Midnight wallet (via @midnight-ntwrk/dapp-connector-api)
 * to the WalletProvider/MidnightProvider interfaces that
 * @midnight-ntwrk/midnight-js-contracts (deployContract / submitCallTx)
 * expects — the same interfaces src/wallet.ts implements for the Node/test
 * seed-based wallet.
 *
 * ⚠️ This is the one part of the frontend that could not be exercised
 * end-to-end against a real wallet extension while writing it (no browser +
 * wallet extension available in this environment). The DApp Connector API
 * works with *serialized* transaction strings (`tx: string`), while
 * WalletProvider.balanceTx works with typed UnboundTransaction /
 * FinalizedTransaction objects — the `.serialize()` calls below are the
 * bridge between the two, and are the most likely spot to need a small fix
 * once you run this against Lace (Midnight edition). If TypeScript or the
 * runtime complains here, check the exact shape of UnboundTransaction /
 * FinalizedTransaction in your installed
 * @midnight-ntwrk/midnight-js-protocol version.
 */
export class BrowserWalletProvider implements WalletProvider, MidnightProvider {
  private constructor(
    private readonly api: ConnectedAPI,
    private readonly coinPublicKey: CoinPublicKey,
    private readonly encryptionPublicKey: EncPublicKey,
  ) {}

  static async connectFrom(api: ConnectedAPI): Promise<BrowserWalletProvider> {
    const { shieldedCoinPublicKey, shieldedEncryptionPublicKey } =
      await api.getShieldedAddresses();
    return new BrowserWalletProvider(
      api,
      shieldedCoinPublicKey as unknown as CoinPublicKey,
      shieldedEncryptionPublicKey as unknown as EncPublicKey,
    );
  }

  getCoinPublicKey(): CoinPublicKey {
    return this.coinPublicKey;
  }

  getEncryptionPublicKey(): EncPublicKey {
    return this.encryptionPublicKey;
  }

  async balanceTx(tx: UnboundTransaction): Promise<FinalizedTransaction> {
    console.log('[DEBUG] balanceTx called. serializing tx and calling wallet');
    const serializedHex = toHex((tx as unknown as { serialize(): Uint8Array }).serialize());
    console.log('[DEBUG] balanceTx serializedHex (first 200 chars):', String(serializedHex).slice(0, 200));
    console.log('[DEBUG] calling api.balanceUnsealedTransaction...');
    const result = await this.api.balanceUnsealedTransaction(serializedHex, {});
    console.log('[DEBUG] balanceUnsealedTransaction returned:', result);
    const { tx: balancedHex } = result;
    const balanced = Transaction.deserialize('signature', 'proof', 'binding', fromHex(balancedHex));
    return balanced as unknown as FinalizedTransaction;
  }

  async submitTx(tx: FinalizedTransaction): Promise<string> {
    console.log('[DEBUG] submitTx called. serializing tx and calling wallet');
    const serializedHex = toHex((tx as unknown as { serialize(): Uint8Array }).serialize());
    console.log('[DEBUG] submitTx serializedHex (first 200 chars):', String(serializedHex).slice(0, 200));
    console.log('[DEBUG] calling api.submitTransaction...');
    // The connector may or may not return a tx hash; spec says void. We await
    // the call and return the serialized hex for downstream callers that
    // expect a string identifier. Prefer returning the transaction id if we
    // can extract it from the `tx` object (common pattern in examples).
    await this.api.submitTransaction(serializedHex);
    try {
      // many Transaction implementations expose `identifiers()` returning
      // an array with the hex tx hash as the first element.
      const ids = (tx as any)?.identifiers?.();
      if (Array.isArray(ids) && ids.length > 0 && typeof ids[0] === 'string') {
        try {
          // store for UI inspection during long deploys
          sessionStorage.setItem('midnight:lastSubmittedTxId', ids[0]);
        } catch (err) {
          /* ignore */
        }
        return ids[0];
      }
    } catch (err) {
      // fallthrough to returning serialized hex
    }
    try {
      sessionStorage.setItem('midnight:lastSubmittedTxId', serializedHex);
    } catch (err) {
      /* ignore */
    }
    return serializedHex;
  }
}
