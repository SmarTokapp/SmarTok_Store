import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel's /_next/image optimizer returns 402
    // (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED) on this plan — every
    // optimized request fails and product cards render a broken-image box.
    // Serve Printify CDN URLs directly instead.
    unoptimized: true,
    remotePatterns: [
      // Printify product mockup images
      { protocol: "https", hostname: "images.printify.com" },
      { protocol: "https", hostname: "images-api.printify.com" },
      // Google Sign-In avatars (lh3/lh4/... subdomains)
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
