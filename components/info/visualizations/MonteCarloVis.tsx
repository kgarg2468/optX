"use client"

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Database, Network, LineChart, FileJson2 } from 'lucide-react'

export const MonteCarloVis = () => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">

            {/* Background Dots */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

            {/* Database extraction to Variable Universe */}
            <div className="flex flex-col items-center relative z-10 w-full max-w-md">

                {/* Step 1: Data Extraction */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: "-10%" }}
                    className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center space-x-4 w-full"
                >
                    <div className="p-3 bg-emerald-500/10 rounded-lg shrink-0">
                        <Database className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="h-2 w-1/3 bg-white/20 rounded-full" />
                        <div className="h-2 w-full bg-white/10 rounded-full" />
                        <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                    </div>
                </motion.div>

                {/* Data flowing arrows */}
                <div className="flex justify-center space-x-8 my-4">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, height: 0 }}
                            whileInView={{ opacity: 1, height: 40 }}
                            transition={{ delay: 0.2 + (i * 0.1), duration: 0.5 }}
                            className="w-px bg-gradient-to-b from-emerald-500/50 to-transparent relative"
                        >
                            <motion.div
                                animate={{ y: [0, 40] }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
                                className="absolute top-0 left-[-1.5px] w-[4px] h-[4px] bg-emerald-400 rounded-full glow"
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Step 2: KS Test Fit */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="relative bg-[#111] border border-white/10 p-5 rounded-xl w-full flex flex-col items-center"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent rounded-xl pointer-events-none" />
                    <div className="flex items-center justify-between w-full mb-4">
                        <span className="text-xs font-mono text-white/50">Kolmogorov-Smirnov Test</span>
                        <LineChart className="w-4 h-4 text-emerald-500/50" />
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center w-full">
                        {['Normal', 'LogNormal', 'Uniform', 'Exponential', 'Poisson'].map((dist, i) => (
                            <motion.div
                                key={dist}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + (i * 0.1) }}
                                className={`px-3 py-1.5 text-xs font-mono rounded-md border ${i === 1 ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-white/[0.02] text-white/30'}`}
                            >
                                {dist}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </div>
    )
}
