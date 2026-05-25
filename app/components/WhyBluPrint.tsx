"use client";

import { motion } from "framer-motion";
import { Shield, Zap, BarChart3, Lock, Rocket, Users, Crown, Wallet } from "lucide-react";

interface WhyBluPrintProps {
  t?: (key: string) => string;
}

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Launch your token in seconds with Solana's blazing fast transaction speeds.",
    color: "#64FFDA",
  },
  {
    icon: Shield,
    title: "Secure & Audited",
    description: "Smart contracts fully audited with rug-pull protection mechanisms.",
    color: "#4ECDC4",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track your token's performance with detailed charts and metrics.",
    color: "#64FFDA",
  },
  {
    icon: Crown,
    title: "Whale Tier Benefits",
    description: "Exclusive features for high-volume traders and large launches.",
    color: "#4ECDC4",
  },
  {
    icon: Lock,
    title: "Liquidity Locking",
    description: "Automatic liquidity locking to ensure trust and stability.",
    color: "#64FFDA",
  },
  {
    icon: Users,
    title: "Community Tools",
    description: "Integrated referral system and community management features.",
    color: "#4ECDC4",
  },
];

export default function WhyBluPrint({ t }: WhyBluPrintProps) {
  return (
    <section className="px-4 py-16 md:py-24 bg-gradient-to-b from-[#0A192F] to-[#020C1A]">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#64FFDA]/30 bg-[#1A365D]/20 px-4 py-1.5 text-sm font-medium text-[#64FFDA] backdrop-blur-sm">
            <Crown className="h-3.5 w-3.5" />
            <span>Why Choose BluPrint</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Why{" "}
            <span className="bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] bg-clip-text text-transparent">
              BluPrint
            </span>
            ?
          </h2>
          <p className="mx-auto max-w-2xl text-[#8892B0]">
            The most advanced launchpad on Solana with features designed for whales
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group relative rounded-2xl border border-[#233554] bg-[#112240] p-6 backdrop-blur-sm transition-all duration-300 hover:border-[#64FFDA]/50 hover:shadow-xl hover:shadow-[#64FFDA]/10"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#64FFDA]/0 via-[#4ECDC4]/0 to-[#64FFDA]/0 opacity-0 transition-opacity duration-300 group-hover:opacity-5" />
              
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A365D] shadow-lg" style={{ color: feature.color }}>
                <feature.icon className="h-6 w-6" />
              </div>
              
              <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
              <p className="text-[#8892B0]">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}