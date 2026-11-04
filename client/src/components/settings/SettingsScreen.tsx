'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import ExtraCreditsForm from './ExtraCreditsForm';
import SubscribeForm from './SubscribeForm';

type SettingsTab = 'subscribe' | 'extra';

const TABS: { value: SettingsTab; label: string; icon: string; caption: string }[] = [
  {
    value: 'subscribe',
    label: 'Subscribe for information',
    icon: 'lucide:send',
    caption:
      'Subscribe to our telegram channel to get up-to-date gaming information about your users',
  },
  {
    value: 'extra',
    label: 'Set extra credits',
    icon: 'lucide:binary',
    caption: 'Set extra credits to your users',
  },
];

/** Designs 07 + 08: two half-width tabs over one panel. */
const SettingsScreen = () => {
  const [tab, setTab] = useState<SettingsTab>('subscribe');
  const active = TABS.find((t) => t.value === tab) ?? TABS[0];

  return (
    <section className="overflow-hidden rounded-md border border-border bg-panel/95">
      <div role="tablist" className="grid grid-cols-2">
        {TABS.map((t) => {
          const selected = t.value === tab;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t.value)}
              className={cn(
                'flex h-[60px] items-center gap-3 px-5 text-left text-lg font-semibold transition-colors',
                selected
                  ? 'bg-panel text-foreground'
                  : 'bg-panel-2 text-muted hover:text-foreground',
              )}
            >
              <Icon
                icon={t.icon}
                className={cn(
                  'h-5 w-5',
                  t.value === 'subscribe' ? 'text-telegram' : 'text-foreground',
                )}
              />
              {t.label}
            </button>
          );
        })}
      </div>
      <p className="border-y border-border bg-panel-2 px-4 py-3.5 text-center text-[13px] font-semibold text-foreground">
        {active.caption}
      </p>
      <div role="tabpanel" className="px-6 py-5">
        {tab === 'subscribe' ? <SubscribeForm /> : <ExtraCreditsForm />}
      </div>
    </section>
  );
};

export default SettingsScreen;
