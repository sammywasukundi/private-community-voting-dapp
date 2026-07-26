import { describe, it, expect } from "vitest";
import { VotingSimulator } from "./voting-simulator.js";
import { PollStatus } from "../../managed/voting/contract/index.js";

describe("Voting smart contract", () => {
  it("generates initial ledger state deterministically", () => {
    const key = new Uint8Array(32);
    key[0] = 42;
    const sim0 = new VotingSimulator(key);
    const sim1 = new VotingSimulator(key);
    expect(sim0.getLedger()).toEqual(sim1.getLedger());
  });

  it("properly initializes ledger state", () => {
    const sim = new VotingSimulator();
    const ledger = sim.getLedger();
    expect(ledger.status).toEqual(PollStatus.OPEN);
    expect(ledger.totalVotes).toEqual(0n);
    expect(ledger.yesVotes).toEqual(0n);
    expect(ledger.noVotes).toEqual(0n);
  });

  it("records a yes vote in the public counters", () => {
    const sim = new VotingSimulator();
    sim.vote(true);
    const ledger = sim.getLedger();
    expect(ledger.totalVotes).toEqual(1n);
    expect(ledger.yesVotes).toEqual(1n);
    expect(ledger.noVotes).toEqual(0n);
  });

  it("records a no vote in the public counters", () => {
    const sim = new VotingSimulator();
    sim.vote(false);
    const ledger = sim.getLedger();
    expect(ledger.totalVotes).toEqual(1n);
    expect(ledger.yesVotes).toEqual(0n);
    expect(ledger.noVotes).toEqual(1n);
  });

  it("prevents the same voter from voting twice", () => {
    const sim = new VotingSimulator();
    sim.vote(true);
    expect(() => sim.vote(false)).toThrow("already voted");
  });

  it("allows multiple different voters to vote", () => {
    const sim = new VotingSimulator();
    sim.vote(true);
    sim.switchVoter(crypto.getRandomValues(new Uint8Array(32)));
    sim.vote(true);
    sim.switchVoter(crypto.getRandomValues(new Uint8Array(32)));
    sim.vote(false);
    const ledger = sim.getLedger();
    expect(ledger.totalVotes).toEqual(3n);
    expect(ledger.yesVotes).toEqual(2n);
    expect(ledger.noVotes).toEqual(1n);
  });

  it("refuses votes after the poll is closed", () => {
    const sim = new VotingSimulator();
    sim.closePoll();
    expect(() => sim.vote(true)).toThrow("not open");
  });

  it("reveals aggregated results only after closing", () => {
    const sim = new VotingSimulator();
    sim.vote(true);
    sim.switchVoter(crypto.getRandomValues(new Uint8Array(32)));
    sim.vote(false);
    sim.switchVoter(crypto.getRandomValues(new Uint8Array(32)));
    sim.vote(true);

    // Results should be hidden while poll is open
    expect(() => sim.getResults()).toThrow("still open");

    sim.closePoll();
    const results = sim.getResults();
    expect(results.total).toEqual(3n);
    expect(results.yes).toEqual(2n);
    expect(results.no).toEqual(1n);
  });

  it("keeps the private state unchanged after voting", () => {
    const sim = new VotingSimulator();
    const initialPrivate = sim.getPrivateState();
    sim.vote(true);
    expect(sim.getPrivateState()).toEqual(initialPrivate);
  });
});

