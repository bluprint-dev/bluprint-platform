export default function TermsPage() {
  const lastUpdated = "June 18, 2026";

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-10 h-[420px] w-[420px] rounded-full bg-[#ff2d95]/10 blur-[120px]" />
        <div className="absolute top-[10%] right-10 h-[360px] w-[360px] rounded-full bg-[#7c3aed]/10 blur-[140px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Terms of Service</h1>
        <p className="text-xs text-gray-500 font-mono mb-10">Last updated: {lastUpdated}</p>

        <div className="space-y-8 text-sm text-gray-400 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using BluPrint ("the platform", "we", "us"), you agree to be
              bound by these Terms of Service. If you do not agree, do not use the platform.
              These Terms apply to all visitors and users, regardless of how they access the
              site.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">2. Nature of the Service</h2>
            <p>
              BluPrint is a non-custodial interface that allows users to create and trade
              tokens on the Solana blockchain using a bonding-curve mechanism. We do not hold,
              control, or have access to user funds, private keys, or wallets at any time. All
              transactions are executed directly on-chain through smart contracts and are
              signed by the user's own wallet.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">3. No Financial Advice</h2>
            <p>
              Nothing on this platform constitutes financial, investment, legal, or tax
              advice. Tokens created or traded through BluPrint, including meme coins, carry
              no inherent value, utility, or guarantee of any kind. You are solely responsible
              for evaluating the risks of any transaction before signing it with your wallet.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">4. Assumption of Risk</h2>
            <p>You acknowledge and accept that:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Cryptocurrency markets are highly volatile and tokens may lose all value, including to zero, at any time.</li>
              <li>Tokens created by third-party users on this platform are not vetted, endorsed, or guaranteed by BluPrint in any way.</li>
              <li>Blockchain transactions are irreversible. Once a transaction is confirmed, it cannot be undone, refunded, or reversed by us.</li>
              <li>Smart contracts, including bonding-curve mechanisms, may contain bugs or vulnerabilities despite reasonable efforts to test them.</li>
              <li>You are solely responsible for the security of your wallet, private keys, and seed phrase. We will never ask for them.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">5. Prohibited Use</h2>
            <p>You agree not to use BluPrint to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Violate any applicable law or regulation in your jurisdiction.</li>
              <li>Engage in market manipulation, fraud, or any deceptive practice.</li>
              <li>Create or promote tokens that infringe on intellectual property or impersonate real individuals or entities.</li>
              <li>Attempt to exploit, attack, or interfere with the platform's infrastructure or smart contracts.</li>
            </ul>
            <p>
              We reserve the right to restrict access to the platform for any user or activity
              we reasonably believe violates these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">6. No Warranty</h2>
            <p>
              The platform is provided on an "as is" and "as available" basis, without
              warranties of any kind, whether express or implied, including but not limited to
              warranties of merchantability, fitness for a particular purpose, or
              non-infringement. We do not guarantee that the platform will be uninterrupted,
              error-free, or secure at all times.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, BluPrint and its operators shall not be
              liable for any indirect, incidental, special, consequential, or punitive
              damages, including loss of funds, loss of profits, or loss of data, arising from
              your use of or inability to use the platform, any token created or traded
              through it, or any third-party conduct on the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">8. Fees</h2>
            <p>
              The platform may charge fees for actions such as token creation or trading.
              Current fee amounts are displayed within the relevant interface at the time of
              the transaction. Fees are non-refundable once a transaction has been confirmed
              on-chain.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">9. Third-Party Links and Tokens</h2>
            <p>
              The platform may display links to third-party websites or tokens created by
              other users. We do not control, endorse, or assume responsibility for any
              third-party content, token, or service. Your interactions with such content are
              at your own risk.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">10. Changes to These Terms</h2>
            <p>
              We may revise these Terms at any time. Continued use of the platform after
              changes are posted constitutes your acceptance of the revised Terms. We
              encourage you to review this page periodically.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">11. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a href="mailto:hello@bluprint.fun" className="text-[#ff2d95] hover:underline">
                hello@bluprint.fun
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}