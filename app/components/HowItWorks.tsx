"use client";

import { motion } from "framer-motion";
import { Coins, Rocket, TrendingUp, Gift, Shield, Award } from "lucide-react";

const steps = [
  { step: "01", icon: Coins, title: "Create Token", description: "Enter token details, no coding." },
  { step: "02", icon: Rocket, title: "Launch Bonding Curve", description: "Set price and launch instantly." },
  { step: "03", icon: TrendingUp, title: "Reach Market Cap", description: "Auto-migrate to Raydium." },
  { step: "04", icon: Gift, title: "Claim Rewards", description: "Earn referral bonuses." },
  { step: "05", icon: Shield, title: "Secure Trading", description: "Audited smart contracts." },
  { step: "06", icon: Award, title: "Community Growth", description: "Built-in marketing tools." },
];

export default function HowItWorks() {
  return (
    <section className="px-4 py-20 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          How It <span className="text-[oklch(51.8%_0.253_323.949)]">Works</span>
        </h2>
        <p className="text-[#8E8E93] max-w-2xl mx-auto">Launch your token in minutes</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-apple p-6"
          >
            <div className="text-sm text-[oklch(51.8%_0.253_323.949)] font-mono mb-3">{s.step}</div>
            <div className="w-10 h-10 rounded-xl bg-[#1C1C1E] flex items-center justify-center mb-4">
              <s.icon className="w-5 h-5 text-[oklch(51.8%_0.253_323.949)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
            <p className="text-sm text-[#8E8E93]">{s.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}