import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Forces Next.js to treat these as local code so it can find them
  transpilePackages: ['react-map-gl', 'mapbox-gl'],
  // This is the new way to handle Turbopack aliases in Next 16
  turbopack: {
    resolveAlias: {
      'mapbox-gl': 'mapbox-gl'
    }
  }
};

export default nextConfig;