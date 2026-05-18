"use client";

import Link from "next/link";
import { useI18n } from "../lib/i18n-provider";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold mb-3">{t("footer_bluprint")}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-gray-400 hover:text-blue-400 transition">{t("footer_about")}</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-blue-400 transition">{t("footer_faq")}</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-blue-400 transition">{t("footer_privacy")}</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-blue-400 transition">{t("footer_terms")}</Link></li>
              <li><Link href="/resources" className="text-gray-400 hover:text-blue-400 transition">{t("footer_resources")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3">{t("footer_resources")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://raydium.io" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition">
                  {t("footer_raydium")}
                </a>
              </li>
              <li>
                <a href="https://jup.ag" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition">
                  {t("footer_jupiter")}
                </a>
              </li>
              <li>
                <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition">
                  {t("footer_solscan")}
                </a>
              </li>
              <li>
                <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition">
                  {t("footer_phantom")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3">{t("footer_community")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://x.com/BluprintFun" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition">
                  {t("footer_twitter")}
                </a>
              </li>
              <li>
                <a href="https://github.com/bluprint-dev/bluprint-platform" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition">
                  {t("footer_github")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3">{t("footer_legal")}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="text-gray-400 hover:text-blue-400 transition">{t("footer_privacy")}</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-blue-400 transition">{t("footer_terms")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm">
            © 2026 BluPrint. {t("footer_rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}