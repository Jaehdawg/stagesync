import path from 'node:path';
import nextPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['next-pwa'],
  outputFileTracingRoot: path.join(process.cwd()),
  // Next.js 16+ Turbopack / Webpack settings
  turbopack: {},
  experimental: {
    // Disable Turbopack for builds to support next-pwa (Webpack plugin)
    forceSwcTransforms: true,
  },
};

const withPWA = nextPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

export default withPWA(nextConfig);
