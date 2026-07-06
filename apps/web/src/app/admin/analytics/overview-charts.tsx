"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function OverviewCharts({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500">
        No trend data available for this period.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis 
          dataKey="date" 
          stroke="#94a3b8" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={(val) => {
            const d = new Date(val);
            return `${d.getMonth()+1}/${d.getDate()}`;
          }}
        />
        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
          itemStyle={{ color: '#fff' }}
        />
        <Area 
          type="monotone" 
          dataKey="users" 
          name="Daily Active Users"
          stroke="#818cf8" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorUsers)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
