/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-icons"],

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  async redirects() {
    return [
      {
        source: "/outdoor-couple-photoshoot",
        destination: "/works",
        permanent: true,
      },
      {
        source: "/films",
        destination: "/services",
        permanent: true,
      },
      {
        source: "/festivals",
        destination: "/works",
        permanent: true,
      },
      {
        source: "/baby-shower-photoshoot",
        destination: "/baby-shoot-photography-in-madurai",
        permanent: true,
      },
      {
        source: "/faq-kutti-story-photography",
        destination: "/faq",
        permanent: true,
      },
      {
        source: "/contact-us",
        destination: "/contact-us",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;