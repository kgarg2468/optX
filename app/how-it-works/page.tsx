"use client"

import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowLeft, ChevronDown, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { LayoutShell } from '@/components/layout/LayoutShell'

// Example placeholder for visually striking math model layers
import { MonteCarloVis } from '@/components/info/visualizations/MonteCarloVis'
import { BayesianVis } from '@/components/info/visualizations/BayesianVis'
import { GarchVis } from '@/components/info/visualizations/GarchVis'
import { SensitivityVis } from '@/components/info/visualizations/SensitivityVis'
import { BacktestVis } from '@/components/info/visualizations/BacktestVis'

const MathLayerPanel = ({
    title,
    description,
    layerNum,
    visual,
    isEven
}: {
    title: string,
    description: string | React.ReactNode,
    layerNum: string,
    visual: React.ReactNode,
    isEven: boolean
}) => {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "center center"]
    })

    const opacity = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0, 1, 1, 1])
    const y = useTransform(scrollYProgress, [0, 0.4], [100, 0])

    return (
        <motion.div
            ref={ref}
            style={{ opacity, y }}
            className={`min-h-[80vh] w-full flex flex-col md:flex-row items-center justify-between gap-12 py-24 ${isEven ? 'md:flex-row-reverse' : ''}`}
        >
            {/* Text Section */}
            <div className="w-full md:w-1/2 flex flex-col items-start space-y-6 z-10">
                <div className="flex items-center space-x-4">
                    <span className="text-emerald-500 font-mono text-sm tracking-widest uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        {layerNum}
                    </span>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white/90 leading-tight">
                    {title}
                </h2>
                <div className="text-lg md:text-xl text-white/60 font-light leading-relaxed max-w-xl">
                    {description}
                </div>
            </div>

            {/* Visual Section */}
            <div className="w-full md:w-1/2 flex justify-center items-center h-[400px] md:h-[600px] relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-transparent rounded-3xl backdrop-blur-3xl border border-white/[0.05] p-6 shadow-2xl">
                    {visual}
                </div>
            </div>
        </motion.div>
    )
}

export default function HowItWorksPage() {
    const { scrollYProgress } = useScroll()
    const opacityHero = useTransform(scrollYProgress, [0, 0.1], [1, 0])
    const yHero = useTransform(scrollYProgress, [0, 0.1], [0, 100])

    return (
        <LayoutShell>
            <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-emerald-500/30 selection:text-white pb-32">
                {/* Fixed Background Gradients */}
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/10 blur-[120px]" />
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-24">

                    {/* Top Nav Override - subtle back button */}
                    <div className="pt-12 pb-8 sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-md z-50 flex items-center justify-between border-b border-white/[0.02]">
                        <Link href="/" className="group flex items-center space-x-2 text-white/50 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium tracking-wide uppercase">Back to OptX</span>
                        </Link>
                        <div className="text-xs font-mono text-emerald-500/50">OPTX_MATH_MODEL_V1</div>
                    </div>

                    {/* Hero Section */}
                    <motion.div
                        style={{ opacity: opacityHero, y: yHero }}
                        className="min-h-[85vh] flex flex-col justify-center items-start pt-20"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-8 max-w-4xl"
                        >
                            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-mono uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Whitepaper Walkthrough</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white leading-[1.1] tracking-tight">
                                The Engine <br className="hidden md:block" />
                                <span className="text-white/40 italic">Inside OptX.</span>
                            </h1>

                            <p className="text-xl md:text-2xl text-white/60 font-light max-w-2xl leading-relaxed">
                                OptX isn't just a basic LLM wrapper. It uses a rigorous, 5-layer mathematical simulation pipeline and a 6-agent debate loop to generate statistically valid venture forecasts.
                            </p>

                            <div className="pt-12 animate-bounce opacity-50">
                                <ChevronDown className="w-8 h-8 font-light" />
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Layers - Scrollytelling */}
                    <div className="mt-32 space-y-32">

                        <MathLayerPanel
                            layerNum="Layer 0"
                            title="The Variable Universe."
                            description={
                                <div className="space-y-4">
                                    <p>OptX extracts raw business data—revenue, expenses, cash, and debt—and constructs a mathematical "Variable Universe".</p>
                                    <p>It automatically fits 7 different statistical distribution types (Normal, Lognormal, Uniform, Exponential, etc.) using Kolmogorov-Smirnov (KS) tests to find the best fit for historical data.</p>
                                </div>
                            }
                            isEven={false}
                            visual={<div className="w-full h-full flex items-center justify-center text-white/20 font-mono text-sm border border-dashed border-white/10 rounded-2xl">[Layer 0 Vis]</div>}
                        />

                        <MathLayerPanel
                            layerNum="Layer 1"
                            title="GARCH Volatility Adjustments."
                            description={
                                <div className="space-y-4">
                                    <p>Financial metrics don't just grow linearly; they experience volatility clustering. OptX applies a GARCH(1,1) model fitted via grid-search MLE to historical time-series data.</p>
                                    <p>This ensures that during high-stress market scenarios, the variance of your business metrics widens realistically, capturing true downside risk rather than just straight-line averages.</p>
                                </div>
                            }
                            isEven={true}
                            visual={<GarchVis />}
                        />

                        <MathLayerPanel
                            layerNum="Layer 2"
                            title="Monte Carlo Engine."
                            description={
                                <div className="space-y-4">
                                    <p>A rigorous Gaussian copula sampling engine runs 10,000+ iterations across all correlated variables.</p>
                                    <p>Instead of treating revenue and marketing spend as independent, OptX maintains their correlation structure while injecting confidence noise and projecting multi-month time series based on the inverse-CDF mappings from Layer 0.</p>
                                </div>
                            }
                            isEven={false}
                            visual={<MonteCarloVis />}
                        />

                        <MathLayerPanel
                            layerNum="Layer 3"
                            title="Bayesian Belief Network."
                            description={
                                <div className="space-y-4">
                                    <p>Correlation is not causation. Layer 3 builds a Directed Acyclic Graph (DAG) using pgmpy to draw rigorous causal links between business entities.</p>
                                    <p>This allows OptX to perform causal inference: "If we force advertising spend up 20% (Scenario Injection), what is the probabilistic cascade effect on customer acquisition and resulting cash burn over 6 months?"</p>
                                </div>
                            }
                            isEven={true}
                            visual={<BayesianVis />}
                        />

                        <MathLayerPanel
                            layerNum="Layer 4"
                            title="Sensitivity Analysis."
                            description={
                                <div className="space-y-4">
                                    <p>Not all variables matter equally. OptX calculates Saltelli Sobol indices (to find variance-based global sensitivity) and Morris elementary effects.</p>
                                    <p>This isolates exactly which levers—like pricing vs. conversion rate—are actually driving the variance in the simulation's end state, separating noise from true signal.</p>
                                </div>
                            }
                            isEven={false}
                            visual={<SensitivityVis />}
                        />

                        <MathLayerPanel
                            layerNum="Layer 5"
                            title="Backtest Engine."
                            description={
                                <div className="space-y-4">
                                    <p>The models are held accountable. OptX runs walk-forward validation and calculates Brier scores and coverage rates against historical knowns.</p>
                                    <p>By measuring the calibration of probability distributions, the system knows how "surprised" it should be by actual results, continually tightening its predictive accuracy.</p>
                                </div>
                            }
                            isEven={true}
                            visual={<BacktestVis />}
                        />

                        {/* The Agent Loop */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-20%" }}
                            transition={{ duration: 0.8 }}
                            className="py-32 border-t border-white/[0.05] mt-32"
                        >
                            <div className="max-w-4xl space-y-8">
                                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                    <span>The Reinforcement Loop</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white/90 leading-tight">
                                    The 6-Agent Debate.
                                </h2>
                                <div className="text-lg md:text-xl text-white/60 font-light leading-relaxed">
                                    <p className="mb-6">The math outputs aren't just handed to a single LLM to summarize. OptX orchestrates an asynchronous, 6-agent debate loop (Market, Financial, Growth, Risk, Brand, Operations).</p>
                                    <p className="mb-6">These agents engage in 2-3 rounds of cross-critique pairs (e.g., Risk vs Growth). They debate the mathematical outputs from the Monte Carlo engine until convergence is reached.</p>
                                    <p>Finally, the consensus is translated into new causal edges and variable adjustments, which are fed <i>back</i> into the math engine for an enriched, AI-validated simulation re-run.</p>
                                </div>

                                <div className="mt-12 grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {['Market', 'Financial', 'Growth', 'Risk', 'Brand', 'Operations'].map((agent) => (
                                        <div key={agent} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center space-x-3">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
                                            <span className="text-white/80 font-medium">{agent} Agent</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </LayoutShell>
    )
}
