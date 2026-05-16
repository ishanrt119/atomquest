"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const data = [
  { name: "Week 1", progress: 10 },
  { name: "Week 2", progress: 25 },
  { name: "Week 3", progress: 45 },
  { name: "Week 4", progress: 50 },
  { name: "Week 5", progress: 65 },
  { name: "Week 6", progress: 72 },
  { name: "Week 7", progress: 85 },
  { name: "Week 8", progress: 92 },
];

export function ProgressChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '8px', 
              border: '1px solid var(--border)', 
              backgroundColor: 'var(--background)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }} 
          />
          <Area 
            type="monotone" 
            dataKey="progress" 
            stroke="var(--primary)" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorProgress)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
