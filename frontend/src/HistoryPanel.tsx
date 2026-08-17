import React, { useCallback, useEffect, useState } from 'react';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { History, RefreshCw, ShieldCheck, Rocket, LogIn, Copy } from 'lucide-react';
import { ledger, PollStatus } from './lib/contract';
import { listPolls, type PollHistoryEntry } from './lib/pollHistory';
import { useI18n } from './i18n';
import { useToast } from './Toast';

type Props = {
  providers: MidnightProviders | null;
  onOpenInPoll: (address: string) => void;
};

type LiveResult = {
  status: number;
  total: bigint;
  yes: bigint;
  no: bigint;
} | null;

const HistoryPanel: React.FC<Props> = ({ providers, onOpenInPoll }) => {
  const { t } = useI18n();
  const { push } = useToast();
  const [entries, setEntries] = useState<PollHistoryEntry[]>([]);
  const [live, setLive] = useState<Record<string, LiveResult>>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setEntries(listPolls());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshAll = useCallback(async () => {
    if (!providers) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        entries.map(async (entry) => {
          try {
            const state = await providers.publicDataProvider.queryContractState(entry.address);
            if (!state) return [entry.address, null] as const;
            const l = ledger(state.data);
            return [
              entry.address,
              {
                status: l.status as unknown as number,
                total: l.totalVotes,
                yes: l.yesVotes,
                no: l.noVotes,
              },
            ] as const;
          } catch {
            return [entry.address, null] as const;
          }
        }),
      );
      setLive(Object.fromEntries(results));
    } finally {
      setLoading(false);
    }
  }, [providers, entries]);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers, entries.length]);

  const copy = async (address: string) => {
    await navigator.clipboard.writeText(address);
    push('info', t('poll.copied'));
  };

  return (
    <div className="card">
      <h2>
        <History size={18} />
        {t('history.title')}
      </h2>
      <p className="empty-hint" style={{ marginTop: 0 }}>
        {t('history.subtitle')}
      </p>

      <div className="privacy-note">
        <ShieldCheck size={15} />
        <span>{t('history.privacyNote')}</span>
      </div>

      {entries.length === 0 ? (
        <p className="empty-hint">{t('history.empty')}</p>
      ) : (
        <>
          <div className="row" style={{ marginBottom: 'var(--space-3)' }}>
            <button className="ghost" onClick={refreshAll} disabled={!providers || loading}>
              <RefreshCw size={16} className={loading ? 'spin' : undefined} />
              {t('history.refresh')}
            </button>
          </div>

          <ul className="history-list">
            {entries.map((entry) => {
              const result = live[entry.address];
              return (
                <li key={entry.address} className="history-item">
                  <div className="history-item-head">
                    <span className={`role-badge role-${entry.role}`}>
                      {entry.role === 'deployed' ? <Rocket size={12} /> : <LogIn size={12} />}
                      {entry.role === 'deployed' ? t('history.role.deployed') : t('history.role.joined')}
                    </span>
                    <span className="history-date">
                      {new Date(entry.firstSeenAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="history-address">
                    <code title={entry.address}>{shorten(entry.address)}</code>
                    <button
                      className="ghost"
                      aria-label={t('common.copy')}
                      title={t('common.copy')}
                      onClick={() => copy(entry.address)}
                      style={{ minWidth: 32, padding: 6 }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>

                  {result ? (
                    <div className="history-results">
                      <span className="history-pill">
                        {result.status === PollStatus.CLOSED ? t('poll.statusClosed') : t('poll.statusOpen')}
                      </span>
                      <span className="history-pill">{t('poll.total')}: {result.total.toString()}</span>
                      <span className="history-pill">{t('poll.yes')}: {result.yes.toString()}</span>
                      <span className="history-pill">{t('poll.no')}: {result.no.toString()}</span>
                    </div>
                  ) : (
                    <div className="history-results">
                      <span className="history-pill skeleton" style={{ width: 80, height: 20 }} />
                    </div>
                  )}

                  <button className="secondary" onClick={() => onOpenInPoll(entry.address)}>
                    {t('history.viewInPoll')}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};

function shorten(addr: string): string {
  return addr.length > 24 ? `${addr.slice(0, 14)}…${addr.slice(-8)}` : addr;
}

export default HistoryPanel;
