import React, { useCallback, useEffect, useState } from 'react';
import { deployContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { Vote, Rocket, LogIn, ThumbsUp, ThumbsDown, Lock, Loader2, Copy } from 'lucide-react';
import {
  CompiledVotingContract,
  PollStatus,
  createVotingPrivateState,
  ledger,
} from './lib/contract';
import { useToast } from './Toast';

type Props = {
  providers: MidnightProviders | null;
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

const errorMessage = (e: unknown): string => {
  const causeSuffix = e instanceof Error && e.cause ? ` — cause : ${String(e.cause)}` : '';
  return e instanceof Error ? `${e.message}${causeSuffix}` : String(e);
};

const VotingPanel: React.FC<Props> = ({ providers }) => {
  const { push } = useToast();
  const [addressInput, setAddressInput] = useState('');
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [deployTimedOut, setDeployTimedOut] = useState(false);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);
  const busy = action !== null;

  const privateStateId = contractAddress ? `voting-${contractAddress}` : null;

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
        push('success', 'Poll déployé avec succès');
      } catch (e) {
        if (e instanceof Error && e.message === 'deploy-timeout') {
          // stop spinner and show warning; continue waiting for deployPromise
          setAction(null);
          setDeployTimedOut(true);
          push('warning', "Le déploiement prend plus de 30s — vérifie ton wallet. Si la tx a été soumise, le contrat apparaîtra automatiquement une fois finalisé.");

          // Continue handling the eventual deploy resolution in background
          deployPromise.then((d) => {
            try {
              const address = d.deployTxData.public.contractAddress;
              localStorage.setItem(STORAGE_PREFIX + address, btoa(String.fromCharCode(...secretKey)));
              setContractAddress(address);
              setAddressInput(address);
              setDeployTimedOut(false);
              push('success', 'Poll déployé avec succès (finalisé)');
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
    setResults(null);
    setContractAddress(addressInput.trim());
    push('info', 'Poll rejoint — récupération des résultats…');
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
      push('success', `Vote "${choice ? 'Oui' : 'Non'}" enregistré`);
    } catch (e) {
      console.error('Erreur complète (voir cause ci-dessous) :', e);
      push('error', errorMessage(e));
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
      push('success', 'Poll fermé');
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
    push('info', 'Adresse copiée');
  };

  if (!providers) {
    return (
      <div className="card">
        <h2>
          <Vote size={18} />
          Poll
        </h2>
        <p className="empty-hint">Connecte ton wallet pour déployer ou rejoindre un vote.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>
        <Vote size={18} />
        Poll
      </h2>

      <div className="field">
        <label htmlFor="contract-address">Adresse du contrat</label>
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
              aria-label="Copier l'adresse du contrat"
              title="Copier l'adresse"
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
          Rejoindre
        </button>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="secondary" onClick={handleDeploy} disabled={busy}>
            {action === 'deploy' ? <Loader2 size={16} className="spin" /> : <Rocket size={16} />}
            Déployer un nouveau poll
          </button>
          {deployTimedOut && (
            <div style={{ color: 'var(--warning)', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>Attente prolongée — vérifie ton wallet.</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="ghost"
                  onClick={() => {
                    setDeployTimedOut(false);
                    push('info', "Arrêt de l'attente. Si la tx a été soumise, l'adresse se complétera automatiquement.");
                  }}
                >
                  Stop
                </button>
                <button
                  className="ghost"
                  onClick={async () => {
                    const tx = sessionStorage.getItem('midnight:lastSubmittedTxId');
                    if (tx) {
                      await navigator.clipboard.writeText(tx);
                      push('info', "Tx id copié");
                    } else {
                      push('error', "Tx id non disponible");
                    }
                  }}
                >
                  Copier tx id
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
                  <div className="value">
                    {results.status === PollStatus.CLOSED ? 'Fermé' : 'Ouvert'}
                  </div>
                  <div className="label">Statut</div>
                </div>
                <div className="result-item">
                  <div className="value">{results.total.toString()}</div>
                  <div className="label">Total</div>
                </div>
                <div className="result-item">
                  <div className="value">{results.yes.toString()}</div>
                  <div className="label">Oui</div>
                </div>
                <div className="result-item">
                  <div className="value">{results.no.toString()}</div>
                  <div className="label">Non</div>
                </div>
              </>
            ) : (
              [0, 1, 2, 3].map((i) => (
                <div key={i} className="result-item skeleton" style={{ height: 72 }} />
              ))
            )}
          </div>

          <div className="row">
            <button className="yes" onClick={() => handleVote(true)} disabled={busy}>
              {action === 'vote-yes' ? <Loader2 size={16} className="spin" /> : <ThumbsUp size={16} />}
              Voter Oui
            </button>
            <button className="no" onClick={() => handleVote(false)} disabled={busy}>
              {action === 'vote-no' ? <Loader2 size={16} className="spin" /> : <ThumbsDown size={16} />}
              Voter Non
            </button>
            <button className="secondary" onClick={handleClosePoll} disabled={busy}>
              {action === 'close' ? <Loader2 size={16} className="spin" /> : <Lock size={16} />}
              Fermer le poll
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VotingPanel;
