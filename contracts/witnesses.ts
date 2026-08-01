import type { Ledger } from "./managed/voting/contract/index.js";
import type { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type VotingPrivateState = {
  readonly secretKey: Uint8Array;
};

export const createVotingPrivateState = (secretKey: Uint8Array) => ({
  secretKey,
});

export const witnesses = {
  voterIdentity: ({
    privateState,
  }: WitnessContext<Ledger, VotingPrivateState>): [
    VotingPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],
};
