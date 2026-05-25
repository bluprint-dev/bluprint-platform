"use client";

import { motion } from "framer-motion";
import { Shield, Lock, FileCheck, Clock, Users, CheckCircle } from "lucide-react";

const trustItems = [
  { icon: Shield, title: "Audited Smart Contracts", description: "Leading security firms" },
  { icon: Lock, title: "Liquidity Locked", description: "Automatic locking system" },
  { icon: FileCheck, title: "Transparent Fees", description: "No hidden fees" },
  { icon: Clock, title: "24/7 Support", description: "Always available" },
  { icon: Users, title: "Community Driven", description: "Built by the community" },
  { icon: CheckCircle, title: "Verified Launchpad", description: "Solana ecosystem" },
];

export default function TrustSection() {
  return (
    <section className="px-4 py-20 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Built on <span className="text-[oklch(51.8%_0.253_323.949)]">Trust</span>
        </h2>
        <p className="text-[#8E8E93] max-w-2xl mx-auto">Your security is our top priority</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {trustItems.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-apple p-6">
            <div className="w-10 h-10 rounded-xl bg-[#1C1C1E] flex items-center justify-center mb-4">
              <item.icon className="w-5 h-5 text-[oklch(51.8%_0.253_323.949)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-[#8E8E93]">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}