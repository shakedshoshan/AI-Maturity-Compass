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
                <stop offset="5%" stopColor="rgba(96, 165, 250, 0.5)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="rgba(96, 165, 250, 0.5)" stopOpacity={0}/>
            </linearGradient>
        </defs>
        <PolarGrid gridType="polygon" stroke="rgba(255, 255, 255, 0.1)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255, 255, 255, 0.8)', fontSize: 11, fontFamily: 'Heebo' }} />
        <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 10 }} axisLine={false} />
        <Radar name="הציון שלך" dataKey="A" stroke="rgba(96, 165, 250, 1)" fill="url(#radarFill)" fillOpacity={0.6} />
        <Radar name="יעד" dataKey="B" stroke="rgba(16, 185, 129, 0.6)" fill="transparent" strokeDasharray="5 5" />
        <Tooltip
            contentStyle={{
                backgroundColor: 'rgba(0, 20, 50, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '1rem',
                backdropFilter: 'blur(10px)',
            }}
            labelStyle={{ color: 'white', fontWeight: 'bold' }}
            itemStyle={{ color: '#a78bfa' }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
};

export default RadarChart;
