/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['gateway.pinata.cloud', 'gateway.irys.xyz'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.solana.com https://*.phantom.app;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: https:;
              font-src 'self' data: https:;
              connect-src 'self' 
                https://*.solana.com 
                https://*.alchemy.com 
                https://*.pinata.cloud 
                https://*.upstash.io 
                https://*.chatbase.co 
                wss://*.solana.com 
                wss://*.alchemy.com 
                wss://*.walletconnect.com 
                https://*.phantom.app 
                https://*.helius-rpc.com 
                wss://*.helius-rpc.com 
                https://*.spline.design 
                https://*.spline.cloud 
                https://*.spline.app 
                wss://*.spline.design 
                wss://*.spline.cloud
                https://api.metaplex.com
                https://*.metaplex.com;
              frame-src 'self' https://*.phantom.app https://*.chatbase.co;
              worker-src 'self' blob:;
            `.replace(/\s+/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;