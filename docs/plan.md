# Agent Network Feature: Plan v2

**Status:** draft for team review, 28 Oct 2026
**Companion file:** `02-questions-and-answers.md` (every question asked and every answer given, for stakeholder sign-off)

---

## 1. What we are building

A standalone **agent platform ("odryn")** for casino agents. Agents are real people with their own networks. They collect money from players offline, credit players' wallets manually, and settle with the people above them every week. They are **not AI agents**.

The agent platform is **separate** from our backoffice. It is connected to our platform through APIs, in the same way the Affnook affiliate integration works today. Our platform (3 tenants: superadmin, operator admin, players) stays the system of record for players and wallets.

Why it exists: some markets (e.g. Israel) have no legal payment solution. Money moves outside any gateway, so a manual, credit-based back office is needed.

## 2. Inputs reviewed

| Input | What it gave us |
|---|---|
| Client description | Russian-doll hierarchy, manual deposits/withdrawals/freeze, Tuesday 11:00 weekly reset, credit-based settlement |
| Figma (36 frames, "odryn Agents, 50bet 1:1 review") | Screen-by-screen design of the agent panel. The frames are captures of the prototype code |
| `odryn-agents-main` zip | React/Vite front-end prototype, sample data only, no backend. Developer guide with proposed backend contract |
| `sweepstakes-backend` (develop) | NestJS + TypeORM + Postgres. Wallet ledger, billing, Affnook integration, impersonation, audit |
| `sweepstakes` (develop), `sweepstakes-backoffice` | Player site and back office (Next.js) |

## 3. Decisions locked in

1. **Unlimited nesting.** Manager / Super Agent / Agent are display labels only.
2. **The operator admin is the root** of each operator's agent tree.
3. **Weekly cycle:** Tuesday 11:00 in each operator's own time zone.
4. **Agent players are normal players** on the existing player site. Their money comes from an untracked offline channel, not GlobalPayPro.
5. **Agent-linked players must be identifiable** in our back office.
6. **Agents cannot log in as players.** They have visibility and specific wallet, money and bet actions as shown in the Figma.
7. **Operator admin sets the credit limit** for agents (no fixed or unlimited default).
8. **Agent play counts** toward operator GGR and billing.
9. **Shares, commissions and the loss discount are in v1.**
10. **Sportsbook is deferred** to a later phase.
11. **Separate platform.** The agent app is its own product, API-integrated with the backoffice, not a section inside it.
12. **Odryn backend:** access and ownership unknown. We design the provisions (APIs, mapping, events) and do not build the odryn backend now.
13. **Weekly settlement:** each agent settles weekly. The amounts agents add and the winnings from them are reset at the weekly close. The agent platform keeps its **own separate ledger** of all these transactions.

## 4. Architecture (Affnook model)

| Affnook (exists today) | Agent platform (to build) |
|---|---|
| One brand per operator, created from our backoffice | One agent-platform tenant per operator, created from our backoffice |
| Affiliate registered through our API | Agent registered by the operator admin through our API |
| SSO link into the affiliate dashboard | SSO link into the agent's panel |
| `trackingToken` on registration attaches a player to an affiliate | Agent token on registration (or an operator-admin action) attaches a player to an agent |
| We push bets, wins, adjustments to Affnook; sync table + retry cron | The same events are pushed to the agent platform so Calc, Risk, turnover and week totals work |

**Where it differs: two-way.** Affnook is one-way. Agents also act on wallets, so the agent platform calls **into us** (credit a player, withdraw, correct, freeze). That needs a new inbound API.

### Inbound API (agent platform to us)
- Per-operator API key plus HMAC signature on every request.
- Idempotency key on every money move.
- Every call audited.
- Every query scoped to the agent's subtree.

### Money move safety
A credit move touches two systems. Our wallet is the truth for the player.
1. The agent platform calls us with an idempotency key.
2. We credit the player (existing `Transaction` ledger, new category, CASH bucket, no wagering lock).
3. The agent platform debits the agent only after our success.
4. A reconcile job compares both sides and flags mismatches.

## 5. What lives where

| Our platform | Agent platform |
|---|---|
| Players, wallets, existing ledger | Agent tree (parent pointer + path), labels, status |
| `users.agentId` (nullable) and the agent-player mapping | Agent credit accounts and a **separate ledger** of every credit move, correction, reset and settlement |
| Agent-player activity sync (bets, wins, adjustments) | Roll-ups: calc, risk, open/closed bets, turnover |
| Inbound API, reconcile job | Weekly close, snapshots, shares, discounts, commissions |
| Operator admin screens: create/manage agents, set credit limit, SSO link, agent-player tab | Agent login (username + temporary password, forced change), all panel screens |

## 6. Our-side work (backend, `sweepstakes-backend`)

- New `agent` integration module, built like `src/affnook/`: config, service, controllers, mapping + activity-sync entities, listeners on `wallet.updated`, sync scheduler.
- `users.agentId` (nullable) plus an `agent_player_mappings` table.
- Inbound API (see section 4) and reconcile job.
- Operator config: IANA `timeZone`, agent credit limit, tenant credentials (encrypted, like Affnook).
- **Agent players cut off from the crypto path.** Decide and enforce per item: GlobalPayPro deposit and manual crypto withdrawal (disabled); welcome, referral and promo bonuses and wagering locks (disabled or opt-in); Affnook activity push, KYC trigger, RG limits, spend-limit cron (review each).
- Billing: confirm agent players' play is counted in GGR and operator dues (decision 8). Verify in `billing/service/dues.service.ts`.
- Weekly close trigger: a frequent cron (every 5 to 15 min) that checks each operator's local Tuesday 11:00 and notifies the agent platform, idempotent by (operator, week). DST-safe. Needs a time zone library (`moment` is installed, but not `moment-timezone`).
- i18n: every message key must be added to all 52 locales (`keys.spec.ts` enforces this).
- Safety: `synchronize: true` and no migrations. New columns on existing tables must be nullable or have defaults. New tables are safe. Proposal: plain SQL migration scripts for this feature.

## 7. Our-side work (backoffice and player FE)

- **Backoffice (operator admin):** "Agents" area with agent list, create agent, set credit limit, open the agent panel through SSO. An **"Agent players" tab/filter and badge** in the player list. Agent-linked players are identifiable everywhere.
- **Player FE (`sweepstakes`):** hide deposit and withdraw for agent players. Work in a clean git worktree, because the current checkout has uncommitted theme changes.

## 8. Agent platform (provisions only, not built now)

Interface the agent platform must satisfy, taken from the odryn developer guide:
- Login and first-password change.
- Tree with roll-ups (`GET /agents/tree?week=`), credit moves, append-only corrections with history, block/unblock, User Edit tabs, create, bets and casino rounds, messages.
- Weekly close: settle the week, reset the agent-added amounts and their winnings, write per-node snapshots (turnover, calc, corrections, discount, agent share, company share, platform debt), apply auto weekly credit and loss discount.
- **Rule from the owner:** every total is derived up the tree from player activity. Never store an agent total separately.
- Remove from the prototype: the "log in as player" column, sportsbook screens (until the sportsbook phase), and any mention of our game aggregator's name.

## 9. Weekly close, in plain terms

Every Tuesday 11:00 (operator time zone):
1. The week is closed and a snapshot is stored per agent and player.
2. Amounts agents added and winnings from them are reset.
3. Each agent settles offline with the agent above. The platform records the settlement.
4. Auto weekly credit is applied, loss discounts are applied (only on a losing week with at least N bets), and the next week opens.
5. The agent platform's ledger keeps the full history of everything above.

### Close behaviour: operator admin setting
The operator admin chooses, per operator:
- **Continue:** play is not interrupted. Each bet and win counts in the week it happened, by timestamp.
- **Pause:** the admin sets the pause length in minutes. At the close time new bets are rejected (game launches and seamless-wallet bet callbacks), rounds already in progress are allowed to finish, then the snapshot is stored and wallets are reset. Play resumes when the pause ends.

Stored on the operator config (pause on/off, pause minutes). Sensible limits on the minutes value and a maximum wait for in-progress rounds are to be set at design time.

### Reset semantics (confirmed)
After settlement, the player's balance for the new week is **zero**, and the agent must credit them again by hand. The snapshot (closing balance and net owed) is stored before any wallet is reset. The prototype's optional "auto weekly credit" switch is not part of v1.

## 10. Phases

1. **Our side (can start now):** agent integration module (mapping, sync, inbound API), `users.agentId`, operator admin screens, agent-player tab, agent-player money-path restrictions, operator config fields, time zone and weekly close trigger.
2. **Agent platform (when ownership and access are known):** tree, login, credit ledger, panel, roll-ups, weekly close, shares and discounts.
3. **Sportsbook:** after a provider is chosen.

## 11. Still open

- Who owns and builds the odryn backend, and when.
- Sportsbook provider and capabilities.
- Whether the SSO link goes to a hosted odryn app on its own domain per operator (assumed).
- Final list of what is blocked for agent players (section 6).
