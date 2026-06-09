/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-icons"],

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
