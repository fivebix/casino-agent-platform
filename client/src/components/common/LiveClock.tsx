'use client';

import { useEffect, useState } from 'react';
import { getDisplayTimeZone } from '@/lib/timezone';

/**
 * `10/27/2026, 3:37:52 PM` in the signed-in agent's time zone, ticking every second. Renders nothing on the server
 * (no hydration mismatch).
 */
const LiveClock = () => {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const raf = requestAnimationFrame(tick);
    const timer = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
  }, []);

  return (
    <time suppressHydrationWarning className="tabular-nums">
      {now ? now.toLocaleString('en-US', { timeZone: getDisplayTimeZone() }) : ' '}
    </time>
  );
};

export default LiveClock;
