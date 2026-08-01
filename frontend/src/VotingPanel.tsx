import React, { useCallback, useEffect, useState } from 'react';
import { deployContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import {
  CompiledVotingContract,
  PollStatus,
  createVotingPrivateState,
  ledger,
} from './lib/contract';

type Props = {
  providers: MidnightProviders | null;
};

type Results = {
  status: number;
  total: bigint;
  yes: bigint;
  no: bigint;
};

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

const VotingPanel: React.FC<Props> = ({ providers }) => {
  const [addressInput, setAddressInput] = useState('');
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setBusy(true);
    setError(null);
    try {
      // The contract address isn't known before deploying, so the private
      // state id (and its associated secret key) is created against a
      // temporary id and only matched to the final address afterwards.
      const secretKey = crypto.getRandomValues(new Uint8Array(32));
      const deployed = await deployContract(providers, {
        compiledContract: CompiledVotingContract,
        privateStateId: 'pending-deploy',
        initialPrivateState: createVotingPrivateState(secretKey),
      });
      const address = deployed.deployTxData.public.contractAddress;
      localStorage.setItem(STORAGE_PREFIX + address, btoa(String.fromCharCode(...secretKey)));
      setContractAddress(address);
      setAddressInput(address);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = () => {
    if (!addressInput.trim()) return;
    setError(null);
    setContractAddress(addressInput.trim());
  };

  const handleVote = async (choice: boolean) => {
    if (!providers || !contractAddress || !privateStateId) return;
    setBusy(true);
    setError(null);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleClosePoll = async () => {
    if (!providers || !contractAddress || !privateStateId) return;
    setBusy(true);
    setError(null);
    try {
      await submitCallTx(providers, {
        compiledContract: CompiledVotingContract,
        contractAddress,
        privateStateId,
        circuitId: 'closePoll',
        args: [],
      });
      await refreshResults();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!providers) {
    return (
      <div className="card">
        <h2>Poll</h2>
        <p style={{ color: '#9a9ba8' }}>Connecte ton wallet pour déployer ou rejoindre un vote.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Poll</h2>

      <label htmlFor="contract-address" style={{ fontSize: '0.85rem', color: '#9a9ba8' }}>
        Adresse du contrat
      </label>
      <input
        id="contract-address"
        type="text"
        placeholder="0x..."
        value={addressInput}
        onChange={(e) => setAddressInput(e.target.value)}
      />
      <div className="row">
        <button className="secondary" onClick={handleJoin} disabled={busy || !addressInput.trim()}>
          Rejoindre
        </button>
        <button className="secondary" onClick={handleDeploy} disabled={busy}>
          Déployer un nouveau poll
        </button>
      </div>

      {contractAddress && (
        <>
          <div className="results">
            <div className="result-item">
              <div className="value">
                {results ? (results.status === PollStatus.CLOSED ? 'Fermé' : 'Ouvert') : '—'}
              </div>
              <div className="label">Statut</div>
            </div>
            <div className="result-item">
              <div className="value">{results ? results.total.toString() : '—'}</div>
              <div className="label">Total</div>
            </div>
            <div className="result-item">
              <div className="value">{results ? results.yes.toString() : '—'}</div>
              <div className="label">Oui</div>
            </div>
            <div className="result-item">
              <div className="value">{results ? results.no.toString() : '—'}</div>
              <div className="label">Non</div>
            </div>
          </div>

          <div className="row">
            <button className="yes" onClick={() => handleVote(true)} disabled={busy}>
              Voter Oui
            </button>
            <button className="no" onClick={() => handleVote(false)} disabled={busy}>
              Voter Non
            </button>
            <button className="secondary" onClick={handleClosePoll} disabled={busy}>
              Fermer le poll
            </button>
          </div>
        </>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default VotingPanel;
