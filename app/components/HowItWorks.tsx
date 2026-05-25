"use client";

import { motion } from "framer-motion";
import { Coins, Rocket, TrendingUp, Gift, Shield, Award } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Coins,
    title: "Create Token",
    description: "Enter token details, supply, and metadata. No coding required.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    step: "02",
    icon: Rocket,
    title: "Launch Bonding Curve",
    description: "Set your initial price and launch your bonding curve instantly.",
    color: "from-purple-500 to-pink-500",
  },
  {
    step: "03",
    icon: TrendingUp,
    title: "Reach Market Cap",
    description: "When market cap hits $69k, migrate to Raydium automatically.",
    color: "from-orange-500 to-red-500",
  },
  {
    step: "04",
    icon: Gift,
    title: "Claim Rewards",
    description: "Earn referral bonuses and rewards from successful launches.",
    color: "from-green-500 to-emerald-500",
  },
  {
    step: "05",
    icon: Shield,
    title: "Secure Trading",
    description: "Trade with confidence using our audited smart contracts.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    step: "06",
    icon: Award,
    title: "Community Growth",
    description: "Build your community with integrated marketing tools.",
    color: "from-indigo-500 to-purple-500",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-400">
            <Rocket className="h-3.5 w-3.5" />
            <span>Simple Process</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            How It <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            Launch your token in minutes with our streamlined process
          </p>
        </div>

        {/* Grid - rounded-2xl + yumuşak hover */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group relative rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-950/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/30 hover:shadow-xl"
            >
              {/* Glow efekti */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-purple-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-5" />
              
              {/* Step numarası */}
              <div className="mb-2 text-sm font-semibold text-purple-400">{step.step}</div>
              
              {/* İkon */}
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-lg`}>
                <step.icon className="h-6 w-6 text-white" />
              </div>
              
              {/* Başlık */}
              <h3 className="mb-2 text-xl font-semibold text-white">{step.title}</h3>
              
              {/* Açıklama */}
              <p className="text-gray-400">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}