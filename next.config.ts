/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-icons"],

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  // Allow large file uploads through Next.js API routes (up to 2GB body)
  experimental: {
    serverActions: {
      bodySizeLimit: "2gb",
    },
  },
};

export default nextConfig;
