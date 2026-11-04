# odryn agent panel (client)

Next.js 16 / React 19 frontend for casino agents who manage players on credit. It follows the
conventions of `sweepstakes-backoffice` (see its `AGENTS.md`): arrow components, `type Props`, RTK Query
only, the modal aggregator, Tailwind v4.

API contract: `sweepstakes-backend/docs/agent-network-api.md`.

## Run

```bash
cp .env.example .env.local   # then edit
npm install
npm run dev                  # http://localhost:3005
```

| Script                            | What it does                       |
| --------------------------------- | ---------------------------------- |
| `npm run dev` / `build` / `start` | Next on port 3005                  |
| `npm run lint` / `lint:fix`       | ESLint (next core-web-vitals + TS) |
| `npm run typecheck`               | `tsc --noEmit`                     |
| `npm run format` / `format:check` | Prettier                           |

## Env

| Variable                                                | Purpose                                                                                                                                                                                                          |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                                   | Backend base URL. The browser calls same-origin `/api/*`; `next.config.ts` rewrites it to `${NEXT_PUBLIC_API_URL}/api/*`, so the httpOnly `agent_access_token` / `agent_refresh_token` cookies stay first-party. |
| `NEXT_PUBLIC_DEFAULT_SUBDOMAIN`                         | Operator subdomain used on `localhost` / an IP. On `brand.localhost:3005` or `brand.<domain>` the host wins.                                                                                                     |
| `NEXT_PUBLIC_ODRYN_URL`                                 | "Back to odryn" link (optional).                                                                                                                                                                                 |
| `NEXT_PUBLIC_TELEGRAM_URL` / `NEXT_PUBLIC_WHATSAPP_URL` | Top-bar contact icons (optional).                                                                                                                                                                                |

## How it fits together

- **Tenant**: `src/proxy.ts` reads the subdomain from the Host header and writes the `agent_tenant` cookie →
  `TenantManagerLayout` calls `GET /api/operator/resolve/:subdomain` → `tenantSlice.operator`. Public auth
  calls send `operator.id` as `operatorId`.
- **Auth**: login fills `authSlice` (persisted). `AuthGuardLayout` (route group `(protected)`) sends
  signed-out users to `/login` and forces `/first-login` while `mustChangePassword`. On any 401,
  `baseApiService` runs one mutex-guarded `POST /agent/auth/refresh`; if that fails it logs out.
- **Toasts**: `baseApiService` toasts `data.message` on errors and on mutation success. Pass
  `extraOptions: { preventGlobalToast: true }` to silence one call.

## Folder map

```
src/
  app/
    (guest)/          login, reset-password        (GuestGuardLayout + AuthScreenLayout)
    (protected)/      first-login                  (AuthGuardLayout)
      (panel)/        users, bets, bets-online, casino, chance, create, settings, live  (AppLayout)
    layout.tsx        Redux + tenant + Toaster + ModalAggregator
  components/
    ui/               primitives: button, input, select, checkbox, switch, roleBadge, statusPill,
                      tabs (TabsBar), keyValuePanel, dialog, dropdownMenu
    common/           PageCard, WeekSwitcher, ProductTabs, SearchBox, StateMessage, Spinner,
                      LiveClock, OdrynLogo, ScreenPlaceholder
    form/             FormRow, AuthField, PasswordChecklist, TenantNotice, LoginForm/,
                      FirstLoginForm/, ResetPasswordForm/
    modals/           index.tsx (aggregator), types.ts (MODAL_TYPES), ModalShell/, BalanceModal,
                      ForgotPasswordModal/
    tables/           CommonTable (index.tsx), cellRenderers (AmountCell, UserCell)
  layouts/            AppLayout/ (TopBar, NavBar, Footer, menus), AuthGuardLayout, GuestGuardLayout,
                      AuthScreenLayout, TenantManagerLayout, ReduxPersistLayout
  hooks/              useReduxHooks, useAuth, useTenant, useModal, useLogout, useDebounce, useResetEmail
  lib/                utils (cn), format, week, tenant, constants
  services/           baseApiService.ts, agentApi.ts (every contract endpoint)
  slices/             auth (+authActions), app, tenant, modal
  store/              store + redux-persist (whitelist: auth, app)
  types/              agent.ts (contract types), common.ts
```

## Add a screen

1. Replace the placeholder in `src/app/(protected)/(panel)/<route>/page.tsx`. Keep `page.tsx` thin; put
   the screen in `components/` (a folder with `index.tsx` / `type.ts` / `schema.ts` when it has a form).
2. Wrap it in `<PageCard title icon>`; use `WeekSwitcher`, `ProductTabs`, `SearchBox`, `CommonTable`,
   `KeyValuePanel` from the kit.
3. Fetch with the hooks from `@/services/agentApi` (e.g. `useGetUsersQuery({ weekStart, product })`). They
   return the unwrapped `data`. Show `isLoading` / `isError` (+ `refetch`) / empty states — `CommonTable`
   takes `isLoading`, `isError`, `onRetry`, `emptyState`; elsewhere use `<StateMessage>`.
4. A new nav item goes in `src/layouts/AppLayout/navigation.ts`.

A new endpoint goes in `services/agentApi.ts` (`build.query` / `build.mutation` with
`transformResponse: unwrap`, tags from `TAGS` in `baseApiService.ts`), with its types in `types/agent.ts`.

## Add a modal

1. Create `src/components/modals/MyModal.tsx` (or a folder) taking `ModalBaseProps & { ...yourProps }`
   and rendering `<ModalShell isOpen onClose title onSave|formId isSaving>…</ModalShell>`.
2. In `components/modals/types.ts` add `MY_MODAL` to `MODAL_TYPES` and its props to `ModalPropsMap`.
3. In `components/modals/index.tsx` add a `dynamic(() => import(...), { ssr: false })` and register it in
   `MODAL_COMPONENTS`.
4. Open it: `const { open } = useModal(); open(MODAL_TYPES.MY_MODAL, { userId })`. Props live in Redux,
   so pass ids and plain values, never callbacks.
