# Agent Feature: Questions and Answers Log

For stakeholder verification of direction. Date: 28 Oct 2026.
**How to use:** read each answer. If anything is wrong, mark it and send it back. Status: **Confirmed** = stated by the product owner. **Assumed** = my reading, needs a yes/no.

---

## A. First round: scoping questions

| # | Question | Answer | Status |
|---|---|---|---|
| A1 | How deep can the agent hierarchy go: unlimited, or the prototype's fixed four levels (Manager, Super Agent, Agent, Player)? | Unlimited. | Confirmed |
| A2 | Scope: casino only, or sportsbook too? | Both. Later clarified: **sportsbook can come later.** | Confirmed |
| A3 | Who is at the top of the tree: operator admin or superadmin? | Operator admin. | Confirmed |
| A4 | Which time zone does the Tuesday 11:00 reset use? | The time zone of the country each operator admin runs in. | Confirmed |
| A5 | Are agent-run players normal players on the existing site? | Yes, normal players. Their winnings and wallet balance are managed outside: the money does not come from GlobalPayPro but from an untracked channel, handled directly by the operator admin side. | Confirmed |
| A6 | Are shares, commissions and the loss discount in v1? | Yes, keep them. | Confirmed |

## B. Second round: architecture and rules

| # | Question | Answer | Status |
|---|---|---|---|
| B1 | Where does the agent panel live? | Separate standalone app, API-integrated with the backoffice, not inside it. | Confirmed |
| B2 | How should the integration work? | Like Affnook: operator admin creates agent logins; agents log into their own dashboard on the other platform. Same functionality in the existing operator admin for odryn's agents. | Confirmed |
| B3 | Can agents log in as players? | No. Agents have visibility and certain wallet, money and bet actions as shown in the prototype and Figma. | Confirmed |
| B4 | Should agent players' casino play count toward operator GGR and billing? | Yes. | Confirmed |
| B5 | Should agent-linked players be identifiable? | Yes. Keep an identification or tab on agent-connected players. | Confirmed |
| B6 | Is the operator admin's credit to top-level agents unlimited? | No. Always limited, and the operator admin decides the limit. | Confirmed |
| B7 | Where does the agent panel live (own app vs backoffice)? | Own app (same as B1). | Confirmed |
| B8 | Does the odryn backend exist, and who builds it? | Unknown; no access right now. Leave provisions only. | Confirmed |
| B9 | What happens to wallets at the weekly reset? | The amounts added by the agent and the winnings from those are reset; each agent settles weekly. A separate ledger of all these transactions is kept on the new platform. | Confirmed (wording). **Assumed:** reset means zero, with the net amount owed handled in settlement, not a return to a weekly base |
| B10 | Is a git worktree OK for the player FE (it has uncommitted changes)? | Yes. | Confirmed |
| B11 | Explain the `synchronize: true` / no migrations risk before acting. | Explained in the plan (section 6). User asked for the explanation; no objection recorded. | Confirmed |

## B2. Third round: reset and close behaviour

| # | Question | Answer | Status |
|---|---|---|---|
| B12 | Which paths are blocked for agent players (GlobalPayPro deposit, crypto withdrawal, welcome/referral/promo bonuses, wagering locks, KYC trigger, RG limits)? | All of them. | Confirmed |
| B13 | After the weekly close, does a player start the new week at zero, or at a fixed starting amount? | Option 1: zero. The player starts the new week at 0 and the agent must credit them again. | Confirmed |
| B14 | What happens to play at the close time? | The operator admin chooses: continue (events count in the week they happened) or pause for a chosen number of minutes. | Confirmed |

## C. Source facts from the client description

- Built for markets without a legal payment solution (e.g. Israel). It is the main back office for such sites.
- Example: a player hands over $100, the agent updates the player's balance manually.
- Russian-doll hierarchy: super admin creates agents, agents create agents, every agent can create players, deposit, withdraw and freeze accounts.
- All balances in the agent system reset every Tuesday at 11:00. Most of the money is credit: each Tuesday the agent collects from players and from sub-agents.

## D. Items for stakeholders to verify

1. (Resolved, B9/B13) Reset means zero. The net owed is settled offline and recorded. The player starts the new week at 0.
2. (Resolved, B12) All listed paths are blocked for agent players.
3. Who owns and builds the odryn backend, and by when?
4. Does each operator get its own hosted odryn tenant and domain (SSO link, like Affnook)?
5. Sportsbook provider and timeline.
6. Credit limit: set per agent, per level, or one limit for the whole tree?

## E. Known risks

- The agent platform has no backend yet; our side can only be built against an agreed contract.
- Credit moves touch two systems; idempotency and reconciliation are required.
- The backend has no migrations, so changes to existing tables are constrained.
- No sportsbook exists in the backend today.
