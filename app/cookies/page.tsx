"use client";

import Footer from "@/app/components/Footer";

export default function CookiesPage() {
  return (
    <div className="relative min-h-screen bg-[#0A0A0F]">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-white mb-6">Cookie Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 text-gray-300">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">1. What Are Cookies</h2>
            <p>Cookies are small text files stored on your device to enhance your browsing experience.</p>
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use Cookies</h2>
            <p>BluPrint uses only essential cookies for wallet connection and session management. We do not use tracking cookies.</p>
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-white mb-3">3. Managing Cookies</h2>
            <p>You can disable cookies in your browser settings, but this may affect wallet connectivity.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}