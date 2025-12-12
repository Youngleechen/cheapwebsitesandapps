import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'tnkyerocqvjgkzlhdxmc.supabase.co',
      'images.unsplash.com', // ← Add this line
    ],
  },
};

export default nextConfig;