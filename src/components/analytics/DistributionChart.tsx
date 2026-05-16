"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
  { name: "Revenue Growth", value: 400 },
  { name: "Product Delivery", value: 300 },
  { name: "Customer Success", value: 300 },
  { name: "Internal Process", value: 200 },
];

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function DistributionChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              borderRadius: '8px', 
              border: '1px solid var(--border)', 
              backgroundColor: 'var(--background)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }} 
            itemStyle={{ color: 'var(--foreground)' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', color: 'var(--muted-foreground)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
