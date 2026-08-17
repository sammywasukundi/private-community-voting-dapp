// Local, best-effort mirror of the on-chain `voted` set for *this*
// wallet/browser only. The contract is the real source of truth (it
// rejects a second vote with a "already voted" assertion on the hidden
// identity commitment — see contracts/voting.compact); this flag just
// lets the UI pre-emptively disable the vote buttons instead of
// surfacing that raw circuit error every time.
const VOTED_PREFIX = 'private-vote:voted:';

export function markVoted(address: string): void {
  try {
    localStorage.setItem(VOTED_PREFIX + address, '1');
  } catch {
    // ignore — worst case the user sees the friendly error once more
  }
}

export function hasVotedLocally(address: string): boolean {
  try {
    return localStorage.getItem(VOTED_PREFIX + address) === '1';
  } catch {
    return false;
  }
}
