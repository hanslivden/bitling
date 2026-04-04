'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// Replace ca-pub-XXXXXXXXXXXXXXXX with your real AdSense publisher ID.
// Until then, the banner renders as a styled placeholder.
const PUBLISHER_ID = 'ca-pub-1848768296315827';
const AD_SLOT      = '0000000000'; // replace with your ad slot ID

export default function AdBanner() {
  const isReal = !PUBLISHER_ID.includes('XXX');

  useEffect(() => {
    if (!isReal) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [isReal]);

  if (!isReal) {
    // Development placeholder
    return (
      <div style={{
        width: 320,
        height: 50,
        background: '#1A0A30',
        border: '1px dashed #4C1D95',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-press-start)',
        fontSize: 6,
        color: '#4C1D95',
        letterSpacing: 1,
      }}>
        AD SPACE · 320×50
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', width: 320, height: 50 }}
      data-ad-client={PUBLISHER_ID}
      data-ad-slot={AD_SLOT}
      data-ad-format="fixed"
    />
  );
}
