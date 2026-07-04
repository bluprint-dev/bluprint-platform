export default function PrivacyPage() {
  const lastUpdated = "June 18, 2026";

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-10 h-[420px] w-[420px] rounded-full bg-[#ff2d95]/10 blur-[120px]" />
        <div className="absolute top-[10%] right-10 h-[360px] w-[360px] rounded-full bg-[#7c3aed]/10 blur-[140px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-xs text-gray-500 font-mono mb-10">Last updated: {lastUpdated}</p>

        <div className="space-y-8 text-sm text-gray-400 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">1. Overview</h2>
            <p>
              Axor ("we", "us", "the platform") provides tools for creating and trading
              tokens on the Solana blockchain. This Privacy Policy explains what information
              we collect, how we use it, and what choices you have. By using Axor, you
              agree to the practices described here.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">2. Information We Collect</h2>
            <p>
              Axor is designed to require minimal personal information. We may collect:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Public wallet addresses you connect to the platform.</li>
              <li>On-chain transaction data, which is inherently public on the Solana blockchain and not controlled by us.</li>
              <li>Basic technical data such as IP address, browser type, and device information, collected automatically for security and analytics purposes.</li>
              <li>Any information you voluntarily provide, such as an email address if you contact support.</li>
            </ul>
            <p>
              We do not require KYC, do not collect your name, and do not have access to your
              private keys, seed phrases, or wallet funds at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">3. How We Use Information</h2>
            <p>We use collected data to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Operate, maintain, and improve the platform.</li>
              <li>Detect, investigate, and prevent fraudulent or abusive activity.</li>
              <li>Comply with applicable laws and respond to legal requests where required.</li>
              <li>Communicate with you if you contact us directly.</li>
            </ul>
            <p>We do not sell your data to third parties.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">4. Blockchain Data</h2>
            <p>
              Any transaction you make through Axor is recorded on the Solana blockchain,
              which is a public, permanent, and decentralized ledger. We have no ability to
              alter, delete, or hide this data once it is confirmed on-chain. You should
              understand that wallet addresses and transaction history are publicly visible
              to anyone, independent of this platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">5. Third-Party Services</h2>
            <p>
              Axor may rely on third-party infrastructure such as RPC providers, hosting
              services, or analytics tools to operate. These providers may independently
              collect technical data (such as IP addresses) as part of delivering their
              services. We are not responsible for the privacy practices of third parties not
              under our direct control, including wallet providers and blockchain explorers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">6. Data Retention &amp; Security</h2>
            <p>
              We retain technical and usage data only for as long as necessary for the
              purposes described above. We apply reasonable technical and organizational
              measures to protect data we hold, but no method of transmission or storage is
              completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">7. Your Choices</h2>
            <p>
              You can disconnect your wallet from the platform at any time. Because most
              activity occurs on a public blockchain, certain data (such as past transactions)
              cannot be deleted or modified by us, as it is not stored on our servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Continued use of the
              platform after changes are posted constitutes acceptance of the revised policy.
              We encourage you to review this page periodically.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white text-base font-bold">9. Contact</h2>
            <p>
              For privacy-related questions, contact us at{" "}
              <a href="mailto:hello@axor.fun" className="text-[#ff2d95] hover:underline">
                hello@axor.fun
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}