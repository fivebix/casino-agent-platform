# Agent Platform — Operator Console

A Next.js (App Router) console for the agent-platform API, built with the **same
stack as the sweepstakes back office**: Tailwind CSS v4 (CSS-variable theme),
Redux Toolkit **RTK Query** for data + cache invalidation, **react-hot-toast**
for feedback, and shadcn-style `ui/` components (`cn()`, `class-variance-authority`
variants). Forms use **react-hook-form**.

## How it works

The API requires every request to be HMAC-signed, and the signing secret must
not reach the browser. So the browser never calls the API directly:

```
Browser (app/page.tsx)
  → RTK Query (services/agentApi.ts)      shapes { method, path, body, idempotencyKey }
  → Next route handler (app/api/call/route.ts)   signs with AGENT_SIGNING_SECRET
  → agent-platform (:4100)
```

The UI shows **live created/updated data, not raw API responses**:

- A **GET `…/agents`** query feeds an **agent-tree table** (username, name,
  balance, status, nesting). It is the source of truth.
- Create / grant / withdraw are **mutations that invalidate the `Agents` tag**,
  so the table refetches and shows the new agent and new balances automatically.
- Each action pops a **toast** ("Granted 500 to mgr1 · balance 500") and appends
  to a **Recent activity** log. No JSON blobs on screen.
- Click a table row to select an agent; grant / withdraw / event act on it.

## Run

```bash
cd client
npm install
cp .env.local.example .env.local   # already present with demo values
npm run dev                        # http://localhost:3100
```

Start the agent-platform server first (`npm start` in `../server`, on :4100).
Credentials in `.env.local` must match `npm run seed` on the server.
`NEXT_PUBLIC_OPERATOR_ID` (non-secret) is the operator whose tree is shown.

## Where things live

| Path | Purpose |
|---|---|
| `services/baseApiService.ts` | base `createApi` + global-toast base query (back-office pattern) |
| `services/agentApi.ts` | endpoints via `injectEndpoints` — list / create / grant / withdraw / **update** / **delete** / event / week |
| `store/index.ts`, `components/StoreProvider.tsx` | Redux store + App Router provider |
| `components/ui/*` | shadcn-style primitives (button, card, table, input, badge) |
| `lib/utils.ts` | `cn()`, `money()`, `roleForLevel()` |
| `app/globals.css` | Tailwind v4 + the back-office token theme |
| `app/api/call/route.ts` | server-side signing proxy (secret stays here) |

## Manage agents

The agent-tree table shows a **Role** per node (Manager / Super Agent / Agent /
Sub-agent, by depth). Each row has **Edit** (rename, toggle agent-creation,
block/unblock → `PATCH`) and **Delete** (`DELETE`). A delete is refused if the
agent still has sub-agents (409) or a non-zero balance (422). Every change
invalidates the `Agents` cache tag, so the table refreshes automatically.
Players are owned by the sweepstakes platform (linked via events), so they are
not part of this agent CRUD.
