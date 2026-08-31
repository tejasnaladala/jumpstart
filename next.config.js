/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

module.exports = nextConfig;
