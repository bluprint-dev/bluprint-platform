import { Connection } from '@solana/web3.js';

const RPC_URLS = [
  process.env.NEXT_PUBLIC_RPC_URL,
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana',
];

export async function getConnection(): Promise<Connection> {
  for (const url of RPC_URLS) {
    if (url) {
      try {
        const connection = new Connection(url, { commitment: 'confirmed' });
        await connection.getVersion();
        console.log(`Connected to RPC: ${url}`);
        return connection;
      } catch (e) {
        console.warn(`RPC failed: ${url}`);
      }
    }
  }
  throw new Error('No working RPC available');
}