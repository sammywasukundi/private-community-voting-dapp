# Midnight Private Community Voting DApp

A privacy-preserving voting application built on the **Midnight Network** using the **Compact** smart contract language.

This project demonstrates how Zero-Knowledge technology can be used to build a secure community voting system where every member can vote privately while keeping the final result publicly verifiable.

**Live demo:** [`[TODO — add the deployed Vercel/Netlify URL here once available](https://private-community-voting-dapp-v11.vercel.app/)`](https://private-community-voting-dapp-v11.vercel.app/)
**Demo video:** https://youtu.be/YlRGxseZsG8

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
- **Double-vote prevention, handled gracefully in the UI** — a non-reversible commitment of each voter's identity is checked on-chain, without ever revealing the identity itself; the frontend recognizes a repeat-vote attempt and shows a calm explanation instead of a raw transaction error
- **Real Connect Wallet flow** — browser frontend using `@midnight-ntwrk/dapp-connector-api` to connect to a real Midnight wallet extension, including balance display and a copy-address action
- **Live results** — poll status and vote counts refresh automatically as the frontend polls the indexer, with a subtle animation whenever a figure changes
- **Deploy or join** — start a brand-new poll from the UI, or join an existing one by pasting its contract address
- **Privacy-preserving poll history** — a dedicated tab lists every poll this browser deployed or joined, showing only aggregate results (never a voter identity — see Privacy Statement below)
- **French / English UI** — a language switcher in the header, translating the whole interface
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

# Privacy Statement

This section documents, in one place, exactly what PrivateVote reveals and what it never reveals — on-chain and in the UI.

## What is public (on-chain)

Anyone can read the following at any time, directly from the contract's ledger state, with no special access:

- Poll status (`OPEN` / `CLOSED`)
- Total number of votes cast
- Number of `YES` votes
- Number of `NO` votes

This is enough for anyone to independently verify the final result without trusting the poll organizer.

## What is private (never on-chain, never in the UI)

- **Voter identity** — a voter's identity is only ever used locally, inside a witness function, to generate a Zero-Knowledge proof. The proof convinces the contract "an eligible, not-yet-voted identity cast this vote" without transmitting or storing that identity anywhere. Only a one-way commitment hash of it is ever recorded, to block a second vote from the same identity — the hash cannot be reversed to recover who voted.
- **Individual vote choice** — the contract only ever increments aggregate counters (`totalVotes`, `yesVotes`, `noVotes`); no structure anywhere maps a specific vote to a specific voter.
- **Poll history (frontend, local only)** — the History tab reads live aggregate results the same way anyone else can (`queryContractState`), and locally remembers only `{contract address, role: deployed|joined, timestamp}` in this browser's `localStorage`. It never records a choice or an identity, and none of it is shared with anyone else — it's a personal shortcut list, not a source of truth.

## What this guarantees, and what it doesn't

- ✅ No one — not other voters, not the poll organizer, not someone reading the chain — can link a vote to a person.
- ✅ Anyone can verify the tally is internally consistent (`yesVotes + noVotes == totalVotes`) without trusting the organizer.
- ✅ A given identity cannot vote twice; the commitment check happens on-chain regardless of what the frontend does.
- ⚠️ This does not anonymize network-level metadata (e.g. IP address, wallet funding history) — that is outside the scope of the contract and would require additional infrastructure (proxies, mixnets) to address.

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
    ├── App.tsx                    # wallet connection flow, tab nav, language switch
    ├── WalletCard.tsx              # connect/disconnect UI, balance, copy address
    ├── VotingPanel.tsx              # deploy/join, vote, close poll, live results
    ├── HistoryPanel.tsx              # privacy-preserving list of past polls
    ├── i18n.tsx                       # French/English provider + dictionary
    ├── Toast.tsx                       # success/error/info/warning notifications
    ├── selectWallet.ts                  # reads window.midnight (DApp Connector API)
    └── lib/
        ├── browserWalletProvider.ts  # bridges ConnectedAPI → WalletProvider
        ├── providers.ts               # browser MidnightProviders factory
        ├── contract.ts                 # compiled contract + fetch-based zk config
        ├── pollHistory.ts               # local record of deployed/joined polls
        └── voteGuard.ts                  # local "already voted" flag for the UI
```

### Deploying the frontend

A `netlify.toml` is included at the repo root (`command = "yarn build"`,
`publish = "dist-frontend"`, `NODE_VERSION = "22"`). Import the repo on
Netlify or Vercel and it should build with no extra configuration — the
deployed app is a static SPA that talks to the user's own browser wallet
and the public Preview indexer, so no server-side secrets are required.

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
- **More languages** — the UI is now translatable via `i18n.tsx`; extending beyond French/English is now just a matter of adding another dictionary entry

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
