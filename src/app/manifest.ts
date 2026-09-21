import type { MetadataRoute } from 'next';

// PWA manifest — served at /manifest.webmanifest and auto-linked in <head>.
// Fixes the Android home-screen icon showing the old white-background logo:
// without a manifest, Chrome falls back to favicon.ico; with this, it uses
// the proper transparent logo, and the maskable entries prevent Android from
// slapping a white plate behind the transparent PNG.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SmarTok Store',
    short_name: 'SmarTok Store',
    description: 'The official SmarTok store.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#00f3ff',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
