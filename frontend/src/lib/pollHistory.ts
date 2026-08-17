// Privacy note: this file only ever persists a contract address, a role
// ('deployed' | 'joined') and a timestamp — all purely local to this
// browser. It never stores a voter identity, a vote choice, or anything
// that could be linked back to a person. The on-chain contract itself
// never reveals that either (see contracts/voting.compact: only a
// commitment hash is stored, never the raw identity or the choice).

export type PollRole = 'deployed' | 'joined';

export type PollHistoryEntry = {
  address: string;
  role: PollRole;
  firstSeenAt: number;
};

const STORAGE_KEY = 'private-vote:history';

function readAll(): PollHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: PollHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // best-effort only — history is a convenience, not a source of truth
  }
}

export function recordPoll(address: string, role: PollRole): void {
  const entries = readAll();
  const existing = entries.find((e) => e.address === address);
  if (existing) {
    // A poll you deployed stays marked as "deployed" even if you also
    // rejoin it later; otherwise keep the most recent role.
    if (existing.role !== 'deployed') existing.role = role;
    writeAll(entries);
    return;
  }
  entries.unshift({ address, role, firstSeenAt: Date.now() });
  writeAll(entries);
}

export function listPolls(): PollHistoryEntry[] {
  return readAll().sort((a, b) => b.firstSeenAt - a.firstSeenAt);
}
