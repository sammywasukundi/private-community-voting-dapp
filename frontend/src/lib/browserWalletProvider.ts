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
    const serialized = (tx as unknown as { serialize(): string }).serialize();
    const { tx: balanced } = await this.api.balanceUnsealedTransaction(serialized);
    // The wallet returns the balanced + signed + proven transaction as a
    // string; midnight-js-contracts expects a FinalizedTransaction object
    // back from balanceTx. Depending on your installed SDK version you may
    // need to deserialize it explicitly, e.g.:
    //   Transaction.deserialize(balanced, NetworkId.currentNetworkId())
    return balanced as unknown as FinalizedTransaction;
  }

  async submitTx(tx: FinalizedTransaction): Promise<string> {
    const serialized = (tx as unknown as { serialize(): string }).serialize();
    await this.api.submitTransaction(serialized);
    return serialized;
  }
}
