const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['next-pwa'],
  outputFileTracingRoot: path.join(__dirname),
  // Next.js 16+ Turbopack / Webpack settings
  turbopack: {},
  experimental: {
    // Disable Turbopack for builds to support next-pwa (Webpack plugin)
    forceSwcTransforms: true,
  },
};

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA(nextConfig);
