"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Network, Activity } from 'lucide-react'

// Represents standard DAG structure
export const BayesianVis = () => {
    const nodes = [
        { id: 1, top: "10%", left: "50%", label: "Market Demand", color: "from-blue-500/20 to-indigo-500/20", active: true },
        { id: 2, top: "40%", left: "20%", label: "Ad Spend", color: "from-emerald-500/20 to-teal-500/20", active: true },
        { id: 3, top: "40%", left: "80%", label: "Competitor Price", color: "from-rose-500/20 to-orange-500/20", active: false },
        { id: 4, top: "70%", left: "30%", label: "Customer Acq", color: "from-purple-500/20 to-fuchsia-500/20", active: true },
        { id: 5, top: "85%", left: "70%", label: "Revenue", color: "from-amber-500/20 to-yellow-500/20", active: true },
    ]

    // Hardcoded SVG linking logic for demo
    const edges = [
        { from: { x: 50, y: 10 }, to: { x: 20, y: 40 } },
        { from: { x: 50, y: 10 }, to: { x: 80, y: 40 } },
        { from: { x: 20, y: 40 }, to: { x: 30, y: 70 } },
        { from: { x: 80, y: 40 }, to: { x: 30, y: 70 } },
        { from: { x: 30, y: 70 }, to: { x: 70, y: 85 } },
        { from: { x: 50, y: 10 }, to: { x: 70, y: 85 } }
    ]

    return (
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

            <div className="absolute inset-0 p-8 w-full h-full max-w-lg mx-auto">

                {/* SVG Edges Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
                    {edges.map((edge, i) => {
                        return (
                            <motion.path
                                key={i}
                                initial={{ pathLength: 0, opacity: 0 }}
                                whileInView={{ pathLength: 1, opacity: 0.3 }}
                                transition={{ delay: 0.5 + (i * 0.2), duration: 1.5, ease: "easeInOut" }}
                                d={`M ${edge.from.x}% ${edge.from.y}% C ${edge.from.x}% ${(edge.from.y + edge.to.y) / 2}, ${edge.to.x}% ${(edge.from.y + edge.to.y) / 2}, ${edge.to.x}% ${edge.to.y}%`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="text-white/40 dashed-path"
                                strokeDasharray="4 4"
                            />
                        )
                    })}
                </svg>

                {/* Nodes Layer */}
                {nodes.map((node, i) => (
                    <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.15, type: 'spring' }}
                        style={{ top: node.top, left: node.left, transform: 'translate(-50%, -50%)' }}
                        className={`absolute z-10 bg-gradient-to-br ${node.color} backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center space-x-3 shadow-2xl w-40`}
                    >
                        <div className={`p-1.5 rounded-lg bg-black/40 border border-white/5`}>
                            {node.active ?
                                <Network className={`w-4 h-4 text-white/80`} /> :
                                <Activity className={`w-4 h-4 text-white/30`} />
                            }
                        </div>
                        <span className={`text-xs font-mono font-medium ${node.active ? 'text-white' : 'text-white/40'}`}>
                            {node.label}
                        </span>
                    </motion.div>
                ))}

            </div>
        </div>
    )
}
