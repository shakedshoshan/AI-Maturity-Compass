'use client';

import { useMemo } from 'react';
import { useFirestore } from '../provider';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from './use-collection';
import type { AssessmentRecord } from '@/lib/types';

export interface AssessmentStats {
  totalAssessments: number;
  averageScore: number;
  percentile: number;
  scoreDistribution: number[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and calculate statistics for all assessments
 * @param currentScore - The current user's score to calculate percentile
 * @returns Assessment statistics including average, percentile, and distribution
 */
export function useAssessmentStats(currentScore: number): AssessmentStats {
  const firestore = useFirestore();
  
  const assessmentsQuery = useMemo(() => {
    if (!firestore) return null;
    try {
      return query(collection(firestore, 'assessments'), orderBy('createdAt', 'desc'));
    } catch (error) {
      console.error('Error creating assessments query:', error);
      return null;
    }
  }, [firestore]);

  const { data: assessments, loading, error } = useCollection<AssessmentRecord>(assessmentsQuery);

  const stats = useMemo(() => {
    if (!assessments || assessments.length === 0) {
      return {
        totalAssessments: 0,
        averageScore: 0,
        percentile: 0,
        scoreDistribution: Array(10).fill(0), // 10 buckets: 0-5, 6-10, 11-15, ..., 46-50
        loading,
        error,
      };
    }

    // Calculate average score
    const totalScore = assessments.reduce((sum, a) => sum + a.totalScore, 0);
    const averageScore = totalScore / assessments.length;

    // Calculate percentile
    const scores = assessments.map(a => a.totalScore).sort((a, b) => a - b);
    const scoresBelow = scores.filter(s => s < currentScore).length;
    const percentile = scores.length > 0 ? Math.round((scoresBelow / scores.length) * 100) : 0;

    // Calculate score distribution (10 buckets: 0-5, 6-10, 11-15, ..., 46-50)
    const distribution = Array(10).fill(0);
    assessments.forEach(assessment => {
      const bucket = Math.min(Math.floor(assessment.totalScore / 5), 9);
      distribution[bucket]++;
    });

    return {
      totalAssessments: assessments.length,
      averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal
      percentile,
      scoreDistribution: distribution,
      loading,
      error,
    };
  }, [assessments, currentScore, loading, error]);

  return stats;
}
