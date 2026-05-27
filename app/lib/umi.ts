import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity } from '@metaplex-foundation/umi';
import { genesis } from '@metaplex-foundation/genesis';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export function getPlatformUmi() {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) throw new Error('NEXT_PUBLIC_RPC_URL not configured');

  const secretKeyBase58 = process.env.PLATFORM_SECRET_KEY;
  if (!secretKeyBase58) throw new Error('PLATFORM_SECRET_KEY not configured');

  // ✅ Base58'den Uint8Array'e çevir
  const secretKey = bs58.decode(secretKeyBase58);
  const keypair = Keypair.fromSecretKey(secretKey);
  
  const umi = createUmi(rpcUrl).use(genesis());
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(keypair.secretKey);
  umi.use(keypairIdentity(umiKeypair));
  
  return umi;
}