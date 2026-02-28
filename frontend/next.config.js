/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Autoriser les images depuis SimpleFlying et autres sources
    remotePatterns: [
      { protocol: 'https', hostname: 'simpleflying.com' },
      { protocol: 'https', hostname: '**.simpleflying.com' },
      { protocol: 'https', hostname: 'media.simpleflying.com' },
    ]
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  }
};

module.exports = nextConfig;
