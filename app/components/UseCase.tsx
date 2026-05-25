"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, Gift, Megaphone, BarChart3, Wallet, Crown, Rocket } from "lucide-react";

interface UseCaseProps {
  t?: (key: string) => string;
}

const useCases = [
  {
    icon: Users,
    title: "Community Tokens",
    description: "Launch governance tokens for your DAO or community project.",
  },
  {
    icon: TrendingUp,
    title: "Meme Coins",
    description: "Create and launch the next viral meme coin on Solana.",
  },
  {
    icon: Crown,
    title: "Whale Projects",
    description: "Large-scale launches with premium marketing support.",
  },
  {
    icon: Megaphone,
    title: "Marketing Campaigns",
    description: "Engage your audience with token-gated content and campaigns.",
  },
  {
    icon: BarChart3,
    title: "Fundraising",
    description: "Raise capital through fair launch bonding curves.",
  },
  {
    icon: Wallet,
    title: "Payment Tokens",
    description: "Create utility tokens for payments and services.",
  },
];

export default function UseCase({ t }: UseCaseProps) {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#64FFDA]/30 bg-[#1A365D]/20 px-4 py-1.5 text-sm font-medium text-[#64FFDA] backdrop-blur-sm">
            <Rocket className="h-3.5 w-3.5" />
            <span>Use Cases</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Perfect for{" "}
            <span className="bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] bg-clip-text text-transparent">
              Every Project
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-[#8892B0]">
            Whatever your vision, BluPrint provides the tools to bring it to life
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group relative rounded-2xl border border-[#233554] bg-[#112240] p-6 transition-all duration-300 hover:border-[#64FFDA]/50 hover:shadow-xl hover:shadow-[#64FFDA]/10"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#64FFDA]/0 via-[#4ECDC4]/0 to-[#64FFDA]/0 opacity-0 transition-opacity duration-300 group-hover:opacity-5" />
              
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A365D]">
                <useCase.icon className="h-6 w-6 text-[#64FFDA]" />
              </div>
              
              <h3 className="mb-2 text-xl font-semibold text-white">{useCase.title}</h3>
              <p className="text-[#8892B0]">{useCase.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}