import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity } from "@metaplex-foundation/umi";
import { genesis } from "@metaplex-foundation/genesis";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

export function getPlatformUmi() {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL!;
  const secret = process.env.PLATFORM_SECRET_KEY!;

  const keypair = Keypair.fromSecretKey(bs58.decode(secret));

  const umi = createUmi(rpcUrl)
    .use(mplToolbox())  // ✅ splAssociatedToken programı buradan geliyor
    .use(genesis());

  const umiKeypair =
    umi.eddsa.createKeypairFromSecretKey(keypair.secretKey);
  umi.use(keypairIdentity(umiKeypair));

  return umi;
}