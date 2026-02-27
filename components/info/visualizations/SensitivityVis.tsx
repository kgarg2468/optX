"use client"

import React from 'react'
import { motion, useAnimation } from 'framer-motion'
import { ListFilter } from 'lucide-react'

export const SensitivityVis = () => {
    const variables = [
        { name: "Unit Pricing", effect: 85, color: "from-emerald-400 to-emerald-600" },
        { name: "Customer Acq Cost", effect: 62, color: "from-emerald-500/50 to-emerald-700/50" },
        { name: "Monthly Churn", effect: 40, color: "from-white/30 to-white/10" },
        { name: "Server Expenses", effect: 15, color: "from-white/20 to-transparent" },
        { name: "Office Rent", effect: 5, color: "from-white/10 to-transparent" },
    ]

    return (
        <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center px-12">
            <div className="w-full max-w-lg space-y-6">

                {/* Header */}
                <div className="flex items-center space-x-3 text-white/50 mb-8 border-b border-white/10 pb-4">
                    <ListFilter className="w-5 h-5 text-indigo-400" />
                    <span className="font-mono text-sm tracking-widest uppercase text-white/80">Sobol Indices (Global Sens.)</span>
                </div>

                {/* Bars */}
                <div className="space-y-4 w-full">
                    {variables.map((v, i) => (
                        <div key={v.name} className="flex flex-col space-y-2">
                            <div className="flex justify-between text-xs font-mono">
                                <span className={i < 2 ? "text-white" : "text-white/40"}>{v.name}</span>
                                <span className={i < 2 ? "text-emerald-400" : "text-white/30"}>{v.effect}% Variance</span>
                            </div>

                            {/* Track */}
                            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${v.effect}%` }}
                                    transition={{ delay: 0.2 + (i * 0.15), duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                    className={`h-full rounded-full bg-gradient-to-r ${v.color}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Separating Signal from Noise */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                    className="mt-8 pt-6 border-t border-white/10 flex items-start space-x-4"
                >
                    <div className="w-px h-12 bg-indigo-500/50 shrink-0" />
                    <p className="text-white/50 text-xs font-mono leading-relaxed">
                        <strong className="text-white">Isolating levers:</strong> The Morris elementary effects test proves pricing optimization holds exactly <span className="text-emerald-400">5.6x</span> more leverage over survival than fixed cost reductions.
                    </p>
                </motion.div>

            </div>
        </div>
    )
}
