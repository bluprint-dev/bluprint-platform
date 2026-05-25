"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, Gift, Megaphone, BarChart3, Wallet } from "lucide-react";

interface UseCaseProps {
  t?: (key: string) => string;
}

const useCases = [
  {
    icon: Users,
    title: "Community Tokens",
    description: "Launch governance tokens for your DAO or community project.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: TrendingUp,
    title: "Meme Coins",
    description: "Create and launch the next viral meme coin on Solana.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Gift,
    title: "Reward Tokens",
    description: "Build loyalty programs with custom reward tokens.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Megaphone,
    title: "Marketing Campaigns",
    description: "Engage your audience with token-gated content and campaigns.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: BarChart3,
    title: "Fundraising",
    description: "Raise capital through fair launch bonding curves.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Wallet,
    title: "Payment Tokens",
    description: "Create utility tokens for payments and services.",
    color: "from-indigo-500 to-purple-500",
  },
];

export default function UseCase({ t }: UseCaseProps) {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-400">
            <Wallet className="h-3.5 w-3.5" />
            <span>{t ? t("use_cases") : "Use Cases"}</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Perfect for{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              Every Project
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            {t ? t("use_cases_description") : "Whatever your vision, BluPrint provides the tools to bring it to life"}
          </p>
        </div>

        {/* Grid - rounded-2xl + yumuşak hover */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group relative rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-950/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30 hover:shadow-xl"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-cyan-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-5" />
              
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${useCase.color} shadow-lg`}>
                <useCase.icon className="h-6 w-6 text-white" />
              </div>
              
              <h3 className="mb-2 text-xl font-semibold text-white">{useCase.title}</h3>
              <p className="text-gray-400">{useCase.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}