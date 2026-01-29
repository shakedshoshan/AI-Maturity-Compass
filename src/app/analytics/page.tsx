'use client';

import * as React from 'react';
import { questions, maturityLevels } from '@/lib/assessment-data';
import type { AssessmentRecord } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BarChart, Activity, Users, TrendingUp, MapPin, Briefcase, Calendar, Target } from 'lucide-react';

import Header from '@/components/assessment/header';
import RadarChart from '@/components/assessment/radar-chart';
import ScoreDistributionChart from '@/components/assessment/score-distribution-chart';
import Link from 'next/link';

interface AnalyticsStats {
  totalAssessments: number;
  averageScore: number;
  scoreDistribution: number[];
  averageAnswers: number[];
  maturityLevelDistribution: Record<string, number>;
  cityDistribution: Record<string, number>;
  roleDistribution: Record<string, number>;
  recentAssessments: AssessmentRecord[];
  loading: boolean;
  error: Error | null;
}

function useAnalyticsStats(): AnalyticsStats {
  const firestore = useFirestore();
  
  const assessmentsQuery = React.useMemo(() => {
    if (!firestore) return null;
    try {
      return query(collection(firestore, 'assessments'), orderBy('createdAt', 'desc'));
    } catch (error) {
      console.error('Error creating assessments query:', error);
      return null;
    }
  }, [firestore]);

  const { data: assessments, loading, error } = useCollection<AssessmentRecord>(assessmentsQuery);

  const stats = React.useMemo(() => {
    if (!assessments || assessments.length === 0) {
      return {
        totalAssessments: 0,
        averageScore: 0,
        scoreDistribution: Array(10).fill(0),
        averageAnswers: Array(questions.length).fill(0),
        maturityLevelDistribution: {},
        cityDistribution: {},
        roleDistribution: {},
        recentAssessments: [],
        loading,
        error,
      };
    }

    // Calculate average score
    const totalScore = assessments.reduce((sum, a) => sum + a.totalScore, 0);
    const averageScore = totalScore / assessments.length;

    // Calculate score distribution (10 buckets: 0-5, 6-10, 11-15, ..., 46-50)
    const scoreDistribution = Array(10).fill(0);
    assessments.forEach(assessment => {
      const bucket = Math.min(Math.floor(assessment.totalScore / 5), 9);
      scoreDistribution[bucket]++;
    });

    // Calculate average answers per question
    const averageAnswers = Array(questions.length).fill(0);
    assessments.forEach(assessment => {
      assessment.answers.forEach((answer, index) => {
        averageAnswers[index] += answer;
      });
    });
    averageAnswers.forEach((sum, index) => {
      averageAnswers[index] = sum / assessments.length;
    });

    // Calculate maturity level distribution
    const maturityLevelDistribution: Record<string, number> = {};
    assessments.forEach(assessment => {
      maturityLevelDistribution[assessment.level] = (maturityLevelDistribution[assessment.level] || 0) + 1;
    });

    // Calculate city distribution
    const cityDistribution: Record<string, number> = {};
    assessments.forEach(assessment => {
      if (assessment.city) {
        cityDistribution[assessment.city] = (cityDistribution[assessment.city] || 0) + 1;
      }
    });

    // Calculate role distribution
    const roleDistribution: Record<string, number> = {};
    assessments.forEach(assessment => {
      if (assessment.role) {
        roleDistribution[assessment.role] = (roleDistribution[assessment.role] || 0) + 1;
      }
    });

    return {
      totalAssessments: assessments.length,
      averageScore: Math.round(averageScore * 10) / 10,
      scoreDistribution,
      averageAnswers,
      maturityLevelDistribution,
      cityDistribution,
      roleDistribution,
      recentAssessments: assessments.slice(0, 10),
      loading,
      error,
    };
  }, [assessments, loading, error]);

  return stats;
}

export default function AnalyticsPage() {
  const stats = useAnalyticsStats();

  if (stats.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <Header title="אורטקן AI" maxWidth="7xl" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="glass-dark rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">טוען נתונים...</h2>
            <p className="text-slate-500">אנא המתן בזמן שאנחנו טוענים את נתוני הניתוח</p>
          </div>
        </main>
      </div>
    );
  }

  if (stats.error || stats.totalAssessments === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <Header title="אורטקן AI" maxWidth="7xl" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="glass-dark rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">אין נתונים זמינים</h2>
            <p className="text-slate-500 mb-6">
              {stats.totalAssessments === 0 
                ? 'עדיין לא בוצעו הערכות במערכת' 
                : 'לא ניתן לטעון נתוני ניתוח'}
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-[#004080] to-[#0066cc] text-white rounded-xl hover:scale-105 transition-all focus-visible:ring-2 focus-visible:ring-[#004080] focus-visible:ring-offset-2">
                חזרה לדף הבית
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <Header title="אורטקן AI" maxWidth="7xl" showHomeButton={true} />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Title */}
          <div className="glass-dark rounded-3xl p-8">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">ניתוח נתונים כללי</h1>
              <p className="text-slate-500">מבט מקיף על כל ההערכות במערכת</p>
            </div>
          </div>

          {/* Overall Statistics */}
          <OverallStatistics stats={stats} />

          {/* Score Distribution */}
          <ScoreDistributionSection stats={stats} />

          {/* Average Radar Chart */}
          <AverageRadarSection stats={stats} />

          {/* Maturity Level Distribution */}
          <MaturityLevelSection stats={stats} />

          {/* Demographics */}
          <DemographicsSection stats={stats} />

        </div>
      </main>
    </div>
  );
}

function OverallStatistics({ stats }: { stats: AnalyticsStats }) {
  const highestScore = Math.max(...stats.recentAssessments.map(a => a.totalScore), 0);
  const lowestScore = Math.min(...stats.recentAssessments.map(a => a.totalScore), 50);
  
  return (
    <div className="glass-dark rounded-3xl p-8">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <Activity className="w-6 h-6 text-[#004080]" /> סטטיסטיקות כלליות
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-[#004080]" />
            <span className="text-sm text-[#004080] font-semibold">סה"כ הערכות</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{stats.totalAssessments}</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-purple-600 font-semibold">ציון ממוצע</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{stats.averageScore}</div>
          <div className="text-xs text-slate-500 mt-1">מתוך 50</div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-emerald-600 font-semibold">ציון הגבוה ביותר</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{highestScore}</div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-amber-600 font-semibold">ציון הנמוך ביותר</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{lowestScore}</div>
        </div>
      </div>
    </div>
  );
}

function ScoreDistributionSection({ stats }: { stats: AnalyticsStats }) {
  return (
    <div className="glass-dark rounded-3xl p-8">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <BarChart className="w-6 h-6 text-[#004080]" /> התפלגות ציונים
      </h3>
      <div className="h-[350px]">
        <ScoreDistributionChart 
          distribution={stats.scoreDistribution}
          currentScore={stats.averageScore} // Use average as reference
          averageScore={stats.averageScore}
        />
      </div>
      <div className="flex justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#004080]/50 border border-[#004080]"></div>
          <span className="text-slate-600">התפלגות</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border border-emerald-500 border-dashed"></div>
          <span className="text-slate-600">ממוצע</span>
        </div>
      </div>
    </div>
  );
}

function AverageRadarSection({ stats }: { stats: AnalyticsStats }) {
  return (
    <div className="glass-dark rounded-3xl p-8">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <Target className="w-6 h-6 text-[#004080]" /> מפת תחומים - ביצועים ממוצעים
      </h3>
      <div className="relative h-[350px]">
        <RadarChart answers={stats.averageAnswers} />
      </div>
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#004080]/50 border border-[#004080]"></div>
          <span className="text-slate-600">ממוצע כללי</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-emerald-500 border-dashed"></div>
          <span className="text-slate-600">יעד (רמה 5)</span>
        </div>
      </div>
    </div>
  );
}

function MaturityLevelSection({ stats }: { stats: AnalyticsStats }) {
  const sortedLevels = Object.entries(stats.maturityLevelDistribution)
    .sort(([,a], [,b]) => b - a);

  return (
    <div className="glass-dark rounded-3xl p-8">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-[#004080]" /> התפלגות רמות בשלות
      </h3>
      <div className="space-y-4">
        {sortedLevels.map(([level, count], index) => {
          const percentage = Math.round((count / stats.totalAssessments) * 100);
          return (
            <div key={level} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-800 font-semibold">{level}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">{count} הערכות</span>
                  <span className="text-[#004080] font-bold">{percentage}%</span>
                </div>
              </div>
              <Progress 
                value={percentage} 
                className="h-2 bg-slate-200" 
                indicatorClassName="bg-gradient-to-r from-[#004080] to-[#00a0cc]"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DemographicsSection({ stats }: { stats: AnalyticsStats }) {
  const topCities = Object.entries(stats.cityDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
    
  const topRoles = Object.entries(stats.roleDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Cities */}
      <div className="glass-dark rounded-3xl p-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <MapPin className="w-6 h-6 text-[#004080]" /> התפלגות לפי ערים
        </h3>
        <div className="space-y-3">
          {topCities.map(([city, count]) => {
            const percentage = Math.round((count / stats.totalAssessments) * 100);
            return (
              <div key={city} className="flex items-center justify-between">
                <span className="text-slate-700 font-medium">{city}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">{count}</span>
                  <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#004080] to-[#00a0cc] rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roles */}
      <div className="glass-dark rounded-3xl p-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-[#004080]" /> התפלגות לפי תפקידים
        </h3>
        <div className="space-y-3">
          {topRoles.map(([role, count]) => {
            const percentage = Math.round((count / stats.totalAssessments) * 100);
            return (
              <div key={role} className="flex items-center justify-between">
                <span className="text-slate-700 font-medium">{role}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">{count}</span>
                  <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
