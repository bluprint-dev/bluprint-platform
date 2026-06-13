/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.solana.com https://*.alchemy.com https://*.pinata.cloud https://*.upstash.io https://*.phantom.app https://*.helius-rpc.com https://*.chatbase.co https://*.spline.design https://*.spline.cloud https://unpkg.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' data: https://fonts.gstatic.com;
              img-src 'self' data: blob: https: http: https://*.pinata.cloud https://*.irys.xyz https://gateway.irys.xyz https://*.arweave.net https://*.supabase.co wss://*.supabase.co;
              connect-src 'self' https://*.solana.com https://*.alchemy.com https://*.pinata.cloud https://*.upstash.io https://*.chatbase.co wss://*.solana.com wss://*.alchemy.com wss://*.walletconnect.com https://*.phantom.app https://*.helius-rpc.com wss://*.helius-rpc.com https://*.spline.design https://*.spline.cloud https://*.spline.app wss://*.spline.design wss://*.spline.cloud https://api.metaplex.com https://*.metaplex.com https://gateway.irys.xyz https://*.irys.xyz https://*.arweave.net https://*.supabase.co wss://*.supabase.co;
              frame-src 'self' https://*.phantom.app https://*.chatbase.co https://*.spline.design https://*.spline.app;
              worker-src 'self' blob:;
            `.replace(/\s+/g, ' ').trim()
          } 
        ],
      },
    ];
  },
};

module.exports = nextConfig;