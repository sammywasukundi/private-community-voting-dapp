import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  createConstructorContext,
  CostModel,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "../../managed/voting/contract/index.js";
import { type VotingPrivateState, witnesses } from "../../witnesses.js";

const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

export class VotingSimulator {
  readonly contract: Contract<VotingPrivateState>;
  circuitContext: CircuitContext<VotingPrivateState>;

  constructor(secretKey: Uint8Array = randomBytes(32)) {
    this.contract = new Contract<VotingPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext({ secretKey }, "0".repeat(64)),
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  public switchVoter(secretKey: Uint8Array): void {
    this.circuitContext.currentPrivateState = { secretKey };
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): VotingPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public vote(choice: boolean): Ledger {
    this.circuitContext = this.contract.impureCircuits.vote(
      this.circuitContext,
      choice,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public closePoll(): Ledger {
    this.circuitContext = this.contract.impureCircuits.closePoll(
      this.circuitContext,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getResults(): { total: bigint; yes: bigint; no: bigint } {
    const result = this.contract.impureCircuits.getResults(
      this.circuitContext,
    );
    return result.result;
  }
}
