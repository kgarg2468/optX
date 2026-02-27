"use client";

import { useEffect, useRef } from "react";
import { useProjectStore } from "@/lib/store/project-store";

/**
 * Auto-seeds the Lumina Beauty Co. demo project on first load.
 * Idempotent — skips if already seeded.
 */
export function useSeedLumina() {
    const seeded = useRef(false);
    const loadProjects = useProjectStore((s) => s.loadProjects);

    useEffect(() => {
        if (seeded.current) return;
        seeded.current = true;

        fetch("/api/seed", { method: "POST" })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    // Reload project list so Lumina appears
                    loadProjects();
                }
            })
            .catch(() => {
                // Silent fail — seed is optional
            });
    }, [loadProjects]);
}
