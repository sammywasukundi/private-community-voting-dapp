import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import path from "node:path";

export {
  Contract,
  ledger,
  pureCircuits,
  PollStatus,
  type Ledger,
  type ImpureCircuits,
  type PureCircuits,
} from "./managed/voting/contract/index.js";

import { Contract } from "./managed/voting/contract/index.js";
import * as Witnesses from "./witnesses.js";

const currentDir = path.resolve(new URL(import.meta.url).pathname, "..");
export const zkConfigPath = path.resolve(currentDir, "managed", "voting");

export const CompiledVotingContract = CompiledContract.make<
  Contract< Witnesses.VotingPrivateState>
>("VotingContract", Contract< Witnesses.VotingPrivateState>).pipe(
  CompiledContract.withWitnesses(Witnesses.witnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

