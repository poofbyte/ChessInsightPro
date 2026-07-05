"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface GameLineChartProps {
  data: any[];
}

export default function GameLineChart({ data }: GameLineChartProps) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="moveIndex" stroke="#64748b" fontSize={10} />
          <YAxis stroke="#64748b" fontSize={10} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              borderColor: "#334155",
              borderRadius: "12px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="eval"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={false}
            name="Evaluation"
          />
          <Line
            type="monotone"
            dataKey="whiteControl"
            stroke="#3b82f6"
            strokeWidth={1}
            dot={false}
            name="White Control"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
