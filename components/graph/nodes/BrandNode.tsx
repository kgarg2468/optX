"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import type { GraphNodeData } from "@/lib/types";

function BrandNodeComponent(props: NodeProps & { data: GraphNodeData }) {
  return <BaseNode {...props} data={{ ...props.data, type: "brand" }} />;
}

export const BrandNode = memo(BrandNodeComponent);
