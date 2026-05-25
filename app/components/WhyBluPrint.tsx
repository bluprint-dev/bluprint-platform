"use client";

import { motion } from "framer-motion";
import { Zap, Shield, BarChart3, Lock, Rocket, Users } from "lucide-react";

const features = [
  { icon: Zap, title: "Lightning Fast", description: "Launch your token in seconds with Solana speed." },
  { icon: Shield, title: "Secure & Audited", description: "Smart contracts fully audited." },
  { icon: BarChart3, title: "Real-time Analytics", description: "Track your token's performance." },
  { icon: Rocket, title: "Built-in Marketing", description: "Reach thousands of traders." },
  { icon: Lock, title: "Liquidity Locking", description: "Automatic liquidity locking system." },
  { icon: Users, title: "Community Tools", description: "Integrated referral system." },
];

export default function WhyBluPrint() {
  return (
    <section className="px-4 py-20 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Why <span className="text-[oklch(51.8%_0.253_323.949)]">BluPrint</span>?
        </h2>
        <p className="text-[#8E8E93] max-w-2xl mx-auto">The most advanced launchpad on Solana</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-apple p-6"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1C1C1E] flex items-center justify-center mb-4">
              <f.icon className="w-5 h-5 text-[oklch(51.8%_0.253_323.949)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-[#8E8E93]">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}