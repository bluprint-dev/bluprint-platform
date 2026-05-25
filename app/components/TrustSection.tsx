"use client";

import { motion } from "framer-motion";
import { Shield, CheckCircle, Clock, Users, Lock, FileCheck } from "lucide-react";

const trustItems = [
  {
    icon: Shield,
    title: "Audited Smart Contracts",
    description: "Fully audited by leading security firms",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Lock,
    title: "Liquidity Locked",
    description: "Automatic liquidity locking system",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: FileCheck,
    title: "Transparent Fees",
    description: "No hidden fees, clear pricing structure",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Dedicated support team always available",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Built by the community, for the community",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: CheckCircle,
    title: "Verified Launchpad",
    description: "Officially recognized by Solana ecosystem",
    color: "from-indigo-500 to-purple-500",
  },
];

export default function TrustSection() {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-400">
            <Shield className="h-3.5 w-3.5" />
            <span>Trust & Security</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Built on <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">Trust</span>
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            Your security is our top priority. Here's why you can trust BluPrint
          </p>
        </div>

        {/* Grid - rounded-2xl + yumuşak hover */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trustItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group relative rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-950/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-xl"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/0 via-emerald-500/0 to-green-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-5" />
              
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
              
              <h3 className="mb-2 text-xl font-semibold text-white">{item.title}</h3>
              <p className="text-gray-400">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Trust badge'leri */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap justify-center gap-6 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/30 to-gray-950/30 p-8 backdrop-blur-sm"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-white">$50M+</div>
            <div className="text-sm text-gray-500">Total Value Locked</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">100K+</div>
            <div className="text-sm text-gray-500">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">500+</div>
            <div className="text-sm text-gray-500">Tokens Launched</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">99.9%</div>
            <div className="text-sm text-gray-500">Uptime</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}