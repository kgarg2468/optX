"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, YAxis, XAxis, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface LogEntry {
    id: string;
    message: string;
    timestamp: string;
}

interface SimulationChartOverlayProps {
    isVisible: boolean;
    data: any[];
    logs: LogEntry[];
    className?: string;
}

export function SimulationChartOverlay({
    isVisible,
    data,
    logs,
    className,
}: SimulationChartOverlayProps) {
    // Auto-scroll simulation logs 
    const [displayedLogs, setDisplayedLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        // Keep only the last 3 logs visible for clean aesthetics
        setDisplayedLogs(logs.slice(-3));
    }, [logs]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={cn(
                        "absolute bottom-0 left-0 right-0 z-40 px-6 pb-6 pt-12",
                        "bg-gradient-to-t from-background via-background/80 to-transparent",
                        "pointer-events-none flex flex-col md:flex-row gap-6",
                        className
                    )}
                >
                    {/* Main Chart Area */}
                    <div className="flex-1 glass-card rounded-3xl p-6 pointer-events-auto h-48 overflow-hidden relative">
                        <h3 className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-4">
                            Real-Time Revenue vs Stress
                        </h3>

                        <div className="absolute inset-0 top-12 left-0 right-0 bottom-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FB7185" stopOpacity={0.5} />
                                            <stop offset="95%" stopColor="#FB7185" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>

                                    <XAxis dataKey="time" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(20,20,20,0.8)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            color: '#F5F5F5'
                                        }}
                                        itemStyle={{ color: '#F5F5F5' }}
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="stress"
                                        stroke="#FB7185"
                                        fillOpacity={1}
                                        fill="url(#colorStress)"
                                        isAnimationActive={false}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#34D399"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorRev)"
                                        isAnimationActive={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Activity Log Feed */}
                    <div className="w-full md:w-80 glass-card rounded-3xl p-6 pointer-events-auto flex flex-col justify-end h-48">
                        <h3 className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-4 absolute top-6">
                            Agent Activity
                        </h3>

                        <div className="flex flex-col gap-3 justify-end h-full">
                            <AnimatePresence mode="popLayout">
                                {displayedLogs.map((log) => (
                                    <motion.div
                                        key={log.id}
                                        layout
                                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        className="text-sm text-foreground/90 whitespace-nowrap overflow-hidden text-ellipsis bg-white/5 px-3 py-2 rounded-xl border border-white/5"
                                    >
                                        <span className="text-muted-foreground mr-2 font-mono text-xs">{log.timestamp}</span>
                                        {log.message}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
