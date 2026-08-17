import React from 'react';
import { Wallet, LogOut, Loader2, AlertCircle, Copy, RefreshCw, Coins } from 'lucide-react';
import type { WalletCardProps } from './types';
import { useI18n } from './i18n';
import { useToast } from './Toast';

const shorten = (addr: string) =>
  addr.length > 24 ? `${addr.slice(0, 14)}…${addr.slice(-8)}` : addr;

// Night uses 6 decimals on Midnight — shown as a friendly decimal instead
// of a raw atomic bigint.
const formatNight = (atomic: bigint): string => {
  const whole = atomic / 1_000_000n;
  const frac = atomic % 1_000_000n;
  const fracStr = frac.toString().padStart(6, '0').slice(0, 2);
  return `${whole.toLocaleString()}.${fracStr}`;
};

const WalletCard: React.FC<WalletCardProps> = ({
  isConnected,
  isConnecting,
  walletName,
  walletAddress,
  networkId,
  error,
  onConnect,
  onDisconnect,
  nightBalance,
  isRefreshingBalance,
  onRefreshBalance,
}) => {
  const { t } = useI18n();
  const { push } = useToast();

  const copyAddress = async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    push('info', t('wallet.addressCopied'));
  };

  return (
    <div className="card">
      <h2>
        <Wallet size={18} />
        {t('wallet.title')}
      </h2>
      <span className={`status-pill ${isConnected ? 'connected' : 'disconnected'}`}>
        <span className="dot" />
        {isConnected ? t('wallet.connected') : t('wallet.disconnected')}
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
          <button
            className="ghost"
            onClick={copyAddress}
            aria-label={t('wallet.copyAddress')}
            title={t('wallet.copyAddress')}
            style={{ flexShrink: 0, minWidth: 40, padding: 'var(--space-2)' }}
          >
            <Copy size={15} />
          </button>
        </div>
      ) : (
        <p className="empty-hint">{t('wallet.hint')}</p>
      )}

      {isConnected && (
        <div className="balance-row">
          <span className="balance-label">
            <Coins size={14} />
            {t('wallet.balance')}
          </span>
          <span className="balance-value" key={nightBalance?.toString() ?? 'none'}>
            {nightBalance !== null ? formatNight(nightBalance) : '—'}
          </span>
          <button
            className="ghost"
            onClick={onRefreshBalance}
            disabled={isRefreshingBalance}
            aria-label={t('wallet.refreshBalance')}
            title={t('wallet.refreshBalance')}
            style={{ minWidth: 32, padding: 6 }}
          >
            <RefreshCw size={14} className={isRefreshingBalance ? 'spin' : undefined} />
          </button>
        </div>
      )}

      <div className="row">
        {isConnected ? (
          <button className="secondary" onClick={onDisconnect}>
            <LogOut size={16} />
            {t('wallet.disconnect')}
          </button>
        ) : (
          <button onClick={onConnect} disabled={isConnecting}>
            {isConnecting ? <Loader2 size={16} className="spin" /> : <Wallet size={16} />}
            {isConnecting ? t('wallet.connecting') : t('wallet.connect')}
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
