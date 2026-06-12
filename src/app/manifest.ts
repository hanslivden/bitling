import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BITLING — Virtual Pixel Pet',
    short_name: 'BITLING',
    description: 'A nostalgic pixel-art virtual pet you can check in on from work.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F0F23',
    theme_color: '#2D0A6B',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
