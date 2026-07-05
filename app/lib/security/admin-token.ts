// admin/verify/route.ts iÃ§indeki ADMIN_WALLETS ile AYNI listeyi burada da
// tutuyoruz (o dosyayÄ± bozmamak iÃ§in import etmek yerine kopyaladÄ±k).
// Ä°leride tek bir yerden yÃ¶netmek istersen ikisini ortak bir dosyaya taÅŸÄ±.
const ADMIN_WALLETS = [
  "aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x", // YOUR_WALLET
  "2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc", // KUZEN_WALLET
];

interface AdminTokenPayload {
  publicKey: string;
  exp: number;
}

export function verifyAdminToken(authHeader: string | null): {
  ok: boolean;
  publicKey?: string;
  error?: string;
} {
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, error: "missing_token" };
  }

  const token = authHeader.slice("Bearer ".length);

  let payload: AdminTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  } catch {
    return { ok: false, error: "invalid_token" };
  }

  if (!payload.publicKey || !payload.exp) {
    return { ok: false, error: "invalid_token" };
  }

  if (Date.now() > payload.exp) {
    return { ok: false, error: "token_expired" };
  }

  if (!ADMIN_WALLETS.includes(payload.publicKey)) {
    return { ok: false, error: "not_admin" };
  }

  return { ok: true, publicKey: payload.publicKey };
}
