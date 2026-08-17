import React, { useCallback, useEffect, useState } from 'react';
import { deployContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { Vote, Rocket, LogIn, ThumbsUp, ThumbsDown, Lock, Loader2, Copy, ShieldCheck } from 'lucide-react';
import {
  CompiledVotingContract,
  PollStatus,
  createVotingPrivateState,
  ledger,
} from './lib/contract';
import { useToast } from './Toast';
import { useI18n } from './i18n';
import { recordPoll } from './lib/pollHistory';
import { markVoted, hasVotedLocally } from './lib/voteGuard';

type Props = {
  providers: MidnightProviders | null;
  /** Set from the History tab's "open in Poll" action; joins that poll
   * automatically the moment it (or the wallet) becomes available. */
  requestedAddress?: string | null;
};

type Results = {
  status: number;
  total: bigint;
  yes: bigint;
  no: bigint;
};

type Action = 'deploy' | 'join' | 'vote-yes' | 'vote-no' | 'close' | null;

const STORAGE_PREFIX = 'private-vote:secret:';

function getOrCreateSecretKey(contractAddress: string): Uint8Array {
  const key = STORAGE_PREFIX + contractAddress;
  const stored = localStorage.getItem(key);
  if (stored) {
    return Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
  }
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(key, btoa(String.fromCharCode(...bytes)));
  return bytes;
}

// The Compact circuit rejects a repeat vote with a raw `failed assert:
// already voted` message (see contracts/voting.compact — the identity
// commitment is already a member of the `voted` set). We recognize that
// specific case to show a calm, translated explanation instead of the
// raw transaction/assertion trace.
function isAlreadyVotedError(e: unknown): boolean {
  const text = e instanceof Error ? `${e.message} ${e.cause ?? ''}` : String(e);
  return /already voted/i.test(text);
}

const errorMessage = (e: unknown): string => {
  const causeSuffix = e instanceof Error && e.cause ? ` — cause : ${String(e.cause)}` : '';
  return e instanceof Error ? `${e.message}${causeSuffix}` : String(e);
};

const VotingPanel: React.FC<Props> = ({ providers, requestedAddress }) => {
  const { push } = useToast();
  const { t } = useI18n();
  const [addressInput, setAddressInput] = useState('');
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [deployTimedOut, setDeployTimedOut] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const busy = action !== null;

  const privateStateId = contractAddress ? `voting-${contractAddress}` : null;

  useEffect(() => {
    setHasVoted(contractAddress ? hasVotedLocally(contractAddress) : false);
  }, [contractAddress]);

  useEffect(() => {
    if (!providers || !requestedAddress) return;
    setAddressInput(requestedAddress);
    setResults(null);
    setContractAddress(requestedAddress);
    recordPoll(requestedAddress, 'joined');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers, requestedAddress]);

  const refreshResults = useCallback(async () => {
    if (!providers || !contractAddress) return;
    try {
      const state = await providers.publicDataProvider.queryContractState(contractAddress);
      if (!state) return;
      const l = ledger(state.data);
      setResults({
        status: l.status as unknown as number,
        total: l.totalVotes,
        yes: l.yesVotes,
        no: l.noVotes,
      });
    } catch {
      // Contract not deployed at this address (yet), or indexer hasn't
      // caught up — silently retry on the next poll tick.
    }
  }, [providers, contractAddress]);

  useEffect(() => {
    if (!contractAddress) return;
    refreshResults();
    const id = setInterval(refreshResults, 5000);
    return () => clearInterval(id);
  }, [contractAddress, refreshResults]);

  const handleDeploy = async () => {
    if (!providers) return;
    setAction('deploy');
    try {
      // The contract address isn't known before deploying, so the private
      // state id (and its associated secret key) is created against a
      // temporary id and only matched to the final address afterwards.
      const secretKey = crypto.getRandomValues(new Uint8Array(32));
      const deployPromise = deployContract(providers, {
        compiledContract: CompiledVotingContract,
        privateStateId: 'pending-deploy',
        initialPrivateState: createVotingPrivateState(secretKey),
      });

      // If deploy takes longer than this, stop the spinner and show a
      // user-facing warning while the operation continues in background.
      const DEPLOY_TIMEOUT_MS = 30_000;
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('deploy-timeout')), DEPLOY_TIMEOUT_MS));

      let deployed;
      try {
        deployed = await Promise.race([deployPromise, timeoutPromise]);
        // finished before timeout — normal flow
        const address = deployed.deployTxData.public.contractAddress;
        localStorage.setItem(STORAGE_PREFIX + address, btoa(String.fromCharCode(...secretKey)));
        setContractAddress(address);
        setAddressInput(address);
        recordPoll(address, 'deployed');
        push('success', t('poll.deployed'));
      } catch (e) {
        if (e instanceof Error && e.message === 'deploy-timeout') {
          // stop spinner and show warning; continue waiting for deployPromise
          setAction(null);
          setDeployTimedOut(true);
          push('warning', t('poll.deployTimeoutMsg'));

          // Continue handling the eventual deploy resolution in background
          deployPromise.then((d) => {
            try {
              const address = d.deployTxData.public.contractAddress;
              localStorage.setItem(STORAGE_PREFIX + address, btoa(String.fromCharCode(...secretKey)));
              setContractAddress(address);
              setAddressInput(address);
              setDeployTimedOut(false);
              recordPoll(address, 'deployed');
              push('success', t('poll.deployedFinal'));
            } catch (inner) {
              console.error('Error processing late deploy result', inner);
            }
          }).catch((err) => {
            console.error('Delayed deploy failed', err);
            push('error', errorMessage(err));
            setDeployTimedOut(false);
          });
        } else {
          // real error
          throw e;
        }
      }
    } catch (e) {
      console.error('Erreur complète (voir cause ci-dessous) :', e);
      push('error', errorMessage(e));
    } finally {
      // If we timed out above we already cleared the action; in other
      // cases ensure spinner is cleared.
      if (!deployTimedOut) setAction(null);
    }
  };

  const handleJoin = () => {
    if (!addressInput.trim()) return;
    const address = addressInput.trim();
    setResults(null);
    setContractAddress(address);
    recordPoll(address, 'joined');
    push('info', t('poll.joined'));
  };

  const handleVote = async (choice: boolean) => {
    if (!providers || !contractAddress || !privateStateId) return;
    setAction(choice ? 'vote-yes' : 'vote-no');
    try {
      const secretKey = getOrCreateSecretKey(contractAddress);
      // Re-register the private state under this contract's id the first
      // time we interact with it after joining (a no-op if already set).
      await providers.privateStateProvider.set(
        privateStateId,
        createVotingPrivateState(secretKey),
      );
      await submitCallTx(providers, {
        compiledContract: CompiledVotingContract,
        contractAddress,
        privateStateId,
        circuitId: 'vote',
        args: [choice],
      });
      await refreshResults();
      push('success', t('poll.voteRegistered', { choice: choice ? t('poll.yes') : t('poll.no') }));
    } catch (e) {
      if (isAlreadyVotedError(e)) {
        markVoted(contractAddress);
        setHasVoted(true);
        push('info', t('poll.alreadyVotedToast'));
      } else {
        console.error('Erreur complète (voir cause ci-dessous) :', e);
        push('error', errorMessage(e));
      }
    } finally {
      setAction(null);
    }
  };

  const handleClosePoll = async () => {
    if (!providers || !contractAddress || !privateStateId) return;
    setAction('close');
    try {
      await submitCallTx(providers, {
        compiledContract: CompiledVotingContract,
        contractAddress,
        privateStateId,
        circuitId: 'closePoll',
        args: [],
      });
      await refreshResults();
      push('success', t('poll.closed'));
    } catch (e) {
      console.error('Erreur complète (voir cause ci-dessous) :', e);
      push('error', errorMessage(e));
    } finally {
      setAction(null);
    }
  };

  const copyAddress = async () => {
    if (!contractAddress) return;
    await navigator.clipboard.writeText(contractAddress);
    push('info', t('poll.copied'));
  };

  if (!providers) {
    return (
      <div className="card">
        <h2>
          <Vote size={18} />
          {t('poll.title')}
        </h2>
        <p className="empty-hint">{t('poll.emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>
        <Vote size={18} />
        {t('poll.title')}
      </h2>

      <div className="field">
        <label htmlFor="contract-address">{t('poll.contractAddress')}</label>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            id="contract-address"
            type="text"
            placeholder="0x..."
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
          />
          {contractAddress && (
            <button
              className="ghost"
              onClick={copyAddress}
              aria-label={t('poll.copy')}
              title={t('poll.copy')}
              style={{ flexShrink: 0, minWidth: 44, padding: 'var(--space-3)' }}
            >
              <Copy size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="row">
        <button className="secondary" onClick={handleJoin} disabled={busy || !addressInput.trim()}>
          <LogIn size={16} />
          {t('poll.join')}
        </button>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="secondary" onClick={handleDeploy} disabled={busy}>
            {action === 'deploy' ? <Loader2 size={16} className="spin" /> : <Rocket size={16} />}
            {t('poll.deploy')}
          </button>
          {deployTimedOut && (
            <div style={{ color: 'var(--warning)', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>{t('poll.deployWaiting')}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="ghost"
                  onClick={() => {
                    setDeployTimedOut(false);
                    push('info', t('poll.deployWaiting'));
                  }}
                >
                  {t('poll.deployStop')}
                </button>
                <button
                  className="ghost"
                  onClick={async () => {
                    const tx = sessionStorage.getItem('midnight:lastSubmittedTxId');
                    if (tx) {
                      await navigator.clipboard.writeText(tx);
                      push('info', t('poll.txIdCopied'));
                    } else {
                      push('error', t('poll.txIdUnavailable'));
                    }
                  }}
                >
                  {t('poll.copyTxId')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {contractAddress && (
        <>
          <div className="results">
            {results ? (
              <>
                <div className="result-item">
                  <div className="value" key={`status-${results.status}`}>
                    {results.status === PollStatus.CLOSED ? t('poll.statusClosed') : t('poll.statusOpen')}
                  </div>
                  <div className="label">{t('poll.status')}</div>
                </div>
                <div className="result-item">
                  <div className="value" key={`total-${results.total}`}>{results.total.toString()}</div>
                  <div className="label">{t('poll.total')}</div>
                </div>
                <div className="result-item">
                  <div className="value" key={`yes-${results.yes}`}>{results.yes.toString()}</div>
                  <div className="label">{t('poll.yes')}</div>
                </div>
                <div className="result-item">
                  <div className="value" key={`no-${results.no}`}>{results.no.toString()}</div>
                  <div className="label">{t('poll.no')}</div>
                </div>
              </>
            ) : (
              [0, 1, 2, 3].map((i) => (
                <div key={i} className="result-item skeleton" style={{ height: 72 }} />
              ))
            )}
          </div>

          {hasVoted && (
            <div className="already-voted-banner">
              <ShieldCheck size={16} />
              <div>
                <div className="already-voted-title">{t('poll.alreadyVoted')}</div>
                <div className="already-voted-hint">{t('poll.alreadyVotedHint')}</div>
              </div>
            </div>
          )}

          <div className="row">
            <button className="yes" onClick={() => handleVote(true)} disabled={busy || hasVoted}>
              {action === 'vote-yes' ? <Loader2 size={16} className="spin" /> : <ThumbsUp size={16} />}
              {t('poll.voteYes')}
            </button>
            <button className="no" onClick={() => handleVote(false)} disabled={busy || hasVoted}>
              {action === 'vote-no' ? <Loader2 size={16} className="spin" /> : <ThumbsDown size={16} />}
              {t('poll.voteNo')}
            </button>
            <button className="secondary" onClick={handleClosePoll} disabled={busy}>
              {action === 'close' ? <Loader2 size={16} className="spin" /> : <Lock size={16} />}
              {t('poll.closePoll')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VotingPanel;
