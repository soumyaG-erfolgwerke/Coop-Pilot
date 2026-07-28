/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fra.cloud.appwrite.io',
      },
      {
        protocol: 'https',
        hostname: 'cloud.appwrite.io',
      },
    ],
    unoptimized: true,
  },
  turbopack: {},
  webpack: (config) => {
    // Handle .riv files for Rive animations
    config.module.rules.push({
      test: /\.riv$/,
      type: 'asset/resource',
    });
    return config;
  },
};

module.exports = nextConfig;
