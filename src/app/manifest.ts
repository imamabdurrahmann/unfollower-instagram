import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Unfollower Tracker',
    short_name: 'Unfollower',
    description: 'Cari tahu siapa yang nggak follback kamu di Instagram dengan aman (100% diproses di browser).',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#0f0c29',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
