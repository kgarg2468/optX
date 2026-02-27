"use client";

import { memo } from "react";
import { type EdgeProps, getBezierPath } from "@xyflow/react";

export interface StringEdgeData {
  color?: string;
  strength?: number;
  label?: string;
  [key: string]: unknown;
}

function StringEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
}: EdgeProps & { data: StringEdgeData }) {
  const color = data?.color ?? "hsl(var(--muted-foreground))";
  const strength = data?.strength ?? 0.5;
  const label = data?.label;

  const dist = Math.sqrt((targetX - sourceX) ** 2 + (targetY - sourceY) ** 2);
  const sag = Math.min(50, 20 + dist * 0.06);

  const mx = (sourceX + targetX) / 2;
  const my = (sourceY + targetY) / 2;

  const path = `M ${sourceX},${sourceY} Q ${mx},${my + sag} ${targetX},${targetY}`;

  const strokeWidth = Math.max(1.5, strength * 3);
  const opacity = 0.4 + strength * 0.5;
  const animated = strength > 0.5;

  return (
    <g>
      <path
        id={id}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity={opacity}
        strokeLinecap="round"
        strokeDasharray={animated ? "6 4" : undefined}
        style={{
          animation: animated ? "string-flow 1s linear infinite" : undefined,
          ...style,
        }}
      />
      {label && (
        <text
          x={mx}
          y={my + sag / 2 + 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize={10}
          style={{ pointerEvents: "none" }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

export const StringEdge = memo(StringEdgeComponent);
