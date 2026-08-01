import type { InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

declare global {
  interface Window {
    // Wallets inject their Initial API under a freshly-generated UUID key,
    // never a fixed name — so we must enumerate rather than reach for e.g.
    // `window.midnight.mnLace` directly.
    midnight?: Record<string, InitialAPI>;
  }
}

export const listWallets = (): InitialAPI[] => {
  const injected = window.midnight;
  return injected ? Object.values(injected) : [];
};

export const selectWallet = (): InitialAPI => {
  const wallets = listWallets();
  if (wallets.length === 0) {
    throw new Error(
      'Aucun wallet Midnight détecté. Installe une extension compatible (ex. Lace — édition Midnight) et recharge la page.',
    );
  }
  // If several wallets are installed, prefer letting the user choose via
  // the UI (see App.tsx) rather than picking silently here.
  return wallets[0];
};
