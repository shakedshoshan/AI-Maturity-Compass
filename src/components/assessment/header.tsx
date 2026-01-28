'use client';

import Link from 'next/link';
import { OrtLogo } from './icons';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BarChart, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  progress?: number;
  currentQuestion?: number;
  totalQuestions?: number;
  title?: string;
  maxWidth?: '5xl' | '7xl';
  showAnalyticsButton?: boolean;
  showHomeButton?: boolean;
}

export default function Header({ 
  progress = 0, 
  currentQuestion, 
  totalQuestions,
  title = 'אורטקן AI',
  maxWidth = '5xl',
  showAnalyticsButton = false,
  showHomeButton = false
}: HeaderProps) {
  const maxWidthClass = maxWidth === '7xl' ? 'max-w-7xl' : 'max-w-5xl';

  return (
    <header className="glass-dark sticky top-0 z-50 px-6 py-4">
      <div className={`${maxWidthClass} mx-auto flex items-center justify-center relative`}>
        <div className="flex items-center gap-4">
          <div className="w-24 h-14 rounded-xl glass flex items-center justify-center glow">
            <OrtLogo className="h-12 w-32" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">{title}</h1>
          </div>
        </div>
        <div className="absolute left-0 flex items-center gap-3">
          {showHomeButton && (
            <Link href="/">
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 text-blue-300 hover:text-white glass hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
                חזרה לדף הבית
              </Button>
            </Link>
          )}
          {showAnalyticsButton && (
            <Link href="/analytics">
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 text-blue-300 hover:text-white glass hover:bg-white/10"
              >
                <BarChart className="w-4 h-4" />
                ניתוח נתונים
              </Button>
            </Link>
          )}
        </div>
        {progress > 0 && currentQuestion && totalQuestions && (
          <div className="hidden md:flex items-center gap-3 absolute right-0">
            <span className="text-sm text-blue-300/70">התקדמות</span>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <Progress value={progress} className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500 progress-glow" indicatorClassName="bg-transparent" />
            </div>
            <span className="text-sm font-medium text-blue-300">{currentQuestion}/{totalQuestions}</span>
          </div>
        )}
      </div>
    </header>
  );
}