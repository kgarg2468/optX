"use client";

import { motion } from "framer-motion";
import { Play, Pause, Zap, RotateCcw, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimulationActionRailProps {
    isRunning: boolean;
    onPlayPause: () => void;
    onInjectEvent: () => void;
    onReset: () => void;
    onToggleCharts: () => void;
    className?: string;
}

export function SimulationActionRail({
    isRunning,
    onPlayPause,
    onInjectEvent,
    onReset,
    onToggleCharts,
    className,
}: SimulationActionRailProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-50",
                "glass-card rounded-full p-3 py-6",
                className
            )}
        >
            <RailButton
                icon={isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                label={isRunning ? "Pause" : "Play"}
                onClick={onPlayPause}
                primary={!isRunning}
            />

            <RailButton
                icon={<Zap className="w-5 h-5 text-emerald-400" />}
                label="Inject Event"
                onClick={onInjectEvent}
            />

            <RailButton
                icon={<RotateCcw className="w-5 h-5" />}
                label="Reset"
                onClick={onReset}
            />

            <div className="w-full h-px bg-white/10 my-1" />

            <RailButton
                icon={<BarChart2 className="w-5 h-5" />}
                label="Toggle Charts"
                onClick={onToggleCharts}
            />
        </motion.div>
    );
}

function RailButton({
    icon,
    label,
    onClick,
    primary = false
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    primary?: boolean;
}) {
    return (
        <div className="relative group flex justify-center">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={onClick}
                className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-full transition-colors",
                    primary
                        ? "bg-lime-400 text-forest-950 hover:bg-lime-500"
                        : "bg-transparent text-foreground/80 hover:bg-white/[0.1]"
                )}
            >
                {icon}
            </motion.button>

            {/* Tooltip */}
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-card/90 backdrop-blur-md border border-border text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {label}
            </div>
        </div>
    );
}
