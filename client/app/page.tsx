'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, Label, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { money, orderAgentTree, roleForLevel } from '@/lib/utils';
import {
  OPERATOR_ID,
  useCloseWeekMutation,
  useCreateAgentMutation,
  useDeleteAgentMutation,
  useGrantCreditMutation,
  useListAgentsQuery,
  usePushEventMutation,
  useUpdateAgentMutation,
  useWithdrawCreditMutation,
  type AgentListItem,
} from '@/services/agentApi';

const newKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `k-${Date.now()}`;

// Errors are surfaced globally by the baseApiService toast wrapper, so form handlers
// below just swallow the rejection and skip their success path.

type Activity = { at: string; label: string; detail: string };
type Action = 'create' | 'credit' | 'withdraw' | 'event' | 'week';

const ACTIONS: { key: Action; label: string; needsTarget?: boolean }[] = [
  { key: 'create', label: '+ Create agent' },
  { key: 'credit', label: 'Grant credit', needsTarget: true },
  { key: 'withdraw', label: 'Withdraw credit', needsTarget: true },
  { key: 'event', label: 'Push event', needsTarget: true },
  { key: 'week', label: 'Weekly close' },
];

export default function Page() {
  const { data: rawAgents = [], isFetching, refetch } = useListAgentsQuery();
  const agents = useMemo(() => orderAgentTree(rawAgents), [rawAgents]);
  const [deleteAgent] = useDeleteAgentMutation();
  const [selectedId, setSelectedId] = useState<string>('');
  const [action, setAction] = useState<Action | null>(null);
  const [editing, setEditing] = useState<AgentListItem | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);

  const selected = agents.find((a) => a.id === selectedId) || null;
  const totals = useMemo(
    () => ({ count: agents.length, balance: agents.reduce((s, a) => s + (a.balance || 0), 0) }),
    [agents],
  );

  const logActivity = (label: string, detail: string) =>
    setActivity((prev) => [{ at: new Date().toLocaleTimeString(), label, detail }, ...prev].slice(0, 20));

  const closeDialog = () => setAction(null);

  async function onDelete(a: AgentListItem) {
    if (!confirm(`Delete ${roleForLevel(a.level).toLowerCase()} “${a.username}”? This cannot be undone.`)) return;
    try {
      await deleteAgent({ agentId: a.id }).unwrap();
      toast.success(`Deleted “${a.username}”`);
      logActivity('Agent deleted', a.username);
      if (selectedId === a.id) setSelectedId('');
      if (editing?.id === a.id) setEditing(null);
    } catch {
      /* surfaced globally by the baseApiService toast */
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-3">
            <h1 className="text-base font-semibold">Agent Platform</h1>
            <span className="text-xs text-muted-foreground">operator console</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="brand">{OPERATOR_ID}</Badge>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* action toolbar — each option opens a dialog */}
        <div className="mx-auto max-w-6xl px-4 pb-3 flex items-center gap-2 flex-wrap">
          {ACTIONS.map((a) => {
            const disabled = a.needsTarget && !selected;
            return (
              <Button
                key={a.key}
                variant={a.key === 'create' ? 'default' : 'secondary'}
                size="sm"
                disabled={disabled}
                title={disabled ? 'Select an agent in the table first' : undefined}
                onClick={() => setAction(a.key)}
              >
                {a.label}
              </Button>
            );
          })}
          <span className="text-xs text-muted-foreground ml-1">
            {selected ? (
              <>
                target: <span className="text-primary font-medium">{selected.username}</span> · {money(selected.balance)}
              </>
            ) : (
              'no agent selected — click a row to target credit / withdraw / event'
            )}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Agents" value={String(totals.count)} />
          <Stat label="Total credit in tree" value={money(totals.balance)} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agent tree</CardTitle>
            <CardDescription>GET /v1/tenants/{OPERATOR_ID}/agents · click a row to target actions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <AgentsTable
              agents={agents}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onEdit={setEditing}
              onDelete={onDelete}
              loading={isFetching}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>what you changed, newest first</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No actions yet. Create an agent to begin.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {activity.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{a.at}</span>
                    <Badge tone="neutral">{a.label}</Badge>
                    <span className="text-foreground">{a.detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>

      {/* ---------------- action dialogs ---------------- */}
      <Dialog open={action !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          {action === 'create' && (
            <CreateAgentPanel
              agents={agents}
              selected={selected}
              onClose={closeDialog}
              onDone={(a, parentName) => {
                setSelectedId(a.id);
                logActivity('Agent created', `${a.username}${parentName ? ` under ${parentName}` : ' (top-level)'}`);
              }}
            />
          )}
          {action === 'credit' && selected && (
            <CreditPanel selected={selected} onClose={closeDialog} onDone={(d) => logActivity('Credit granted', d)} />
          )}
          {action === 'withdraw' && selected && (
            <WithdrawPanel selected={selected} onClose={closeDialog} onDone={(d) => logActivity('Credit withdrawn', d)} />
          )}
          {action === 'event' && selected && (
            <EventPanel selected={selected} onClose={closeDialog} onDone={(d) => logActivity('Event pushed', d)} />
          )}
          {action === 'week' && <WeekPanel onClose={closeDialog} onDone={(d) => logActivity('Week close notice', d)} />}
        </DialogContent>
      </Dialog>

      {/* ---------------- edit dialog ---------------- */}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing && (
            <EditAgentPanel
              key={editing.id}
              agent={editing}
              onClose={() => setEditing(null)}
              onDone={(d) => logActivity('Agent updated', d)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------------------------- pieces ---------------------------------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold mt-1 tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function AgentsTable({
  agents,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  loading,
}: {
  agents: AgentListItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onEdit: (a: AgentListItem) => void;
  onDelete: (a: AgentListItem) => void;
  loading: boolean;
}) {
  if (!loading && agents.length === 0) {
    return <div className="p-6 text-sm text-muted-foreground">No agents yet — use “Create agent” above.</div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Creates</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((a) => (
          <TableRow
            key={a.id}
            data-state={a.id === selectedId ? 'selected' : undefined}
            className="cursor-pointer"
            onClick={() => onSelect(a.id)}
          >
            <TableCell>
              <div className="flex items-center" style={{ paddingLeft: Math.max(0, a.level - 1) * 16 }}>
                {a.level > 1 && <span className="text-muted-foreground mr-1">└</span>}
                <div className="flex flex-col">
                  <span className="font-medium leading-tight">{a.username}</span>
                  {a.name && <span className="text-xs text-muted-foreground leading-tight">{a.name}</span>}
                </div>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{roleForLevel(a.level)}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{money(a.balance)}</TableCell>
            <TableCell>
              <Badge tone={a.status === 'active' ? 'success' : 'danger'}>{a.status}</Badge>
            </TableCell>
            <TableCell>
              <Badge tone={a.canCreateAgents ? 'brand' : 'neutral'}>{a.canCreateAgents ? 'yes' : 'no'}</Badge>
            </TableCell>
            <TableCell className="text-right whitespace-nowrap">
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(a);
                }}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="xs"
                className="ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(a);
                }}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TargetLine({ selected }: { selected: AgentListItem }) {
  return (
    <div className="text-xs text-muted-foreground mb-2">
      target: <span className="text-primary font-medium">{selected.username}</span> · balance {money(selected.balance)}
    </div>
  );
}

/* --------------------------------- dialogs --------------------------------- */

function CreateAgentPanel({
  agents,
  selected,
  onClose,
  onDone,
}: {
  agents: AgentListItem[];
  selected: AgentListItem | null;
  onClose: () => void;
  onDone: (a: AgentListItem, parentName: string | null) => void;
}) {
  const [createAgent, { isLoading }] = useCreateAgentMutation();
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: { username: '', name: '', tempPassword: 'Temp123!', creditLimit: '1000', parentAgentId: '' },
  });

  // Pre-fill the parent from the current selection; the dropdown is the source of truth.
  useEffect(() => {
    setValue('parentAgentId', selected ? selected.id : '');
  }, [selected, setValue]);

  const isTopLevel = !watch('parentAgentId');

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create agent</DialogTitle>
        <DialogDescription>POST /v1/tenants/{OPERATOR_ID}/agents</DialogDescription>
      </DialogHeader>
      <form
        onSubmit={handleSubmit(async (v) => {
          const parentAgentId = v.parentAgentId || undefined;
          try {
            const agent = await createAgent({
              username: v.username,
              name: v.name || undefined,
              tempPassword: v.tempPassword,
              ...(parentAgentId ? { parentAgentId } : { creditLimit: Number(v.creditLimit) }),
              idempotencyKey: newKey(),
            }).unwrap();
            const parentName = parentAgentId ? agents.find((a) => a.id === parentAgentId)?.username ?? null : null;
            toast.success(`Agent “${agent.username}” created${parentName ? ` under ${parentName}` : ' (top-level)'}`);
            onDone(agent, parentName);
            onClose();
          } catch {
            /* surfaced globally by the baseApiService toast */
          }
        })}
      >
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Username</Label>
            <Input placeholder="mgr1" {...register('username', { required: true })} />
          </div>
          <div>
            <Label>Name</Label>
            <Input placeholder="Manager One" {...register('name')} />
          </div>
        </div>
        <Label>Temp password</Label>
        <Input {...register('tempPassword', { required: true })} />

        <Label>Parent agent</Label>
        <Select {...register('parentAgentId')}>
          <option value="">Top-level (operator)</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {'— '.repeat(Math.max(0, a.level - 1))}
              {a.username}
            </option>
          ))}
        </Select>

        {isTopLevel && (
          <>
            <Label>Operator credit limit (top-level)</Label>
            <Input {...register('creditLimit')} inputMode="decimal" />
          </>
        )}

        <DialogActions>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? 'Creating…' : isTopLevel ? 'Create top-level agent' : 'Create sub-agent'}
          </Button>
        </DialogActions>
      </form>
    </>
  );
}

function CreditPanel({
  selected,
  onClose,
  onDone,
}: {
  selected: AgentListItem;
  onClose: () => void;
  onDone: (d: string) => void;
}) {
  const [grant, { isLoading }] = useGrantCreditMutation();
  const { register, handleSubmit } = useForm({ defaultValues: { amount: '500', comment: 'weekly float' } });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Grant credit</DialogTitle>
        <DialogDescription>POST /agents/{selected.id}/credit</DialogDescription>
      </DialogHeader>
      <TargetLine selected={selected} />
      <form
        onSubmit={handleSubmit(async (v) => {
          try {
            const r = await grant({
              agentId: selected.id,
              amount: Number(v.amount),
              comment: v.comment || undefined,
              idempotencyKey: newKey(),
            }).unwrap();
            toast.success(`Granted ${money(Number(v.amount))} to ${selected.username} · balance ${money(r.balance)}`);
            onDone(`${selected.username} +${money(Number(v.amount))} → ${money(r.balance)}`);
            onClose();
          } catch {
            /* surfaced globally by the baseApiService toast */
          }
        })}
      >
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Amount</Label>
            <Input {...register('amount', { required: true })} inputMode="decimal" />
          </div>
          <div>
            <Label>Comment</Label>
            <Input {...register('comment')} />
          </div>
        </div>
        <DialogActions>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? 'Granting…' : 'Grant credit'}
          </Button>
        </DialogActions>
      </form>
    </>
  );
}

function WithdrawPanel({
  selected,
  onClose,
  onDone,
}: {
  selected: AgentListItem;
  onClose: () => void;
  onDone: (d: string) => void;
}) {
  const [withdraw, { isLoading }] = useWithdrawCreditMutation();
  const { register, handleSubmit } = useForm({ defaultValues: { amount: '200', comment: '' } });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Withdraw credit</DialogTitle>
        <DialogDescription>POST /agents/{selected.id}/withdraw</DialogDescription>
      </DialogHeader>
      <TargetLine selected={selected} />
      <form
        onSubmit={handleSubmit(async (v) => {
          try {
            const r = await withdraw({
              agentId: selected.id,
              amount: Number(v.amount),
              comment: v.comment || undefined,
              idempotencyKey: newKey(),
            }).unwrap();
            toast.success(`Withdrew ${money(Number(v.amount))} from ${selected.username} · balance ${money(r.balance)}`);
            onDone(`${selected.username} −${money(Number(v.amount))} → ${money(r.balance)}`);
            onClose();
          } catch {
            /* surfaced globally by the baseApiService toast */
          }
        })}
      >
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Amount</Label>
            <Input {...register('amount', { required: true })} inputMode="decimal" />
          </div>
          <div>
            <Label>Comment</Label>
            <Input {...register('comment')} />
          </div>
        </div>
        <DialogActions>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" variant="outline" disabled={isLoading}>
            {isLoading ? 'Withdrawing…' : 'Withdraw credit'}
          </Button>
        </DialogActions>
      </form>
    </>
  );
}

function EventPanel({
  selected,
  onClose,
  onDone,
}: {
  selected: AgentListItem;
  onClose: () => void;
  onDone: (d: string) => void;
}) {
  const [pushEvent, { isLoading }] = usePushEventMutation();
  const { register, handleSubmit } = useForm({
    defaultValues: { eventId: 'e1', type: 'bet', playerId: 'p1', amount: '10' },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Push activity event</DialogTitle>
        <DialogDescription>POST /v1/events</DialogDescription>
      </DialogHeader>
      <TargetLine selected={selected} />
      <form
        onSubmit={handleSubmit(async (v) => {
          try {
            await pushEvent({
              eventId: v.eventId,
              type: v.type,
              playerId: v.playerId,
              agentId: selected.id,
              amount: Number(v.amount),
              occurredAt: new Date().toISOString(),
            }).unwrap();
            toast.success(`Event ${v.type} accepted for ${v.playerId}`);
            onDone(`${v.type} ${money(Number(v.amount))} · ${v.playerId} @ ${selected.username}`);
            onClose();
          } catch {
            /* surfaced globally by the baseApiService toast */
          }
        })}
      >
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Event id</Label>
            <Input {...register('eventId', { required: true })} />
          </div>
          <div>
            <Label>Type</Label>
            <Select {...register('type')}>
              <option>bet</option>
              <option>win</option>
              <option>refund</option>
              <option>adjustment</option>
              <option>player_linked</option>
            </Select>
          </div>
          <div>
            <Label>Player id</Label>
            <Input {...register('playerId', { required: true })} />
          </div>
          <div>
            <Label>Amount</Label>
            <Input {...register('amount')} inputMode="decimal" />
          </div>
        </div>
        <DialogActions>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" variant="secondary" disabled={isLoading}>
            {isLoading ? 'Sending…' : 'Send event'}
          </Button>
        </DialogActions>
      </form>
    </>
  );
}

function WeekPanel({ onClose, onDone }: { onClose: () => void; onDone: (d: string) => void }) {
  const [closeWeek, { isLoading }] = useCloseWeekMutation();
  const { register, handleSubmit } = useForm({
    defaultValues: { weekId: '2026-W44', timeZone: 'Asia/Jerusalem', pauseMinutes: '0' },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Weekly close notice</DialogTitle>
        <DialogDescription>POST /v1/weeks/:id/closing</DialogDescription>
      </DialogHeader>
      <form
        onSubmit={handleSubmit(async (v) => {
          try {
            await closeWeek({
              weekId: v.weekId,
              closeAt: new Date().toISOString(),
              timeZone: v.timeZone,
              pauseMinutes: Number(v.pauseMinutes),
            }).unwrap();
            toast.success(`Close notice recorded for ${v.weekId}`);
            onDone(`${v.weekId} · ${v.timeZone}`);
            onClose();
          } catch {
            /* surfaced globally by the baseApiService toast */
          }
        })}
      >
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Week id</Label>
            <Input {...register('weekId', { required: true })} />
          </div>
          <div>
            <Label>Pause minutes</Label>
            <Input {...register('pauseMinutes')} inputMode="numeric" />
          </div>
        </div>
        <Label>Time zone</Label>
        <Input {...register('timeZone')} />
        <DialogActions>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" variant="secondary" disabled={isLoading}>
            {isLoading ? 'Sending…' : 'Send close notice'}
          </Button>
        </DialogActions>
      </form>
    </>
  );
}

function EditAgentPanel({
  agent,
  onClose,
  onDone,
}: {
  agent: AgentListItem;
  onClose: () => void;
  onDone: (detail: string) => void;
}) {
  const [updateAgent, { isLoading }] = useUpdateAgentMutation();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: agent.name ?? '',
      canCreateAgents: agent.canCreateAgents ? 'yes' : 'no',
      status: agent.status === 'blocked' ? 'blocked' : 'active',
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          Edit {roleForLevel(agent.level).toLowerCase()} · {agent.username}
        </DialogTitle>
        <DialogDescription>PATCH /agents/{agent.id}</DialogDescription>
      </DialogHeader>
      <form
        onSubmit={handleSubmit(async (v) => {
          try {
            const updated = await updateAgent({
              agentId: agent.id,
              name: v.name || undefined,
              canCreateAgents: v.canCreateAgents === 'yes',
              status: v.status as 'active' | 'blocked',
            }).unwrap();
            toast.success(`Updated “${updated.username}”`);
            onDone(`${updated.username} · ${updated.status} · creates ${updated.canCreateAgents ? 'yes' : 'no'}`);
            onClose();
          } catch {
            /* surfaced globally by the baseApiService toast */
          }
        })}
      >
        <Label>Display name</Label>
        <Input {...register('name')} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Can create agents</Label>
            <Select {...register('canCreateAgents')}>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select {...register('status')}>
              <option value="active">active</option>
              <option value="blocked">blocked</option>
            </Select>
          </div>
        </div>
        <DialogActions>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogActions>
      </form>
    </>
  );
}

function DialogActions({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2 mt-4">{children}</div>;
}
