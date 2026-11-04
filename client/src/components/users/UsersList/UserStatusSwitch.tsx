'use client';

import { Switch } from '@/components/ui/switch';
import { useUpdateUserProfileMutation } from '@/services/agentApi';
import type { UserRow } from '@/types/agent';
import { toKindPath } from './utils';

type Props = {
  row: UserRow;
  disabled?: boolean;
};

/** USER STATUS: `PATCH /agent/:kind/:id/profile { isActive }`; the list refetches through the `Users` tag. */
const UserStatusSwitch = ({ row, disabled }: Props) => {
  const [updateProfile, { isLoading }] = useUpdateUserProfileMutation();

  const onChange = (isActive: boolean) => {
    updateProfile({ kind: toKindPath(row.kind), id: row.id, body: { isActive } })
      .unwrap()
      .catch(() => {
        // The global toast shows the server message.
      });
  };

  return (
    <Switch
      checked={row.isActive}
      isLoading={isLoading}
      disabled={disabled}
      onCheckedChange={onChange}
      aria-label={`${row.isActive ? 'Deactivate' : 'Activate'} ${row.username}`}
      className="mx-auto"
    />
  );
};

export default UserStatusSwitch;
