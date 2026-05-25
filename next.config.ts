import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.solana.com https://*.alchemy.com https://*.pinata.cloud https://*.upstash.io https://*.phantom.app https://*.helius-rpc.com https://*.chatbase.co https://*.spline.design https://*.spline.cloud https://unpkg.com blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https: https://*.chatbase.co https://*.spline.design https://*.spline.cloud; connect-src 'self' https://*.solana.com https://*.alchemy.com https://*.pinata.cloud https://*.upstash.io https://*.chatbase.co wss://*.solana.com wss://*.alchemy.com wss://*.walletconnect.com https://*.phantom.app https://*.helius-rpc.com wss://*.helius-rpc.com https://*.spline.design https://*.spline.cloud https://*.spline.app wss://*.spline.design wss://*.spline.cloud; frame-src 'self' https://*.phantom.app https://*.chatbase.co https://*.spline.design https://*.spline.app; worker-src 'self' blob:;"
          }
        ],
      },
    ];
  },
};

export default nextConfig;