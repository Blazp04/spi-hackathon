# PropertyBuild Token Platform

> Blockchain platform for tokenized real estate construction financing

## Project Overview

PropertyBuild is a decentralized platform that enables investors to participate in construction project financing through token purchases. The platform uses smart contracts to automate the entire project lifecycle - from fundraising, through construction progress tracking, to profit distribution after property sale.

### Key Features

- **Passive Investment** - Token holders are financial investors, not decision makers
- **Liquidity** - Tokens can be traded on AMM during construction
- **Transparency** - All transactions and verifications recorded on blockchain
- **Security** - Funds locked in escrow until milestone verification
- **Automatic Distribution** - Profits automatically distributed proportionally to holdings

## 🔧 Technical Standards

### ERC-1155 Multi-Token Standard

We use the **ERC-1155** standard which enables management of multiple token types within a single contract:

- **Each property has its own unique token** - One ERC-1155 token ID per real estate asset
- **NFT component** - Represents the property itself (non-fungible)
- **ERC-20-like shares** - Fungible investment tokens that can be bought and sold
- Additional Token IDs for milestone verification records
- Metadata stored on **IPFS** (project details, plans, documentation)

### Token Structure

| Token Type | Purpose | Tradeable |
|------------|---------|-----------|
| Property NFT | Represents the real estate asset | No (held by platform) |
| Investment Shares | Fractional ownership for investors | Yes (via AMM) |
| Milestone Records | Verification proof | No |

### Why ERC-1155?

| Advantage | Description |
|-----------|-------------|
| Gas Efficiency | Batch operations reduce transaction costs |
| Flexibility | Combination of fungible and non-fungible tokens |
| One Token Per Asset | Each property gets its own unique token ID |
| Fractional Ownership | Investment shares can be divided and traded |

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PropertyBuild Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ PropertyBuild│  │   Project    │  │       Escrow         │   │
│  │    Token     │  │  Lifecycle   │  │      Contract        │   │
│  │   (ERC1155)  │  │   Contract   │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Liquidity   │  │    Profit    │  │     Milestone        │   │
│  │     Pool     │  │ Distribution │  │    Verification      │   │
│  │    (AMM)     │  │              │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 👥 Roles and Access Control

| Role | Description | Permissions |
|------|-------------|-------------|
| `DEFAULT_ADMIN_ROLE` | Multi-sig wallet (3/5) | Full control, emergency override |
| `MINTER_ROLE` | Backend API wallet | Executes minting during fundraising |
| `PAUSER_ROLE` | Emergency wallet (2/3) | Halts operations |
| `BURNER_ROLE` | Profit distribution contract | Burns tokens after settlement |
| `VERIFIER_ROLE` | Inspectors, engineers | Approves milestones |
| `CONTRACTOR_ROLE` | Construction company | Submits milestone requests |
| `TREASURY_ROLE` | Platform wallet | Manages fees and escrow |
| `PROJECT_ADMIN_ROLE` | Project manager | Updates metadata |

## 📊 Project Lifecycle

```
MINTING → BUILDING → FINAL_SALE → COMPLETED
    ↓
CANCELLED (if minimum not reached)
```

### Project Phases

1. **MINTING** - Active fundraising
   - Hard cap prevents over-funding
   - Minimum threshold for automatic refund
   - Optional early-bird pricing

2. **BUILDING** - Construction in progress
   - Milestone-based payments
   - Verification by independent inspectors
   - **Tokens tradeable on AMM** - Investors can exit early via liquidity pool
   - Active trading allowed during entire construction phase

3. **FINAL_SALE** - Property listed on market
   - Construction completed, property listed for sale
   - **Trading locked** - No more AMM trading allowed
   - Funds locked until property sale completes
   - Awaiting buyer and final transaction

4. **COMPLETED** - Project closed
   - Property sold
   - **Profit redemption only** - Investors claim their proportional share
   - Tokens burned after redemption
   - Project archived

## 🔒 Security Implementations

- **Reentrancy Guards** - Protection against reentrancy attacks
- **Rate Limiting** - Prevention of flash loan attacks
- **Pausability** - Ability to halt operations in emergencies
- **Access Control** - Validation on every privileged function
- **Event Emission** - Complete audit trail

## 🔄 Milestone System

Each project is divided into phases with defined budget percentages:

1. **Site Preparation and Foundation** (20%)
2. **Structural Construction** (25%)
3. **Exterior Completion** (20%)
4. **Interior Systems and Finishes** (25%)
5. **Final Inspection and Certification** (10%)

### Verification Process

```
Contractor → Submits request → Verifiers review → 
→ Threshold reached → Automatic payment → Milestone NFT
```

## 💱 Liquidity Pool (AMM)

- Pairs: Project Token / Stablecoin (USDT/USDC)
- Initial liquidity from minting proceeds
- Locked liquidity until project completion
- Trading fee structure:
  - % for liquidity providers
  - % for platform treasury
  - Optional burn mechanism

## 📁 Project Structure

```
├── src/
│   ├── PropertyBuildToken.sol    # ERC1155 token contract
│   ├── ProjectLifecycle.sol      # Lifecycle management
│   ├── Escrow.sol                # Fund escrow
│   ├── LiquidityPool.sol         # AMM implementation
│   ├── ProfitDistribution.sol    # Profit distribution
│   └── interfaces/               # Contract interfaces
├── script/
│   └── DeployPropertyBuild.s.sol # Deployment scripts
├── test/
│   └── PropertyBuild.t.sol       # Tests
├── frontend/                     # React frontend
└── lib/
    ├── forge-std/                # Foundry standard library
    └── openzeppelin-contracts/   # OpenZeppelin contracts
```

## 🛠️ Technologies

- **Solidity** ^0.8.x - Smart contract language
- **Foundry** - Development framework
- **OpenZeppelin** - Security standards and implementations
- **IPFS** - Decentralized metadata storage
- **React** - Frontend application

## 🚀 Getting Started

```bash
# Install dependencies
forge install

# Build
forge build

# Test
forge test

# Deployment (Sepolia testnet)
forge script script/DeployPropertyBuild.s.sol --rpc-url $SEPOLIA_RPC --broadcast
```

## 📜 License

MIT License

---

*Developed for SPI Hackathon 2025*
