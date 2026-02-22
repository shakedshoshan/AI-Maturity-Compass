'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, ReferenceLine } from 'recharts';

interface ScoreDistributionChartProps {
  distribution: number[];
  currentScore: number;
  averageScore: number;
}

const ScoreDistributionChart = ({ distribution, currentScore, averageScore }: ScoreDistributionChartProps) => {
  // Transform distribution data for chart
  const chartData = distribution.map((count, index) => {
    const minScore = index * 10;
    const maxScore = index === 10 ? 105 : (index + 1) * 10 - 1;
    return {
      range: `${minScore}-${maxScore}`,
      count,
      minScore,
      maxScore,
    };
  });

  // Find which bucket the current score falls into
  const currentBucket = Math.min(Math.floor(currentScore / 10), 10);
  const maxCount = Math.max(...distribution, 1); // Avoid division by zero

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0, 64, 128, 0.7)" />
            <stop offset="100%" stopColor="rgba(0, 64, 128, 0.3)" />
          </linearGradient>
          <linearGradient id="currentBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(124, 58, 237, 0.85)" />
            <stop offset="100%" stopColor="rgba(124, 58, 237, 0.45)" />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="range" 
          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Heebo' }}
          axisLine={{ stroke: '#cbd5e1' }}
          tickLine={{ stroke: '#cbd5e1' }}
        />
        <YAxis 
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={{ stroke: '#cbd5e1' }}
          tickLine={{ stroke: '#cbd5e1' }}
          width={30}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: 'rgba(0, 64, 128, 0.2)',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            color: '#1e293b',
          }}
          labelStyle={{ color: '#1e293b', fontWeight: 'bold', fontSize: 12 }}
          itemStyle={{ color: '#004080', fontSize: 12 }}
          formatter={(value: number) => [value, 'מספר הערכות']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={index === currentBucket ? 'url(#currentBarGradient)' : 'url(#barGradient)'}
            />
          ))}
        </Bar>
        {/* Reference line for average score */}
        {averageScore > 0 && chartData.length > 0 && (
          <ReferenceLine 
            x={chartData[Math.min(Math.floor(averageScore / 10), 10)]?.range}
            stroke="rgba(16, 185, 129, 0.8)"
            strokeDasharray="3 3"
            strokeWidth={2}
            label={{ value: 'ממוצע', position: 'top', fill: '#059669', fontSize: 10, fontWeight: 600 }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ScoreDistributionChart;
