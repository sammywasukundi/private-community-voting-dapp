import React, { useState } from 'react';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { Moon, Sun, Home, History, Languages } from 'lucide-react';
import WalletCard from './WalletCard';
import VotingPanel from './VotingPanel';
import HistoryPanel from './HistoryPanel';
import { listWallets } from './selectWallet';
import { BrowserWalletProvider } from './lib/browserWalletProvider';
import { buildBrowserProviders } from './lib/providers';
import { useTheme } from './theme';
import { useToast } from './Toast';
import { useI18n, type Lang } from './i18n';

// 'undeployed' for a local devnet, 'preview' or 'preprod' for the public
// test networks — must match what your wallet extension is connected to.
const NETWORK_ID = (import.meta.env.VITE_MIDNIGHT_NETWORK as string | undefined) ?? 'preview';

type Tab = 'home' | 'history';

const App: React.FC = () => {
  const [theme, toggleTheme] = useTheme();
  const { lang, setLang, t } = useI18n();
  const { push } = useToast();
  const [wallets, setWallets] = useState<InitialAPI[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [networkId, setNetworkIdState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<MidnightProviders | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [requestedAddress, setRequestedAddress] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const available = listWallets();
      setWallets(available);
      if (available.length === 0) {
        throw new Error(t('error.walletMissing'));
      }
      // With a single wallet installed, connect directly. With several,
      // the spec expects the DApp to let the user choose — extend this
      // with a picker over `wallets` if you support multiple extensions.
      const initial = available[0];

      const connected: ConnectedAPI = await initial.connect(NETWORK_ID);
      const { unshieldedAddress } = await connected.getUnshieldedAddress();
      const status = await connected.getConnectionStatus();
      if (status.status !== 'connected') {
        throw new Error(t('error.walletConnectFailed'));
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

  const openInPoll = (address: string) => {
    setRequestedAddress(address);
    setTab('home');
  };

  const toggleLang = () => setLang(lang === 'fr' ? ('en' as Lang) : ('fr' as Lang));

  return (
    <div className="app">
      <div className="app-header">
        <div>
          <h1>PrivateVote</h1>
          <p className="subtitle">{t('app.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={toggleLang}
            aria-label="Change language / Changer de langue"
            title="FR / EN"
          >
            <Languages size={16} />
            <span className="lang-label">{lang.toUpperCase()}</span>
          </button>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
            title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      <nav className="tab-nav" role="tablist" aria-label="Navigation">
        <button
          role="tab"
          aria-selected={tab === 'home'}
          className={`tab-button ${tab === 'home' ? 'active' : ''}`}
          onClick={() => setTab('home')}
        >
          <Home size={16} />
          {t('nav.home')}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'history'}
          className={`tab-button ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          <History size={16} />
          {t('nav.history')}
        </button>
      </nav>

      {tab === 'home' ? (
        <>
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

          <VotingPanel providers={providers} requestedAddress={requestedAddress} />
        </>
      ) : (
        <HistoryPanel providers={providers} onOpenInPoll={openInPoll} />
      )}
    </div>
  );
};

export default App;
