'use client';

import { useEffect } from 'react';

const PHONE_UA = /iPhone|iPod|Android.+Mobile|Windows Phone/i;

/**
 * Like 50bet: after login a phone shows the 1280px desktop layout zoomed out (see the panel layout's viewport).
 * This marks phones on `<html data-device="phone">` so dialogs and the Create form can grow (globals.css). Only the
 * panel mounts it, so the login screens never get it.
 */
const PhoneMarker = () => {
  useEffect(() => {
    const ua = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
    if (!ua.userAgentData?.mobile && !PHONE_UA.test(navigator.userAgent)) return;
    document.documentElement.dataset.device = 'phone';
    return () => {
      delete document.documentElement.dataset.device;
    };
  }, []);
  return null;
};

export default PhoneMarker;
