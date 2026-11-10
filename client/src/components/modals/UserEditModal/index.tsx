'use client';

import { useState } from 'react';
import ModalShell from '@/components/modals/ModalShell';
import StateMessage from '@/components/common/StateMessage';
import { Button } from '@/components/ui/button';
import { TabsBar } from '@/components/ui/tabs';
import { formatTimeDate } from '@/lib/format';
import {
  useGetUserDetailQuery,
  useSendUserMessageMutation,
  useUpdateUserLimitsMutation,
  useUpdateUserModulesMutation,
  useUpdateUserNotifyMutation,
  useUpdateUserProfileMutation,
  useUpdateUserSettingsMutation,
  useUpdateUserSharesMutation,
} from '@/services/agentApi';
import { SAVE_CACHE_KEY, TAB_FORM_ID, USER_EDIT_TABS } from './constants';
import LimitsTab from './LimitsTab';
import MessagesTab from './MessagesTab';
import ModulesTab from './ModulesTab';
import NotifyTab from './NotifyTab';
import ProfileTab from './ProfileTab';
import SettingsTab from './SettingsTab';
import SharesTab from './SharesTab';
import type { TabProps, UserEditModalProps, UserEditTab } from './type';

const TAB_COMPONENTS: Record<UserEditTab, (props: TabProps) => React.ReactNode> = {
  profile: ProfileTab,
  settings: SettingsTab,
  limits: LimitsTab,
  messages: MessagesTab,
  modules: ModulesTab,
  notify: NotifyTab,
  shares: SharesTab,
};

/** Reads each tab's save state through the shared `fixedCacheKey` (the tab itself fires the request). */
const useSavingState = (): Record<UserEditTab, boolean> => {
  const [, profile] = useUpdateUserProfileMutation({ fixedCacheKey: SAVE_CACHE_KEY.profile });
  const [, settings] = useUpdateUserSettingsMutation({ fixedCacheKey: SAVE_CACHE_KEY.settings });
  const [, limits] = useUpdateUserLimitsMutation({ fixedCacheKey: SAVE_CACHE_KEY.limits });
  const [, messages] = useSendUserMessageMutation({ fixedCacheKey: SAVE_CACHE_KEY.messages });
  const [, modules] = useUpdateUserModulesMutation({ fixedCacheKey: SAVE_CACHE_KEY.modules });
  const [, notify] = useUpdateUserNotifyMutation({ fixedCacheKey: SAVE_CACHE_KEY.notify });
  const [, shares] = useUpdateUserSharesMutation({ fixedCacheKey: SAVE_CACHE_KEY.shares });
  return {
    profile: profile.isLoading,
    settings: settings.isLoading,
    limits: limits.isLoading,
    messages: messages.isLoading,
    modules: modules.isLoading,
    notify: notify.isLoading,
    shares: shares.isLoading,
  };
};

/**
 * Designs 10–15, 25, 36. `GET /agent/:kind/:id` fills every tab; each tab saves to its own endpoint through
 * the shell's Save button (`formId` of the active tab). Open with
 * `open(MODAL_TYPES.USER_EDIT, { kind: 'agents', id, username })`.
 */
const UserEditModal = ({ isOpen, onClose, kind, id, username }: UserEditModalProps) => {
  const [tab, setTab] = useState<UserEditTab>('profile');
  const { data, isLoading, isError, refetch } = useGetUserDetailQuery(
    { kind, id },
    { refetchOnMountOrArgChange: true },
  );
  const saving = useSavingState();

  const name = data?.username ?? username;
  const formId = TAB_FORM_ID[tab];
  const ready = !!data;
  const Tab = TAB_COMPONENTS[tab];

  const limitsFooter = (
    <div className="flex items-center justify-center gap-[120px]">
      <Button variant="secondary" size="sm" type="reset" form={formId} disabled={!ready}>
        Reset
      </Button>
      <Button
        variant="primary"
        size="lg"
        type="submit"
        form={formId}
        isLoading={saving.limits}
        disabled={!ready}
      >
        Save
      </Button>
      <Button variant="secondary" size="lg" onClick={onClose}>
        Close
      </Button>
    </div>
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={`User Edit ${name}`}
      subtitle={
        data ? (
          <>
            {data.username}
            <span className="ml-2">[{formatTimeDate(data.createdAt)}]</span>
          </>
        ) : undefined
      }
      formId={formId}
      saveLabel={tab === 'messages' ? 'Send' : 'Save'}
      isSaving={saving[tab]}
      saveDisabled={!ready}
      footer={tab === 'limits' ? limitsFooter : undefined}
      bodyClassName="pt-0"
    >
      <div className="sticky top-0 z-10 -mx-7 bg-panel px-7 pb-5 pt-5">
        <TabsBar
          // A player's Shares tab held only the (commented-out) loss discount, so players don't get it.
          items={
            kind === 'players' ? USER_EDIT_TABS.filter((t) => t.value !== 'shares') : USER_EDIT_TABS
          }
          value={tab}
          onChange={setTab}
        />
      </div>
      {isLoading ? (
        <StateMessage variant="loading" />
      ) : isError || !data ? (
        <StateMessage variant="error" message="Could not load this user" onRetry={refetch} />
      ) : (
        <Tab key={tab} kind={kind} id={id} detail={data} formId={formId} />
      )}
    </ModalShell>
  );
};

export default UserEditModal;
