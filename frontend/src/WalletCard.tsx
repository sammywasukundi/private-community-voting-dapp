import React from 'react';
import { Wallet, LogOut, Loader2, AlertCircle } from 'lucide-react';
import type { WalletCardProps } from './types';

const shorten = (addr: string) =>
  addr.length > 24 ? `${addr.slice(0, 14)}…${addr.slice(-8)}` : addr;

const WalletCard: React.FC<WalletCardProps> = ({
  isConnected,
  isConnecting,
  walletName,
  walletAddress,
  networkId,
  error,
  onConnect,
  onDisconnect,
}) => {
  return (
    <div className="card">
      <h2>
        <Wallet size={18} />
        Wallet
      </h2>
      <span className={`status-pill ${isConnected ? 'connected' : 'disconnected'}`}>
        <span className="dot" />
        {isConnected ? 'Connecté' : 'Déconnecté'}
      </span>

      {isConnected && walletAddress ? (
        <div className="wallet-info">
          <div className="wallet-avatar">
            <Wallet size={16} />
          </div>
          <div className="wallet-meta">
            <div className="wallet-name">
              {walletName} {networkId ? `· ${networkId}` : ''}
            </div>
            <div className="address" title={walletAddress}>
              {shorten(walletAddress)}
            </div>
          </div>
        </div>
      ) : (
        <p className="empty-hint">
          Connecte ton wallet Midnight (ex. Lace — édition Midnight) pour voter.
        </p>
      )}

      <div className="row">
        {isConnected ? (
          <button className="secondary" onClick={onDisconnect}>
            <LogOut size={16} />
            Déconnecter
          </button>
        ) : (
          <button onClick={onConnect} disabled={isConnecting}>
            {isConnecting ? <Loader2 size={16} className="spin" /> : <Wallet size={16} />}
            {isConnecting ? 'Connexion…' : 'Connect Wallet'}
          </button>
        )}
      </div>

      {error && (
        <div className="row" style={{ marginTop: 'var(--space-3)' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-2)',
              color: 'var(--color-danger)',
              fontSize: 14,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            {error}
          </span>
        </div>
      )}
    </div>
  );
};

export default WalletCard;
