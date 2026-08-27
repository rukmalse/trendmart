import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // output: 'export', // <--- මේක සම්පූර්ණයෙන්ම අයින් කරන්න (Comment out කරන්න හෝ මකන්න)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig