# Midnight Private Community Voting DApp

A privacy-preserving voting application built on the **Midnight Network** using the **Compact** smart contract language.

This project demonstrates how Zero-Knowledge technology can be used to build a secure community voting system where every member can vote privately while keeping the final result publicly verifiable.

---

# Project Title

**PrivateVote** — Midnight Private Community Voting DApp

---

# Project Description

PrivateVote is a decentralized, privacy-preserving voting application built on the Midnight Network. It lets any community, DAO, association, or organization run a poll where each member's vote is provably counted on-chain, while the identity behind each individual vote is never revealed — not to observers, not to the poll organizer, and not to the chain itself. Zero-Knowledge proofs guarantee that every recorded vote is legitimate (cast once, by an eligible participant) without exposing who cast it or how. A lightweight React frontend lets members connect a Midnight wallet, deploy or join a poll, vote, close the poll, and watch the public tally update live.

---

# Project Vision

Most on-chain governance today forces a tradeoff between transparency and privacy: public blockchains make results verifiable, but they also make every individual vote traceable back to a wallet, discouraging honest participation on sensitive topics. PrivateVote's long-term vision is to make private-by-default governance the norm for digital communities — where members can vote their conscience on any proposal, board decision, or community measure without fear of social, professional, or political retaliation, while giving every participant cryptographic assurance that the final count is accurate and untampered. Midnight's Zero-Knowledge architecture makes this possible without relying on a trusted intermediary to keep votes secret.

---

# Key Features

- **Private voting** — individual choices are never disclosed on-chain, only proven valid via Zero-Knowledge proofs
- **Publicly verifiable results** — poll status and aggregate tallies (total, yes, no) are readable by anyone at any time
- **Double-vote prevention** — a non-reversible commitment of each voter's identity is checked on-chain, without ever revealing the identity itself
- **Real Connect Wallet flow** — browser frontend using `@midnight-ntwrk/dapp-connector-api` to connect to a real Midnight wallet extension
- **Live results** — poll status and vote counts refresh automatically as the frontend polls the indexer
- **Deploy or join** — start a brand-new poll from the UI, or join an existing one by pasting its contract address
- **Full test coverage** — unit tests via a local simulator, plus end-to-end deployment tests against local, preview, and preprod networks

---

# Product Idea

Private Community Voting DApp is a decentralized governance application designed for DAOs, communities, associations and organizations that require confidential voting.

Each participant can cast a vote without revealing their identity or vote choice. The blockchain only stores the aggregated voting results, ensuring transparency while preserving voter privacy through Midnight's Zero-Knowledge technology.

---

# Features

- Private voting using Zero-Knowledge Proofs
- Public verification of the final result
- Secure contract deployment on Midnight Preview Network
- Automatic proof generation
- Compact smart contract
- TypeScript deployment and testing

---

# Public State vs Private Witness

## Public State

The following information is stored on-chain and is visible to everyone:

- Poll status (OPEN / CLOSED)
- Total number of votes
- Number of YES votes
- Number of NO votes

This information allows anyone to verify the final voting result.

## Private Witness

Private information never appears on-chain.

The voter's identity is provided through a witness function and is only used during Zero-Knowledge proof generation.

The blockchain verifies the proof without revealing:

- who voted
- how they voted

This guarantees complete voter privacy.

---

# Project Structure

```
project/
│
├── contracts/
│   ├── voting.compact
│   ├── managed/
│   ├── index.ts
│   └── witnesses.ts
│
├── src/
│   ├── config.ts
│   ├── wallet.ts
│   ├── providers.ts
│   └── test/
│
├── screenshots/
│   ├── compile.png
│   └── deployment.png
│
├── package.json
├── compose.yml
├── README.md
└── tsconfig.json
```

---

# Prerequisites

Install the following tools before running the project:

- Node.js (v22 or newer)
- Yarn 1.22.x
- Docker Desktop
- Compact Compiler
- Git

Install Compact globally:

```bash
npm install -g @midnight-ntwrk/compact
```

---

# Installation

Clone the repository:

```bash
git clone https://github.com/sammywasukundi/private-community-voting-dapp.git
```

Move into the project directory:

```bash
cd private-community-voting-dapp/project
```

Install dependencies:

```bash
yarn install
```

---

# Configure Preview Wallet

Copy the example environment file:

```bash
cp .env.preview.example .env.preview
```

Open `.env.preview` and replace the example mnemonic with your own Preview wallet mnemonic.

Example:

```text
MIDNIGHT_PREVIEW_MNEMONIC=your twenty four word mnemonic here
```

---

# Compile the Smart Contract

Compile the Compact contract:

```bash
yarn compile
```

This command generates:

- ZK Circuits
- Proving Keys
- Verification Keys
- TypeScript bindings

inside:

```
contracts/managed/
```

---

# Start the Proof Server

```bash
yarn proof:up
```

---

# Deploy and Test on Preview

Deploy the contract and execute the test suite:

```bash
yarn test:preview
```

A successful execution displays:

- Wallet synchronized
- Contract deployed
- Contract address
- Vote executed
- Poll closed
- All tests passed

---

# Successful Compilation

Insert your compilation screenshot here.

Example:

![Compilation](screenshots/yarncompile.jpg)

---

# Successful Deployment

Insert your deployment screenshot here.

![Deployment](screenshots/deploy.jpg)

---

# Test Results

The deployment test performs the following operations:

- Deploys the voting contract
- Casts a private vote
- Verifies the public counters
- Closes the poll
- Reads the final result

All tests completed successfully on the Midnight Preview Network.

---

# Mainnet / Testnet Contract Details

>The address is printed by `yarn test:preview` (or by the frontend's "Déployer un nouveau poll" button) as `Contract deployed at: <address>`.

- **Network:** Midnight Preview Testnet
- **Contract Address:** `to be continued in next level`
- **Deployment Date:** `to be continued in next level`
- **Block Explorer:** [Midnight Preview Block Explorer](https://docs.midnight.network/relnotes/network) — search the contract address above

**Screenshot:**

![Deployed contract on the block explorer](screenshots/contract-explorer.png)

---

# Running Locally

Compile:

```bash
yarn compile
```

Start Proof Server:

```bash
yarn proof:up
```

Run Preview deployment:

```bash
yarn test:preview
```

Stop Proof Server:

```bash
yarn proof:down
```

---

## Frontend (Connect Wallet)

A minimal React + Vite frontend lives in `frontend/`, using
[`@midnight-ntwrk/dapp-connector-api`](https://docs.midnight.network/api-reference/dapp-connector)
to connect to a real Midnight wallet extension (e.g. Lace — Midnight
edition) in the browser, then deploy/join a poll, cast a private vote, close
the poll, and watch the public counters update live.

### Setup

```bash
yarn install
yarn compile                 # if you haven't already
yarn proof:up                # local proof server used by the frontend
yarn dev                     # starts Vite on http://localhost:5173
```

`yarn dev` / `yarn build` automatically copy `contracts/managed/voting`
into `frontend/public/zk/voting` first (`scripts/copy-zk-assets.mjs`), so the
browser can fetch the ZK circuits over HTTP.

Open `http://localhost:5173`, click **Connect Wallet** (requires a Midnight
wallet extension installed and unlocked, connected to the same network as
`VITE_MIDNIGHT_NETWORK`, default `preview`), then deploy a new poll or paste
an existing contract address to join one.

### Structure

```
frontend/
├── index.html
└── src/
    ├── App.tsx              # wallet connection flow + wiring
    ├── WalletCard.tsx        # connect/disconnect UI
    ├── VotingPanel.tsx        # deploy/join, vote, close poll, live results
    ├── selectWallet.ts        # reads window.midnight (DApp Connector API)
    └── lib/
        ├── browserWalletProvider.ts  # bridges ConnectedAPI → WalletProvider
        ├── providers.ts               # browser MidnightProviders factory
        └── contract.ts                 # compiled contract + fetch-based zk config
```

### Known limitation

`lib/browserWalletProvider.ts` bridges the wallet's connector API
(string-serialized transactions) to the typed `WalletProvider` interface
`midnight-js-contracts` expects. This is the one piece that couldn't be
exercised against a real wallet extension while building it — if voting
fails after connecting a wallet, check that file first; it's flagged inline
with what to look for.

---

# Future Scope

- **Mainnet deployment** once Midnight's mainnet is available for production use
- **Multi-poll registry** — a discovery contract/UI so members don't need to share contract addresses out-of-band
- **Delegate / weighted voting** — allow votes to carry different weights (e.g. token-weighted or role-based) while keeping weights private
- **Time-bound polls** — automatic closing after a deadline instead of a manual `closePoll` call
- **Wallet-delegated proving** — move proof generation to the connected wallet instead of relying on a locally-run proof server, once the corresponding SDK integration is verified
- **Result auditability tools** — exportable proofs/receipts so voters can independently verify their vote was counted, without revealing their choice
- **Mobile wallet support** — extend the Connect Wallet flow to mobile Midnight wallets
- **Multi-language UI** — translate the frontend beyond French/English for broader community adoption

---

# Technologies Used

- Midnight Network
- Compact
- TypeScript
- Vitest
- Docker
- Node.js
- Zero-Knowledge Proofs

---
