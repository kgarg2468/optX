"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Target } from 'lucide-react'

export const BacktestVis = () => {
    return (
        <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center p-8">

            {/* Background Radial Base */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.05)_0%,transparent_70%)]" />

            <div className="w-full max-w-sm relative z-10 flex flex-col items-center space-y-8">

                {/* Brier Score Circle */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, type: "spring" }}
                    className="relative w-48 h-48 rounded-full border border-sky-500/30 bg-sky-500/5 flex items-center justify-center shadow-[0_0_50px_rgba(56,189,248,0.1)]"
                >
                    {/* Animated Spinners */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-r-2 border-t-2 border-sky-400/50"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[10px] rounded-full border-l-2 border-b-2 border-emerald-400/40"
                    />

                    {/* Center Stat */}
                    <div className="flex flex-col items-center text-center space-y-1">
                        <Target className="w-6 h-6 text-sky-400 mb-2" />
                        <span className="text-3xl font-serif text-white tracking-tight">0.92</span>
                        <span className="text-[10px] uppercase tracking-widest text-sky-100/50 font-mono">Brier Score</span>
                    </div>
                </motion.div>

                {/* Validation Steps */}
                <div className="w-full space-y-3">
                    {[
                        { label: "Walk-Forward Pass 1", status: "Verified", delay: 0.5 },
                        { label: "Walk-Forward Pass 2", status: "Verified", delay: 0.8 },
                        { label: "Coverage Interval (95%)", status: "96.4%", delay: 1.1 }
                    ].map((step, i) => (
                        <motion.div
                            key={step.label}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: step.delay }}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5"
                        >
                            <div className="flex items-center space-x-3">
                                <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
                                <span className="text-xs font-mono text-white/60">{step.label}</span>
                            </div>
                            <span className="text-xs font-mono text-emerald-400">{step.status}</span>
                        </motion.div>
                    ))}
                </div>

            </div>
        </div>
    )
}
