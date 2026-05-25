"use client";

import { motion } from "framer-motion";
import { Coins, Rocket, TrendingUp, Gift, Shield, Award, Crown, ArrowRight } from "lucide-react";

interface HowItWorksProps {
  t?: (key: string) => string;
}

const steps = [
  {
    step: "01",
    icon: Coins,
    title: "Create Token",
    description: "Enter token details, supply, and metadata. No coding required.",
  },
  {
    step: "02",
    icon: Rocket,
    title: "Launch Bonding Curve",
    description: "Set your initial price and launch your bonding curve instantly.",
  },
  {
    step: "03",
    icon: TrendingUp,
    title: "Reach Market Cap",
    description: "When market cap hits $69k, migrate to Raydium automatically.",
  },
  {
    step: "04",
    icon: Crown,
    title: "Whale Bonus",
    description: "Large launches get premium placement and marketing support.",
  },
  {
    step: "05",
    icon: Shield,
    title: "Secure Trading",
    description: "Trade with confidence using our audited smart contracts.",
  },
  {
    step: "06",
    icon: Award,
    title: "Community Growth",
    description: "Build your community with integrated marketing tools.",
  },
];

export default function HowItWorks({ t }: HowItWorksProps) {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#64FFDA]/30 bg-[#1A365D]/20 px-4 py-1.5 text-sm font-medium text-[#64FFDA] backdrop-blur-sm">
            <Rocket className="h-3.5 w-3.5" />
            <span>Simple Process</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            How It{" "}
            <span className="bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-[#8892B0]">
            Launch your token in minutes with our streamlined whale-friendly process
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="relative rounded-2xl border border-[#233554] bg-[#112240] p-6 transition-all duration-300 hover:border-[#64FFDA]/50 hover:shadow-xl hover:shadow-[#64FFDA]/10"
            >
              <div className="mb-2 text-sm font-semibold text-[#64FFDA]">{step.step}</div>
              
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A365D]">
                <step.icon className="h-6 w-6 text-[#64FFDA]" />
              </div>
              
              <h3 className="mb-2 text-xl font-semibold text-white">{step.title}</h3>
              <p className="text-[#8892B0]">{step.description}</p>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2">
                  <ArrowRight className="h-5 w-5 text-[#233554]" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}