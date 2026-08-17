import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum PollStatus { OPEN = 0, CLOSED = 1 }

export type PollResults = { total: bigint; yes: bigint; no: bigint };

export type Witnesses<PS> = {
  voterIdentity(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  vote(context: __compactRuntime.CircuitContext<PS>, choice_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  closePoll(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  getResults(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, PollResults>;
}

export type ProvableCircuits<PS> = {
  vote(context: __compactRuntime.CircuitContext<PS>, choice_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  closePoll(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  getResults(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, PollResults>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  vote(context: __compactRuntime.CircuitContext<PS>, choice_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  closePoll(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  getResults(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, PollResults>;
}

export type Ledger = {
  readonly status: PollStatus;
  readonly totalVotes: bigint;
  readonly yesVotes: bigint;
  readonly noVotes: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
