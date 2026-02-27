"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, ArrowRight } from 'lucide-react'

export const GarchVis = () => {
    // Generate random clustered volatility points
    const points = Array.from({ length: 40 }).map((_, i) => {
        // Artificial volatility clustering (high midway through)
        const isClustered = i > 15 && i < 25
        const variance = isClustered ? 40 : 10
        const val = 50 + (Math.random() * variance * (Math.random() > 0.5 ? 1 : -1))
        return val
    })

    return (
        <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center p-8">
            {/* Background Grains */}
            <div className="absolute inset-0 bg-[#0a0a0a]" />

            <div className="relative w-full max-w-lg z-10 flex flex-col space-y-6">

                {/* Header bar */}
                <div className="flex justify-between items-center text-xs font-mono text-white/40 border-b border-white/5 pb-2">
                    <span>GARCH(1,1) Variance Expansion</span>
                    <span className="text-emerald-500/50 flex space-x-1 items-center">
                        <BarChart3 className="w-3 h-3" />
                        <span>Volatility Clusters</span>
                    </span>
                </div>

                {/* The Time Series Chart area */}
                <div className="h-48 w-full flex items-end justify-between space-x-1 relative">

                    {/* Overlay Grid lines */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-4">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-full h-px bg-white/[0.03]" />
                        ))}
                    </div>

                    {points.map((val, i) => {
                        const isVolatile = i > 15 && i < 25
                        const height = Math.abs(val - 50) + 10 // scale to height

                        return (
                            <motion.div
                                key={i}
                                initial={{ scaleY: 0, opacity: 0 }}
                                whileInView={{ scaleY: 1, opacity: 1 }}
                                viewport={{ once: false, margin: "-10%" }}
                                transition={{ delay: i * 0.05, duration: 0.4, type: "spring", stiffness: 100 }}
                                className={`w-full rounded-sm origin-bottom ${isVolatile ? 'bg-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-emerald-500/20'}`}
                                style={{ height: `${height}%` }}
                            />
                        )
                    })}
                </div>

                {/* Label Arrow below */}
                <div className="w-full flex justify-center items-center relative mt-4">
                    <motion.div
                        animate={{ x: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute flex items-center space-x-2 text-rose-500 text-xs font-mono tracking-wider font-bold"
                    >
                        <span>STRESS EVENT SIMULATION</span>
                        <ArrowRight className="w-3 h-3" />
                    </motion.div>
                </div>

            </div>
        </div>
    )
}
