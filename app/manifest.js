export default function manifest() {
  return {
    name: 'MJ FASHION WORLD',
    short_name: 'MJ Store',
    description: 'Shop the latest styles for Boys, Girls, Children, Men & Women. Pay with UPI and track orders.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#7c4a1e',
    categories: ['shopping', 'fashion'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}