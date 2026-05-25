"use client";

import { motion } from "framer-motion";
import { Shield, Zap, BarChart3, Lock, Rocket, Users } from "lucide-react";

interface WhyBluPrintProps {
  t?: (key: string) => string;
}

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Launch your token in seconds with Solana's blazing fast transaction speeds.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "Secure & Audited",
    description: "Smart contracts fully audited with rug-pull protection mechanisms.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track your token's performance with detailed charts and metrics.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Rocket,
    title: "Built-in Marketing",
    description: "Get featured on our launchpad and reach thousands of traders.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Lock,
    title: "Liquidity Locking",
    description: "Automatic liquidity locking to ensure trust and stability.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Users,
    title: "Community Tools",
    description: "Integrated referral system and community management features.",
    color: "from-indigo-500 to-purple-500",
  },
];

export default function WhyBluPrint({ t }: WhyBluPrintProps) {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400">
            <Zap className="h-3.5 w-3.5" />
            <span>{t ? t("why_choose_us") : "Why Choose Us"}</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Why <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">BluPrint</span>?
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            {t ? t("why_description") : "The most advanced launchpad on Solana with features designed for success"}
          </p>
        </div>

        {/* Grid - rounded-2xl + yumuşak hover efekti */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group relative rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-950/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:shadow-xl"
            >
              {/* Glow efekti */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-cyan-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-5" />
              
              {/* İkon */}
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              
              {/* Başlık */}
              <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
              
              {/* Açıklama */}
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}