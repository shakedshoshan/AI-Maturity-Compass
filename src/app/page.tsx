'use client';

import * as React from 'react';
import { questions, maturityLevels } from '@/lib/assessment-data';
import type { UserDetails } from '@/lib/types';
import { useFirestore, useAssessmentStats } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, BarChart, FileText, RefreshCcw, X, Zap, Target, Lightbulb, TrendingUp, ShieldCheck, Activity } from 'lucide-react';

import { OrtLogo, CubeIcon } from '@/components/assessment/icons';
import RadarChart from '@/components/assessment/radar-chart';
import ScoreDistributionChart from '@/components/assessment/score-distribution-chart';
import Header from '@/components/assessment/header';


type Screen = 'welcome' | 'question' | 'results';

// Main Application Component
export default function AssessmentPage() {
  return <AssessmentContent />;
}

function AssessmentContent() {
  const [screen, setScreen] = React.useState<Screen>('welcome');
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [answers, setAnswers] = React.useState<number[]>(() => Array(questions.length).fill(0));
  const [userDetails, setUserDetails] = React.useState<UserDetails>({ email: '', schoolName: '', city: '', role: '', emailConsent: false });

  const [isSummaryModalOpen, setSummaryModalOpen] = React.useState(false);
  
  const firestore = useFirestore();
  const { toast } = useToast();

  // Debug Firebase connection
  React.useEffect(() => {
    console.log('Firebase connection status:', {
      firestore: firestore ? 'Connected' : 'Not connected',
      firestoreType: firestore ? typeof firestore : 'undefined'
    });
  }, [firestore]);

  const startAssessment = (details: UserDetails) => {
    setUserDetails(details);
    setScreen('question');
  };

  const selectRating = (rating: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = rating;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setScreen('results');
      saveAssessment();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const restartAssessment = () => {
    setCurrentQuestion(0);
    setAnswers(Array(questions.length).fill(0));
    setUserDetails({ email: '', schoolName: '', city: '', role: '', emailConsent: false });
    setScreen('welcome');
  };

  const saveAssessment = () => {
    const totalScore = answers.reduce((a, b) => a + b, 0);
    const level = maturityLevels.find(l => totalScore >= l.min && totalScore <= l.max);
    
    if (!level) {
      console.error('Could not determine maturity level');
      return;
    }

    if (!firestore) {
      console.warn('Firestore not available, assessment not saved to database');
      toast({
        variant: "destructive",
        title: "שירות הנתונים לא זמין",
        description: "ההערכה הושלמה אך לא נשמרה במערכת.",
      });
      return;
    }

    const assessmentData = {
      createdAt: new Date().toISOString(),
      answers: [...answers],
      totalScore,
      level: level.name,
      ...userDetails,
    };
    
    try {
      const assessmentCollection = collection(firestore, 'assessments');
      addDoc(assessmentCollection, assessmentData)
        .then(() => {
          toast({
            title: "הערכה נשמרה בהצלחה",
            description: "התוצאות שלך נשמרו במערכת.",
          });
        })
        .catch((error) => {
          console.error('Error saving assessment:', error);
          toast({
            variant: "destructive",
            title: "שגיאה בשמירה",
            description: "לא ניתן היה לשמור את ההערכה. אנא נסה שוב.",
          });
        });
    } catch (error) {
      console.error('Error creating collection reference:', error);
      toast({
        variant: "destructive",
        title: "שגיאה בשמירה",
        description: "בעיה בחיבור למערכת הנתונים.",
      });
    }
  };

  const progress = (currentQuestion + 1) / questions.length * 100;

  return (
    <>
      <Header 
        progress={screen === 'question' ? progress : 0} 
        currentQuestion={currentQuestion + 1} 
        totalQuestions={questions.length}
        showAnalyticsButton={true}
      />
      <main className="flex-1 flex items-center justify-center p-6">
        <div id="content-container" className="w-full max-w-3xl">
          {screen === 'welcome' && <WelcomeScreen onStart={startAssessment} />}
          {screen === 'question' && (
            <QuestionScreen
              question={questions[currentQuestion]}
              questionNumber={currentQuestion + 1}
              totalQuestions={questions.length}
              answer={answers[currentQuestion]}
              onSelectRating={selectRating}
              onNext={nextQuestion}
              onPrev={prevQuestion}
            />
          )}
          {screen === 'results' && (
            <ResultsScreen
              answers={answers}
              onRestart={restartAssessment}
              onShowSummary={() => setSummaryModalOpen(true)}
            />
          )}
        </div>
      </main>
      
      <SummaryModal 
        isOpen={isSummaryModalOpen} 
        onClose={() => setSummaryModalOpen(false)} 
        answers={answers} 
        userDetails={userDetails}
      />
    </>
  );
}

// Sub-components for each screen

function WelcomeScreen({ onStart }: { onStart: (details: UserDetails) => void }) {
  const [details, setDetails] = React.useState<UserDetails>({ email: '', schoolName: '', city: '', role: '', emailConsent: false });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(details);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setDetails(prev => ({...prev, [id]: value}));
  }

  const stats = [
    { value: 10, label: 'תחומים' },
    { value: 5, label: 'רמות בשלות' },
    { value: 50, label: 'ניקוד מקסימלי' },
    { value: 5, label: 'דקות' },
  ];

  return (
    <div className="animate-scale-in">
      <div className="glass-dark rounded-3xl p-10 text-center glow">
        <div className="mb-8">
          <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-[#004080] to-[#0066cc] flex items-center justify-center mb-6 animate-float shadow-lg">
            <CubeIcon className="w-16 h-16" />
          </div>
          <h2 className="text-4xl font-bold mb-4 gradient-text glow-text">מדד הבינה המלאכותית</h2>
          <p className="text-xl text-[#004080] font-medium mb-2">AI Intelligence Index</p>
          <p className="text-slate-600 max-w-lg mx-auto leading-relaxed">כלי אבחון מתקדם למנהלי בתי ספר להערכת רמת הבשלות הארגונית בתחום הבינה המלאכותית לפי מודל ICMM</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
             <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="text-3xl font-bold text-[#004080]">{stat.value}</div>
                <div className="text-sm text-slate-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8 space-y-4">
          <div className="text-right">
            <Label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">כתובת אימייל</Label>
            <Input 
              type="email" 
              id="email" 
              value={details.email} 
              onChange={handleInputChange} 
              className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#004080] focus:ring-2 focus:ring-[#004080]/20 transition-all placeholder:text-slate-400" 
              placeholder="לדוגמה: manager@school.edu.il" 
              required 
              aria-describedby="email-description"
            />
            <div className="flex items-center gap-2 mt-3 text-right">
              <Label htmlFor="emailConsent" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
                אני מסכים/ה לקבל עדכונים באימייל מאורט
              </Label>
              <Checkbox 
                id="emailConsent" 
                checked={details.emailConsent} 
                onCheckedChange={(checked) => setDetails(prev => ({...prev, emailConsent: checked === true}))}
                className="border-slate-400 data-[state=checked]:bg-[#004080] data-[state=checked]:border-[#004080]"
              />
            </div>
          </div>
          <div className="text-right">
            <Label htmlFor="schoolName" className="block text-sm font-semibold text-slate-700 mb-2">שם בית הספר</Label>
            <Input 
              type="text" 
              id="schoolName" 
              value={details.schoolName} 
              onChange={handleInputChange} 
              className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#004080] focus:ring-2 focus:ring-[#004080]/20 transition-all placeholder:text-slate-400" 
              placeholder="לדוגמה: אורט תל אביב" 
              required 
            />
          </div>
          <div className="text-right">
            <Label htmlFor="city" className="block text-sm font-semibold text-slate-700 mb-2">עיר</Label>
            <Input 
              type="text" 
              id="city" 
              value={details.city} 
              onChange={handleInputChange} 
              className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#004080] focus:ring-2 focus:ring-[#004080]/20 transition-all placeholder:text-slate-400" 
              placeholder="לדוגמה: תל אביב" 
              required 
            />
          </div>
          <div className="text-right">
            <Label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-2">תפקיד</Label>
            <Input 
              type="text" 
              id="role" 
              value={details.role} 
              onChange={handleInputChange} 
              className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#004080] focus:ring-2 focus:ring-[#004080]/20 transition-all placeholder:text-slate-400" 
              placeholder="לדוגמה: מנהל/ת בית הספר" 
              required 
            />
          </div>
          <Button 
            type="submit" 
            className="group relative px-10 py-4 h-auto bg-gradient-to-r from-[#004080] to-[#0066cc] rounded-2xl font-bold text-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 focus-visible:ring-2 focus-visible:ring-[#004080] focus-visible:ring-offset-2"
          >
            <span className="relative z-10 flex items-center gap-3">התחל הערכה
              <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-2 transition-transform" />
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}

function QuestionScreen({ question, questionNumber, totalQuestions, answer, onSelectRating, onNext, onPrev }: any) {
  const isFirst = questionNumber === 1;
  const isLast = questionNumber === totalQuestions;
  
  return (
    <div className="animate-slide-up">
      <div className="glass-dark rounded-3xl p-8 glow">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#004080] to-[#0066cc] flex items-center justify-center text-2xl font-bold text-white shadow-lg">
            {questionNumber}
          </div>
          <div className="flex-1">
            <div className="text-sm text-[#0066cc] font-semibold mb-1">{question.category}</div>
            <h3 className="text-xl font-bold text-slate-800">{question.title}</h3>
          </div>
        </div>

        <div className="mb-10">
          <p className="text-lg text-slate-700 leading-relaxed mb-8">{question.text}</p>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-slate-500 font-medium px-2">
              <span>לא קיים</span>
              <span>מלא</span>
            </div>
            <div className="flex justify-between gap-1 sm:gap-3" role="radiogroup" aria-label="דירוג">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => onSelectRating(rating)}
                  role="radio"
                  aria-checked={answer === rating}
                  aria-label={`דירוג ${rating}`}
                  className={`rating-btn flex-1 h-12 sm:h-16 rounded-xl text-xl font-bold transition-all duration-300 hover:scale-110 focus-visible:ring-2 focus-visible:ring-[#004080] focus-visible:ring-offset-2 ${
                    answer === rating 
                      ? 'bg-gradient-to-r from-[#004080] to-[#0066cc] text-white scale-110 shadow-lg shadow-blue-500/30' 
                      : 'bg-slate-100 border-2 border-slate-300 text-slate-700 hover:bg-slate-200 hover:border-[#004080]/30'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button 
            onClick={onPrev} 
            disabled={isFirst} 
            variant="ghost" 
            className="nav-btn flex items-center gap-2 px-6 py-3 h-auto bg-slate-100 border border-slate-300 rounded-xl font-medium text-slate-700 transition-all hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#004080]"
          >
            <ArrowRight className="w-5 h-5" /> הקודם
          </Button>
          <Button 
            onClick={onNext} 
            disabled={answer === 0} 
            className="nav-btn flex items-center gap-2 px-6 py-3 h-auto bg-gradient-to-r from-[#004080] to-[#0066cc] text-white rounded-xl font-medium transition-all hover:scale-105 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[#004080] focus-visible:ring-offset-2"
          >
            {isLast ? 'סיום' : 'הבא'} <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScoreComparisonSection({ currentScore }: { currentScore: number }) {
  const stats = useAssessmentStats(currentScore);

  if (stats.loading) {
    return (
      <div className="glass-dark rounded-3xl p-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <Activity className="w-6 h-6 text-[#004080]" /> השוואה לכל ההערכות
        </h3>
        <div className="text-center py-8">
          <p className="text-slate-500">טוען נתוני השוואה...</p>
        </div>
      </div>
    );
  }

  if (stats.error || stats.totalAssessments === 0) {
    return (
      <div className="glass-dark rounded-3xl p-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <Activity className="w-6 h-6 text-[#004080]" /> השוואה לכל ההערכות
        </h3>
        <div className="text-center py-8">
          <p className="text-slate-500">
            {stats.totalAssessments === 0 
              ? 'עדיין לא בוצעו הערכות נוספות להשוואה' 
              : 'לא ניתן לטעון נתוני השוואה'}
          </p>
        </div>
      </div>
    );
  }

  const scoreDifference = currentScore - stats.averageScore;
  const isAboveAverage = scoreDifference > 0;
  const differencePercent = stats.averageScore > 0 
    ? Math.abs((scoreDifference / stats.averageScore) * 100).toFixed(1)
    : '0';

  return (
    <div className="glass-dark rounded-3xl p-8">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <Activity className="w-6 h-6 text-[#004080]" /> השוואה לכל ההערכות
      </h3>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Statistics */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
            <div className="text-sm text-[#004080] font-semibold mb-4">הציון שלך לעומת הממוצע</div>
            <div className="flex items-end gap-4 mb-4">
              <div>
                <div className="text-3xl font-bold text-slate-800">{currentScore}</div>
                <div className="text-xs text-slate-500 mt-1">הציון שלך</div>
              </div>
              <div className="text-2xl text-slate-400">vs</div>
              <div>
                <div className="text-3xl font-bold text-[#004080]">{stats.averageScore.toFixed(1)}</div>
                <div className="text-xs text-slate-500 mt-1">ממוצע כל ההערכות</div>
              </div>
            </div>
            <div className={`flex items-center gap-2 text-sm font-medium ${isAboveAverage ? 'text-emerald-600' : 'text-amber-600'}`}>
              <TrendingUp className={`w-4 h-4 ${!isAboveAverage && 'rotate-180'}`} />
              <span>
                {isAboveAverage ? 'גבוה ב' : 'נמוך ב'} {Math.abs(scoreDifference).toFixed(1)} נקודות ({differencePercent}%)
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="text-sm text-purple-700 font-semibold mb-2">דירוג אחוזוני</div>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-slate-800">{stats.percentile}</div>
              <div className="text-2xl text-purple-500">%</div>
              <div className="flex-1">
                <div className="text-sm text-slate-600">הציון שלך גבוה מ-{stats.percentile}% מההערכות</div>
                <Progress 
                  value={stats.percentile} 
                  className="h-2 mt-2 bg-slate-200" 
                  indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="flex flex-col">
          <div className="text-sm text-[#004080] font-semibold mb-4">התפלגות ציונים</div>
          <div className="flex-1 min-h-[250px]">
            <ScoreDistributionChart 
              distribution={stats.scoreDistribution}
              currentScore={currentScore}
              averageScore={stats.averageScore}
            />
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500/50 border border-purple-400"></div>
              <span className="text-slate-600">הציון שלך</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border border-emerald-500 border-dashed"></div>
              <span className="text-slate-600">ממוצע</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsScreen({ answers, onRestart, onShowSummary }: any) {
  const [totalScore, setTotalScore] = React.useState(0);
  const [displayScore, setDisplayScore] = React.useState(0);

  const score = answers.reduce((a, b) => a + b, 0);
  const level = maturityLevels.find(l => score >= l.min && score <= l.max) || maturityLevels[0];
  const maturityPercent = ((score - 10) / 40) * 100;
  
  const minScore = Math.min(...answers.filter(a => a > 0));
  const weakestIndex = answers.indexOf(minScore);
  const strongestIndex = answers.indexOf(Math.max(...answers));

  const quickWin = questions[weakestIndex]?.quickWin || 'אין המלצות זמינות.';
  const strength = questions[strongestIndex]?.category || '-';
  const weakness = questions[weakestIndex]?.category || '-';

  React.useEffect(() => {
    setTotalScore(score);
    const scoreInterval = setInterval(() => {
      setDisplayScore(prev => {
        if (prev < score) return prev + 1;
        clearInterval(scoreInterval);
        return score;
      });
    }, 30);

    const circumference = 553;
    const offset = circumference - (score / 50) * circumference;
    const circle = document.getElementById('score-circle');
    if (circle) {
      setTimeout(() => {
        (circle as any).style.strokeDashoffset = offset;
      }, 100);
    }
    
    const maturityBar = document.getElementById('maturity-bar');
    if (maturityBar) {
      setTimeout(() => {
        (maturityBar as any).style.width = `${Math.max(5, maturityPercent)}%`;
      }, 300);
    }

    return () => clearInterval(scoreInterval);
  }, [answers, score, maturityPercent]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Score Summary Card */}
      <div className="glass-dark rounded-3xl p-8 glow">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-2">תוצאות ההערכה</h2>
          <p className="text-slate-600">ניתוח מקיף של רמת הבשלות הארגונית</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Score Circle */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <circle id="score-circle" cx="96" cy="96" r="88" fill="none" stroke="url(#scoreGrad)" strokeWidth="12" strokeLinecap="round" strokeDasharray="553" strokeDashoffset="553" className="transition-all duration-1000" />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#004080'}} />
                    <stop offset="50%" style={{stopColor: '#0066cc'}} />
                    <stop offset="100%" style={{stopColor: '#0088cc'}} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold gradient-text">{displayScore}</span>
                <span className="text-slate-500">מתוך 50</span>
              </div>
            </div>
          </div>
          {/* Maturity Level */}
          <div className="flex flex-col justify-center">
            <div className="mb-4">
              <span className="text-sm text-[#004080] font-semibold">רמת הבשלות שלך</span>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{level.name}</h3>
              <p className="text-slate-600 text-sm mt-2">{level.desc}</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>שלב 1</span> <span>שלב 2</span> <span>שלב 3</span> <span>שלב 4</span> <span>שלב 5</span>
              </div>
              <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
                <div id="maturity-bar" className="absolute inset-y-0 right-0 bg-gradient-to-l from-[#004080] via-[#0066cc] to-[#00a0cc] rounded-full transition-all duration-1000" style={{ width: '0%' }}></div>
                <div className="absolute inset-0 flex">
                  {[...Array(4)].map((_, i) => <div key={i} className="flex-1 border-l border-slate-300"></div>)}
                  <div className="flex-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="glass-dark rounded-3xl p-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <BarChart className="w-6 h-6 text-[#004080]" /> מפת תחומים - מבט השוואתי
        </h3>
        <div className="relative h-[350px]">
          <RadarChart answers={answers} />
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-[#004080]/50 border border-[#004080]"></div><span className="text-slate-600">הציון שלך</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border border-emerald-500 border-dashed"></div><span className="text-slate-600">יעד (רמה 5)</span></div>
        </div>
      </div>

      {/* Score Comparison Section */}
      <ScoreComparisonSection currentScore={score} />

       {/* Stage Feedback Card */}
       <div className="glass-dark rounded-3xl p-8 border-2 border-[#004080]/30">
        <div className="flex items-start gap-6 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#004080] to-[#00a0cc] flex items-center justify-center flex-shrink-0 shadow-lg">
             <Target className="w-9 h-9 text-white"/>
          </div>
          <div className="flex-1">
            <div className="text-sm text-[#0088cc] font-semibold mb-1">השלב שלכם</div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">{level.name}</h3>
          </div>
        </div>
        
        {/* תמונת מצב */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-300 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-blue-600"/>
            </div>
            <div>
              <h4 className="font-bold text-blue-800 mb-2 text-lg">תמונת מצב</h4>
              <p className="text-blue-900 text-base leading-relaxed">{level.situation}</p>
            </div>
          </div>
        </div>

        {/* המלצה להמשך */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-amber-600"/>
            </div>
            <div>
              <h4 className="font-bold text-amber-800 mb-2 text-lg">המלצה להמשך</h4>
              <p className="text-amber-900 text-base leading-relaxed">{level.nextStep}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Win & Domains */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="summary-card rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-amber-700 mb-2">Quick Win - צעד מיידי</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{quickWin}</p>
            </div>
          </div>
        </div>
        <div className="summary-card rounded-2xl p-6">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#004080]" /> נקודות חוזק וחולשה
          </h4>
          <div className="space-y-3">
            <div><span className="text-xs text-emerald-600 font-semibold">חוזק מרכזי</span><p className="text-slate-700 text-sm">{strength}</p></div>
            <div><span className="text-xs text-rose-600 font-semibold">תחום לשיפור</span><p className="text-slate-700 text-sm">{weakness}</p></div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <Button 
          onClick={onShowSummary} 
          variant="ghost" 
          className="flex items-center gap-2 px-6 py-3 h-auto bg-slate-100 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-200 transition-all focus-visible:ring-2 focus-visible:ring-[#004080]"
        >
          <FileText className="w-5 h-5" /> צפייה בסיכום
        </Button>
        <Button 
          onClick={onRestart} 
          className="flex items-center gap-2 px-6 py-3 h-auto bg-gradient-to-r from-[#004080] to-[#0066cc] text-white rounded-xl font-medium hover:scale-105 transition-all focus-visible:ring-2 focus-visible:ring-[#004080] focus-visible:ring-offset-2"
        >
          <RefreshCcw className="w-5 h-5" /> הערכה חוזרת
        </Button>
      </div>
    </div>
  );
}

// Modal Components
function SummaryModal({ isOpen, onClose, answers, userDetails }: any) {
  if (!isOpen) return null;

  const totalScore = answers.reduce((a, b) => a + b, 0);
  const level = maturityLevels.find(l => totalScore >= l.min && totalScore <= l.max) || maturityLevels[0];
  const minScore = Math.min(...answers.filter(a => a > 0));
  const weakestIndex = answers.indexOf(minScore);
  const recommendation = questions[weakestIndex]?.quickWin || 'אין המלצה.';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-gray-900 rounded-2xl max-w-2xl w-full max-h-[90%] overflow-auto shadow-2xl p-0 sm:rounded-2xl border-none">
        <DialogHeader className="p-8 pb-0">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <OrtLogo className="h-10 w-auto" />
              <div>
                <DialogTitle className="text-xl font-bold text-[#004080]">דוח אורטקן AI</DialogTitle>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-[#004080]"><X className="w-6 h-6" /></Button>
          </div>
        </DialogHeader>
        <div className="p-8 pt-0">
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                <div><span className="text-[#004080] font-semibold">אימייל:</span> <span className="text-slate-700 mr-2">{userDetails.email}</span></div>
                <div><span className="text-[#004080] font-semibold">בית הספר:</span> <span className="text-slate-700 mr-2">{userDetails.schoolName}</span></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-[#004080] font-semibold">עיר:</span> <span className="text-slate-700 mr-2">{userDetails.city}</span></div>
                <div><span className="text-[#004080] font-semibold">תפקיד:</span> <span className="text-slate-700 mr-2">{userDetails.role}</span></div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#004080] to-[#0066cc] rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div><p className="text-blue-200 text-sm mb-1">ציון כולל</p><p className="text-4xl font-bold">{totalScore}/50</p></div>
                <div className="text-left"><p className="text-blue-200 text-sm mb-1">רמת בשלות</p><p className="text-xl font-bold">{level.name}</p></div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-[#004080] mb-3">פירוט לפי תחומים</h3>
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm text-slate-700 font-medium">{q.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#004080] rounded-full" style={{ width: `${answers[i] * 20}%` }}></div>
                      </div>
                      <span className="text-sm font-bold text-[#004080] w-6 text-center">{answers[i]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-300">
              <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5" /> המלצה מרכזית
              </h3>
              <p className="text-amber-900 text-sm">{recommendation}</p>
            </div>
            <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-200">
              <p>נוצר על ידי אורטקן AI | רשת אורט ישראל</p>
              <p>{new Date().toLocaleDateString('he-IL')}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
