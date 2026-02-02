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
    <header className="glass sticky top-0 z-50 px-6 py-4 border-b border-slate-200">
      <div className={`${maxWidthClass} mx-auto`}>
        {/* Mobile Layout */}
        <div className="flex md:hidden items-center justify-between">
          {/* Navigation buttons on the left for mobile */}
          <div className="flex items-center gap-2">
            {showHomeButton && (
              <Link href="/">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden xs:inline">חזרה</span>
                </Button>
              </Link>
            )}
            {showAnalyticsButton && (
              <Link href="/analytics">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <BarChart className="w-4 h-4" />
                  <span className="hidden xs:inline">ניתוח</span>
                </Button>
              </Link>
            )}
          </div>
          
          {/* Logo and title on the right for mobile */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold gradient-text">{title}</h1>
            </div>
            <OrtLogo className="h-10 w-auto" />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-center relative">
          <div className="flex items-center gap-4">
            <OrtLogo className="h-12 w-auto" />
            <div>
              <h1 className="text-xl font-bold gradient-text">מה בית הספר שלכם צריך בכדי להטמיע בינה מלאכותית בצורה אחראית פדגוגית ומשמעותית</h1>
            </div>
          </div>
          <div className="absolute left-0 flex items-center gap-3">
            {showHomeButton && (
              <Link href="/">
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500"
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
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <BarChart className="w-4 h-4" />
                  ניתוח נתונים
                </Button>
              </Link>
            )}
          </div>
          {progress > 0 && currentQuestion && totalQuestions && (
            <div className="flex items-center gap-3 absolute right-0">
              <span className="text-sm text-slate-500">התקדמות</span>
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                <Progress value={progress} className="h-full bg-gradient-to-r from-[#004080] to-[#0066cc] rounded-full transition-all duration-500" indicatorClassName="bg-transparent" />
              </div>
              <span className="text-sm font-semibold text-[#004080]">{currentQuestion}/{totalQuestions}</span>
            </div>
          )}
        </div>

        {/* Mobile Progress Bar */}
        {progress > 0 && currentQuestion && totalQuestions && (
          <div className="flex md:hidden items-center justify-center gap-2 mt-3">
            <span className="text-xs text-slate-500">התקדמות</span>
            <div className="flex-1 max-w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
              <Progress value={progress} className="h-full bg-gradient-to-r from-[#004080] to-[#0066cc] rounded-full transition-all duration-500" indicatorClassName="bg-transparent" />
            </div>
            <span className="text-xs font-semibold text-[#004080]">{currentQuestion}/{totalQuestions}</span>
          </div>
        )}
      </div>
    </header>
  );
}
