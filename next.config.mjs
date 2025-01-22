/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media0.giphy.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
