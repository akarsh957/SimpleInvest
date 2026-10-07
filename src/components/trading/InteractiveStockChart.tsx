"use client";

import { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface ChartDataPoint {
    datetime: string;
    close: number;
}

interface InteractiveStockChartProps {
    data: ChartDataPoint[];
    color?: string;
}

export function InteractiveStockChart({ data, color = "#10B981" }: InteractiveStockChartProps) {
    const formattedData = useMemo(() => {
        return [...data].reverse().map(item => ({
            ...item,
            // Format datetime to just the day or a short string
            displayDate: new Date(item.datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        }));
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-white/30">
                No chart data available
            </div>
        );
    }

    const min = Math.min(...formattedData.map(d => d.close));
    const max = Math.max(...formattedData.map(d => d.close));
    const padding = (max - min) * 0.1;

    return (
        <div className="w-full h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                        dataKey="displayDate" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} 
                        minTickGap={30}
                    />
                    <YAxis 
                        domain={[min - padding, max + padding]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} 
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(7, 9, 14, 0.9)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            backdropFilter: 'blur(8px)',
                            color: '#fff'
                        }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="close" 
                        stroke={color} 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorGradient)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
