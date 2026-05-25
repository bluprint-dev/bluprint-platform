import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity } from '@metaplex-foundation/umi';
import { genesis } from '@metaplex-foundation/genesis';
import { Keypair } from '@solana/web3.js';

export function getPlatformUmi() {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) throw new Error('NEXT_PUBLIC_RPC_URL not configured');

  const secretKeyRaw = process.env.PLATFORM_SECRET_KEY;
  if (!secretKeyRaw) throw new Error('PLATFORM_SECRET_KEY not configured');

  const umi = createUmi(rpcUrl).use(genesis());
  const secretKey = Uint8Array.from(JSON.parse(secretKeyRaw));
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  umi.use(keypairIdentity(keypair));
  return umi;
}