"use client";

import { motion } from "framer-motion";
import { Shield, CheckCircle, Clock, Users, Lock, FileCheck, Crown, Award } from "lucide-react";

interface TrustSectionProps {
  t?: (key: string) => string;
}

const trustItems = [
  {
    icon: Shield,
    title: "Audited Smart Contracts",
    description: "Fully audited by leading security firms",
  },
  {
    icon: Lock,
    title: "Liquidity Locked",
    description: "Automatic liquidity locking system",
  },
  {
    icon: FileCheck,
    title: "Transparent Fees",
    description: "No hidden fees, clear pricing structure",
  },
  {
    icon: Crown,
    title: "Whale Protection",
    description: "Anti-whale manipulation mechanisms",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Built by the community, for the community",
  },
  {
    icon: Award,
    title: "Verified Launchpad",
    description: "Officially recognized by Solana ecosystem",
  },
];

export default function TrustSection({ t }: TrustSectionProps) {
  return (
    <section className="px-4 py-16 md:py-24 bg-[#020C1A]">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#64FFDA]/30 bg-[#1A365D]/20 px-4 py-1.5 text-sm font-medium text-[#64FFDA] backdrop-blur-sm">
            <Shield className="h-3.5 w-3.5" />
            <span>Trust & Security</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Built on{" "}
            <span className="bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] bg-clip-text text-transparent">
              Trust
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-[#8892B0]">
            Your security is our top priority. Here's why you can trust BluPrint
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trustItems.map((item, index) => (
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
                <item.icon className="h-6 w-6 text-[#64FFDA]" />
              </div>
              
              <h3 className="mb-2 text-xl font-semibold text-white">{item.title}</h3>
              <p className="text-[#8892B0]">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap justify-center gap-6 rounded-2xl border border-[#233554] bg-[#112240]/50 p-8 backdrop-blur-sm"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-[#64FFDA]">$50M+</div>
            <div className="text-sm text-[#8892B0]">Total Value Locked</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#64FFDA]">100K+</div>
            <div className="text-sm text-[#8892B0]">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#64FFDA]">500+</div>
            <div className="text-sm text-[#8892B0]">Tokens Launched</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#64FFDA]">99.9%</div>
            <div className="text-sm text-[#8892B0]">Uptime</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}