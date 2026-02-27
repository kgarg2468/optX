"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Activity, BrainCircuit, LineChart, ShieldAlert } from 'lucide-react';
import { MonteCarloVis } from '@/components/info/visualizations/MonteCarloVis';

// Simplified layout shell for the landing page without the sidebar
const MarketingShell = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative selection:bg-emerald-500/30 selection:text-white">
            {/* Ambient Backgrounds */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[150px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-lime-500/10 blur-[150px] mix-blend-screen" />
                <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-[120px] mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
            </div>

            {/* Simple Top Nav */}
            <nav className="fixed top-0 w-full z-50 bg-[#050505]/50 backdrop-blur-xl border-b border-white/[0.02] supports-[backdrop-filter]:bg-[#050505]/20">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="font-black tracking-[0.15em] uppercase bg-gradient-to-r from-white via-white/90 to-lime-400 bg-clip-text text-transparent text-xl">
                            OptX
                        </span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <Link href="/how-it-works" className="text-sm font-medium text-white/50 hover:text-white transition-colors uppercase tracking-widest hidden md:block">
                            Math Engine
                        </Link>
                        <Link href="/dashboard" className="group relative px-6 py-2.5 rounded-full overflow-hidden">
                            <div className="absolute inset-0 bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20" />
                            <div className="absolute inset-0 border border-emerald-500/20 rounded-full" />
                            <div className="relative flex items-center space-x-2 text-sm font-semibold text-emerald-400">
                                <span>Launch App</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="relative z-10">{children}</main>
        </div>
    );
};

export default function LandingPage() {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });

    const opacityHero = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
    const yHero = useTransform(scrollYProgress, [0, 1], [0, 150]);
    const scaleHero = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

    return (
        <MarketingShell>
            {/* Hero Section */}
            <motion.section
                ref={heroRef}
                style={{ opacity: opacityHero, y: yHero, scale: scaleHero }}
                className="min-h-screen flex flex-col items-center justify-center pt-20 px-6 text-center"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-5xl space-y-8 relative"
                >
                    {/* Glowing Accent */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent blur-[2px] opacity-50" />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[100px] h-[1px] bg-gradient-to-r from-transparent via-lime-400 to-transparent" />

                    <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-mono uppercase tracking-widest backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                        <span>v1.0 Engine Live</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif text-white leading-[1.05] tracking-tight">
                        Predict The <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-300 italic">Unpredictable.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-white/50 font-light max-w-3xl mx-auto leading-relaxed">
                        OptX is a rigorous mathematical simulation pipeline and 6-agent debate loop designed to generate statistically valid venture forecasts.
                    </p>

                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link href="/dashboard">
                            <button className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg tracking-wide hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)] flex items-center space-x-3">
                                <span>Start Simulating</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                        <Link href="/how-it-works">
                            <button className="px-8 py-4 rounded-full font-semibold text-lg tracking-wide text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                                Read the Whitepaper
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </motion.section>

            {/* Visual Engine Teaser */}
            <section className="py-24 relative z-20">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.8 }}
                        className="relative rounded-[2rem] overflow-hidden border border-white/[0.05] bg-black/40 backdrop-blur-xl shadow-2xl p-8 md:p-12"
                    >
                        {/* Inner glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-lime-500/5" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                            <div className="w-full lg:w-1/3 space-y-6">
                                <h3 className="text-3xl font-serif">The Monte Carlo Engine.</h3>
                                <p className="text-white/50 leading-relaxed font-light">
                                    A rigorous Gaussian copula sampling engine runs 10,000+ iterations across all correlated variables, projecting multi-month time series based on inverse-CDF mappings.
                                </p>
                                <Link href="/how-it-works" className="inline-flex items-center space-x-2 text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
                                    <span>Explore Layer 2</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="w-full lg:w-2/3 h-[400px] rounded-2xl border border-white/10 bg-black/50 overflow-hidden relative">
                                <div className="absolute inset-0 scale-[0.8] md:scale-100 origin-center">
                                    <MonteCarloVis />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-32 relative z-20 bg-gradient-to-b from-transparent to-black/80">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center space-y-4 mb-20">
                        <h2 className="text-4xl md:text-5xl font-serif">Beyond Simple Wrappers.</h2>
                        <p className="text-xl text-white/50 font-light max-w-2xl mx-auto">
                            Built for accuracy, hardened by statistics.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Activity className="w-6 h-6 text-emerald-400" />,
                                title: "GARCH Volatility",
                                desc: "Applies a GARCH(1,1) model fitted via grid-search MLE to historical time-series data to capture true downside risk."
                            },
                            {
                                icon: <BrainCircuit className="w-6 h-6 text-lime-400" />,
                                title: "Bayesian Causality",
                                desc: "Builds a Directed Acyclic Graph (DAG) using pgmpy to draw rigorous causal links between business entities."
                            },
                            {
                                icon: <LineChart className="w-6 h-6 text-indigo-400" />,
                                title: "Sensitivity Focus",
                                desc: "Calculates Saltelli Sobol indices to isolate exactly which levers are driving variance in the simulation."
                            },
                            {
                                icon: <ShieldAlert className="w-6 h-6 text-rose-400" />,
                                title: "6-Agent Debate",
                                desc: "An asynchronous debate loop (Market, Financial, Growth, Risk, Brand, Ops) critiques math outputs until convergence."
                            }
                        ].map((feat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className={`p-8 rounded-3xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-colors group ${i === 3 ? 'md:col-span-2 lg:col-span-3 lg:w-2/3 mx-auto flex flex-col md:flex-row items-center md:text-left text-center gap-6 mt-6' : ''}`}
                            >
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner border border-white/10">
                                    {feat.icon}
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-xl font-medium">{feat.title}</h4>
                                    <p className="text-sm text-white/50 leading-relaxed font-light">{feat.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-40 relative z-20 border-t border-white/[0.05] bg-[#020202]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                <div className="max-w-4xl mx-auto px-6 text-center space-y-10">
                    <h2 className="text-5xl md:text-7xl font-serif">Ready to look forward?</h2>
                    <p className="text-xl text-white/50 font-light">
                        Stop guessing. Start simulating your business future with rigorous mathematical intent.
                    </p>
                    <Link href="/dashboard" className="inline-block">
                        <button className="group relative px-10 py-5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold text-lg tracking-wide hover:bg-emerald-500/20 transition-all border border-emerald-500/30 flex items-center space-x-3 mx-auto">
                            <span>Open Optimizer</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </button>
                    </Link>
                </div>
            </section>
        </MarketingShell>
    );
}
