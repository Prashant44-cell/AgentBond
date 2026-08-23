# AgentBond

## Wallet-authenticated stablecoin credit for autonomous AI agents

AgentBond is an outcome-backed credit and peer-to-peer stablecoin-credit platform for autonomous AI agents. It connects verified Algorand wallet identity, agent reputation, lender liquidity, and TestNet settlement so agents can access paid digital services without relying on permanently prefunded wallets.

**Stack:** React, TypeScript, Node.js, Hono, Algorand, x402, Prisma, PostgreSQL.

## Overview

Autonomous agents increasingly need to pay for APIs, data, compute, verification, and other services. A prepaid wallet stops work at a zero balance. Transaction-volume scoring also does not prove that an agent produces correct code, accurate research, or safe automation.

AgentBond lets a wallet owner authenticate, request stablecoin credit, receive lender offers, sign a Bond contract, fund and repay through verified Algorand transactions, and build reputation through useful outcomes and successful repayment.

The wallet is the financial identity. A username such as `@arjun_credit` is only the readable identity shown in the interface.

## Problem

- **Prefunding stops execution:** an agent cannot pay for an important service when its operating wallet is empty.
- **Volume is a weak credit signal:** repeated small repayments do not prove useful or safe work.
- **P2P lending needs ownership controls:** lenders need protection from fake borrowers, repeat-account abuse, false funding claims, replayed transaction IDs, and unauthorized contract actions.

## Solution

### Wallet-owned identity

Algorand wallet authentication uses a single-use nonce and exact server-issued message. The backend verifies the Ed25519 signature before creating a session. Client-submitted wallet fields are never trusted for financial ownership.

### Outcome-backed underwriting

Credit access considers repayment reliability, verified task quality, identity continuity, policy compliance, and service diversity. The score maps to 300–850 and determines risk tier, credit line, draw limit, and fee.

### Lender-borrower Bond flow

Public requests show demand and usernames. Private profiles, contracts, and chat remain limited to owners or approved participants. A lender submits an offer; both parties sign canonical terms; the lender funds; repayment is verified on Algorand.

### Blockchain-backed proof

Funding and repayment IDs are checked for sender, receiver, asset, amount, confirmation, and replay. Failed indexer verification is rejected.

## USP

AgentBond combines:

- Wallet ownership for every financial action.
- Human-readable usernames without using usernames as financial identity.
- Agent work quality as an underwriting signal.
- Public borrower demand with private contract data.
- Bilateral Bond contracts between borrowers and lenders.
- Confirmed Algorand TestNet proof for funding and repayment.
- Default controls that protect future lender capital.

## Target users and use cases

**Autonomous agents and developers:** pay for x402 APIs, data, compute, and verification; avoid zero-balance interruptions; build portable wallet credit history.

**Lenders and liquidity providers:** review public demand, make explicit offers, fund signed contracts, and verify repayment.

**Sponsors and operators:** register agents, attach reputation or sponsor context, and monitor limits, obligations, settlements, and score evolution.

## How it works

### Authentication

1. Connect an Algorand wallet.
2. Request a five-minute single-use nonce from `POST /auth/nonce`.
3. Sign the exact returned message.
4. Submit it to `POST /auth/login`.
5. Backend verifies the signature and issues a bearer session.
6. Wallet switching clears a session belonging to another wallet.
7. Logout revokes the session and clears local state.

### Borrower-to-lender Bond lifecycle

1. Authenticated borrower signs and creates a request.
2. Lenders see public terms and borrower username.
3. Authenticated lender signs and submits an offer.
4. A participant assembles canonical contract terms.
5. Assigned borrower signs the canonical contract hash.
6. Assigned lender signs the canonical contract hash.
7. Lender submits a funding transaction ID.
8. AgentBond verifies it on Algorand TestNet.
9. Only the assigned borrower can repay.
10. AgentBond verifies repayment and updates the contract and reputation.
11. Only contract participants can read private details or chat.

### x402 credit settlement

For a credit draw, the connected TestNet wallet signs and submits the USDC transfer. AgentBond only verifies the submitted transaction ID against the authenticated sender, provider receiver, TestNet USDC asset, exact amount, and confirmed round before creating the obligation. Demo borrowing is intentionally limited to micro-credit amounts such as `$0.05–$0.25 USDC` so a TestNet wallet with approximately `10 ALGO` can retain ALGO for network fees.

## Architecture

```mermaid
flowchart LR
    User[Borrower / Lender / Agent Operator]
    Wallet[Algorand Wallet<br/>Pera / Defly / Lute]
    UI[AgentBond React UI<br/>Profile · Bureau · P2P · Transactions]
    Auth[Wallet Auth<br/>Nonce · Signature · Session]
    API[Node.js + Hono API<br/>Port 4021]
    P2P[P2P Marketplace<br/>Requests · Offers · Bonds · Chat]
    Credit[Credit Handler<br/>Underwriting · Obligations · Outcomes]
    X402[x402 Middleware]
    DB[(PostgreSQL<br/>Prisma)]
    Chain[Algorand TestNet<br/>Algod + Indexer]
    Facilitator[x402 Facilitator]
    Provider[Paid API / Data / Compute Provider]

    User --> Wallet
    User --> UI
    Wallet -->|sign challenges and contracts| UI
    UI --> Auth --> API
    API --> P2P
    API --> Credit
    API --> X402
    Auth --> DB
    P2P --> DB
    Credit --> DB
    X402 --> Facilitator --> Chain
    Credit -->|confirmed USDC settlement| Chain
    Chain -->|transaction proof| Credit
    Facilitator --> Provider
```

### Contract and payment sequence

```mermaid
sequenceDiagram
    actor Borrower
    actor Lender
    participant Wallet as Algorand Wallet
    participant Web as AgentBond Web
    participant API as Hono API
    participant DB as PostgreSQL
    participant Chain as Algorand TestNet

    Borrower->>Web: Connect wallet
    Web->>API: Request nonce
    API->>DB: Store nonce and exact message
    Web->>Wallet: Sign challenge
    Web->>API: Login with signature
    API->>Chain: Verify wallet signature
    API->>DB: Create user and session

    Borrower->>Wallet: Sign request terms
    Borrower->>API: Create credit request
    API->>DB: Store borrower-owned request
    API-->>Lender: Public request with username

    Lender->>Wallet: Sign offer terms
    Lender->>API: Create offer
    API->>DB: Store offer
    Borrower->>Wallet: Sign canonical contract hash
    Lender->>Wallet: Sign canonical contract hash
    Lender->>Chain: Fund USDC
    Lender->>API: Submit funding transaction ID
    API->>Chain: Verify sender, receiver, asset, amount
    API->>DB: Mark Bond active
    Borrower->>Chain: Repay USDC
    Borrower->>API: Submit repayment transaction ID
    API->>Chain: Verify repayment
    API->>DB: Update repayment and reputation
```

## Project structure

```text
X402 (exception)/
├── README.md                         # Project guide
├── ARCHITECTURE.md                   # Extended protocol architecture
├── AgentBond logo.png                # Selected brand asset
├── backend/                           # Backend package
│   ├── index.ts                       # Hono app, routes, CORS, x402 middleware
│   ├── package.json                   # Backend scripts and dependencies
│   ├── endpoints.config.ts            # x402 pricing/configuration
│   ├── .env.example                   # Database, Algorand, settlement settings
│   ├── db.ts                          # Prisma client lifecycle
│   ├── prisma/schema.prisma           # PostgreSQL models and relations
│   ├── services/algorand-settlement.ts # Confirmed TestNet USDC settlement
│   ├── handlers/auth.ts               # Wallet auth, sessions, profiles
│   ├── handlers/p2p-marketplace.ts    # Requests, offers, Bonds, funding, chat
│   ├── handlers/agent-credit.ts       # Scoring, obligations, outcome verification
│   └── test-*.ts                      # Security, P2P, signing, E2E checks
└── frontend/projects/web/
    ├── package.json                   # React/Vite scripts
    ├── index.html                     # Browser metadata and PNG branding
    ├── public/agentbond-logo.png      # Runtime logo and favicon
    └── src/
        ├── main.tsx / App.tsx         # React bootstrap and app shell
        ├── AgentraHome.tsx             # Dashboard navigation
        ├── components/                # Profile, Bureau, P2P, Pools, Transactions
        └── utils/                     # Wallet auth, credit API, x402, network helpers
```

The product and user-facing identity are **AgentBond**.

## Local setup

### Prerequisites

- Node.js 20+
- npm 9+
- PostgreSQL 14+ for persistent mode
- Algorand TestNet wallet
- TestNet wallet with a small USDC balance for micro-payments

### Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env`:

```dotenv
DATABASE_URL="postgresql://agentbond:agentbond@localhost:5432/agentbond?schema=public"
ALGORAND_ALGOD_URL="https://testnet-api.algonode.cloud"
ALGORAND_INDEXER_URL="https://testnet-idx.algonode.cloud"
USDC_TESTNET_ASSET_ID="10458941"
```

```bash
npm run db:generate
npm run db:migrate
npm start
```

Backend default: `http://localhost:4021`.

```bash
curl http://localhost:4021/health
curl http://localhost:4021/info
curl http://localhost:4021/api/credit/bureau
```

### Frontend

```bash
cd frontend/projects/web
npm install
```

Optional `.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:4021
```

Start:

```bash
npm run dev
```

Open `http://localhost:5173` and connect a TestNet wallet.

## Testing

### Backend

```bash
cd backend
npx tsc --noEmit
npm test
npm run test:security
npm run test:e2e
```

`npm test` runs the backend type-check. `npm run test:security` exercises nonce replay, invalid signatures, wallet/session mismatch, username uniqueness, request ownership, lender authorization, funding checks, repayment checks, default handling, and blacklist behavior. The security and E2E suites require test wallets and should use confirmed TestNet transaction IDs for live settlement verification.

### Frontend

```bash
cd frontend/projects/web
npx tsc --noEmit
npm test
npm run playwright:test
```

If the Playwright browser is not installed, run `npx playwright install chromium` before `npm run playwright:test`.

## Quick Start

```bash
# Terminal 1
cd backend
npm install
copy .env.example .env
# Set DATABASE_URL
npm run db:generate
npm run db:migrate
npm start

# Terminal 2
cd frontend/projects/web
npm install
npm run dev
```

Then open `http://localhost:5173`, connect a TestNet wallet, sign in from Profile, inspect Credit Bureau, browse P2P Marketplace, and run the backend security tests. Use two separate TestNet wallets to exercise borrower/lender authorization.

Without PostgreSQL or TestNet USDC, the UI and TypeScript checks can still run. Live settlement requires a connected TestNet wallet with sufficient micro-USDC and ALGO for network fees.

## Algorand TestNet transaction evidence

AgentBond uses Algorand TestNet USDC ASA `10458941`. The configured protocol receiver is [visible on Algorand TestNet](https://testnet.explorer.perawallet.app/addr/LGMP4QUQ5RB553RZEP6TQHUQDOBJCDOYXHT5AGCAKB6B4TIE5IXA5HMKZA), and its transaction history can be queried through the [Algonode TestNet account API](https://testnet-idx.algonode.cloud/v2/accounts/LGMP4QUQ5RB553RZEP6TQHUQDOBJCDOYXHT5AGCAKB6B4TIE5IXA5HMKZA/transactions?limit=20).

Live x402 settlement IDs are generated only after a funded server wallet submits and confirms a payment. After running a settlement locally, open the returned transaction with:

- [AgentBond x402 TestNet transaction](https://testnet.explorer.perawallet.app/tx/REPLACE_WITH_CONFIRMED_TX_ID)
- [Algonode transaction lookup](https://testnet-idx.algonode.cloud/v2/transactions/REPLACE_WITH_CONFIRMED_TX_ID)

The API returns and stores the confirmed transaction ID with the obligation, provider wallet, amount, asset ID, status, and confirmation time. The repository does not fabricate a transaction hash; judges should replace `REPLACE_WITH_CONFIRMED_TX_ID` with the ID returned by their live TestNet run.

## Developer and team information

- **Project:** AgentBond
- **Team:** LotUs
- **Developer:** Prashant gupta
- **Focus:** Autonomous-agent identity, outcome-backed credit, P2P stablecoin lending, and x402 payments on Algorand
- **License:** MIT
- **Evaluation network:** Algorand TestNet

## License

Distributed under the MIT License.
