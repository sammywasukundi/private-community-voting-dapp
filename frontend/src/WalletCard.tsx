import React from 'react';
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
      <h2>Wallet</h2>
      <span className={`status-pill ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? 'Connecté' : 'Déconnecté'}
      </span>

      {isConnected && walletAddress ? (
        <div style={{ marginTop: '0.75rem' }}>
          <div>
            {walletName} {networkId ? `· ${networkId}` : ''}
          </div>
          <div className="address" title={walletAddress}>
            {shorten(walletAddress)}
          </div>
        </div>
      ) : (
        <p style={{ color: '#9a9ba8', marginTop: '0.75rem' }}>
          Connecte ton wallet Midnight (ex. Lace — édition Midnight) pour voter.
        </p>
      )}

      <div className="row">
        {isConnected ? (
          <button className="secondary" onClick={onDisconnect}>
            Déconnecter
          </button>
        ) : (
          <button onClick={onConnect} disabled={isConnecting}>
            {isConnecting ? 'Connexion…' : 'Connect Wallet'}
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default WalletCard;
