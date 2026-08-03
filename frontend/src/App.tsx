import React, { useState } from 'react';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { Moon, Sun } from 'lucide-react';
import WalletCard from './WalletCard';
import VotingPanel from './VotingPanel';
import { listWallets } from './selectWallet';
import { BrowserWalletProvider } from './lib/browserWalletProvider';
import { buildBrowserProviders } from './lib/providers';
import { useTheme } from './theme';
import { useToast } from './Toast';

// 'undeployed' for a local devnet, 'preview' or 'preprod' for the public
// test networks — must match what your wallet extension is connected to.
const NETWORK_ID = (import.meta.env.VITE_MIDNIGHT_NETWORK as string | undefined) ?? 'preview';

const App: React.FC = () => {
  const [theme, toggleTheme] = useTheme();
  const { push } = useToast();
  const [wallets, setWallets] = useState<InitialAPI[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [networkId, setNetworkIdState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<MidnightProviders | null>(null);

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const available = listWallets();
      setWallets(available);
      if (available.length === 0) {
        throw new Error(
          'Aucun wallet Midnight détecté. Installe une extension compatible (ex. Lace — édition Midnight) et recharge la page.',
        );
      }
      // With a single wallet installed, connect directly. With several,
      // the spec expects the DApp to let the user choose — extend this
      // with a picker over `wallets` if you support multiple extensions.
      const initial = available[0];

      const connected: ConnectedAPI = await initial.connect(NETWORK_ID);
      const { unshieldedAddress } = await connected.getUnshieldedAddress();
      const status = await connected.getConnectionStatus();
      if (status.status !== 'connected') {
        throw new Error('La connexion au wallet a échoué.');
      }

      const config = await connected.getConfiguration();
      setNetworkId(config.networkId as string);

      const wallet = await BrowserWalletProvider.connectFrom(connected);
      const builtProviders = buildBrowserProviders(wallet, {
        indexer: config.indexerUri,
        indexerWS: config.indexerWsUri,
      });

      setProviders(builtProviders);
      setWalletName(initial.name);
      setWalletAddress(unshieldedAddress);
      setNetworkIdState(String(config.networkId));
      setIsConnected(true);
      push('success', `Wallet ${initial.name} connecté`);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setIsConnected(false);
      push('error', message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress(null);
    setWalletName(null);
    setNetworkIdState(null);
    setProviders(null);
  };

  return (
    <div className="app">
      <div className="app-header">
        <div>
          <h1>PrivateVote</h1>
          <p className="subtitle">Vote communautaire privé sur Midnight</p>
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
          title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <WalletCard
        isConnected={isConnected}
        isConnecting={isConnecting}
        walletName={walletName}
        walletAddress={walletAddress}
        networkId={networkId}
        error={error}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      <VotingPanel providers={providers} />
    </div>
  );
};

export default App;
