'use client';

import { questions } from '@/lib/assessment-data';
import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface RadarChartProps {
  answers: number[];
}

const RadarChart = ({ answers }: RadarChartProps) => {
  const chartData = questions.map((q, i) => ({
    subject: q.category,
    A: answers[i],
    B: 5, // Benchmark
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
        <defs>
            <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgba(0, 64, 128, 0.5)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="rgba(0, 64, 128, 0.2)" stopOpacity={0.2}/>
            </linearGradient>
        </defs>
        <PolarGrid gridType="polygon" stroke="rgba(100, 116, 139, 0.3)" />
        <PolarAngleAxis 
          dataKey="subject" 
          tick={{ fill: '#334155', fontSize: 11, fontFamily: 'Heebo', fontWeight: 500 }} 
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 5]} 
          tickCount={6} 
          tick={{ fill: '#64748b', fontSize: 10 }} 
          axisLine={false} 
        />
        <Radar 
          name="הציון שלך" 
          dataKey="A" 
          stroke="#004080" 
          strokeWidth={2}
          fill="url(#radarFill)" 
          fillOpacity={0.6} 
        />
        <Radar 
          name="יעד" 
          dataKey="B" 
          stroke="rgba(16, 185, 129, 0.7)" 
          strokeWidth={2}
          fill="transparent" 
          strokeDasharray="5 5" 
        />
        <Tooltip
            contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: 'rgba(0, 64, 128, 0.2)',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                color: '#1e293b',
            }}
            labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
            itemStyle={{ color: '#004080' }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
};

export default RadarChart;
