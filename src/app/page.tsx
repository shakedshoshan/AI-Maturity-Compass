'use client';

import * as React from 'react';
import type { User } from 'firebase/auth';
import { questions, maturityLevels } from '@/lib/assessment-data';
import type { UserDetails, AssessmentRecord } from '@/lib/types';
import { generateRecommendations } from '@/ai/flows/personalized-recommendations';
import { useUser, loginWithGoogle, logout, useAuth, useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, query, orderBy, limit } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, BarChart, FileText, Lock, RefreshCcw, X, Zap, Target, Lightbulb, TrendingUp, ShieldCheck, LogOut } from 'lucide-react';

import { OrtLogo, CubeIcon } from '@/components/assessment/icons';
import RadarChart from '@/components/assessment/radar-chart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


type Screen = 'welcome' | 'question' | 'results';

// Main Application Component that handles Auth
export default function AssessmentPage() {
  const { user, loading } = useUser();
  
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-white">טוען...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AuthenticatedContent user={user} />;
}

function LoginScreen() {
  const auth = useAuth();
  return (
    <>
      <Header progress={0} currentQuestion={0} totalQuestions={0} />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="animate-scale-in">
          <div className="glass-dark rounded-3xl p-10 text-center glow">
            <div className="mb-8">
              <div className="w-28 h-28 mx-auto rounded-full glass flex items-center justify-center mb-6 animate-float">
                <CubeIcon className="w-16 h-16" />
              </div>
              <h2 className="text-4xl font-bold mb-4 gradient-text glow-text">מדד הבינה המלאכותית</h2>
              <p className="text-xl text-blue-200/80 mb-2">AI Intelligence Index</p>
              <p className="text-blue-300/60 max-w-lg mx-auto leading-relaxed">כדי להתחיל את ההערכה, יש להתחבר באמצעות חשבון גוגל.</p>
            </div>
            <Button onClick={() => loginWithGoogle(auth)} className="group relative px-10 py-4 h-auto bg-gradient-to-r from-[#004080] to-[#0066cc] rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,64,128,0.6)]">
              <span className="relative z-10 flex items-center gap-3">
                התחברות עם גוגל
                <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-2 transition-transform" />
              </span>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}


function AuthenticatedContent({ user }: { user: User }) {
  const [screen, setScreen] = React.useState<Screen>('welcome');
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [answers, setAnswers] = React.useState<number[]>(() => Array(questions.length).fill(0));
  const [userDetails, setUserDetails] = React.useState<UserDetails>({ schoolName: '', city: '', role: '' });

  const [isSummaryModalOpen, setSummaryModalOpen] = React.useState(false);
  const [isAdminLoginOpen, setAdminLoginOpen] = React.useState(false);
  const [isAdminDashboardOpen, setAdminDashboardOpen] = React.useState(false);
  
  const firestore = useFirestore();
  const { toast } = useToast();

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
    setUserDetails({ schoolName: '', city: '', role: '' });
    setScreen('welcome');
  };

  const saveAssessment = async () => {
    const totalScore = answers.reduce((a, b) => a + b, 0);
    const level = maturityLevels.find(l => totalScore >= l.min && totalScore <= l.max);
    
    if (!level || !firestore) return;

    const assessmentData = {
      uid: user.uid,
      createdAt: new Date().toISOString(),
      answers: [...answers],
      totalScore,
      level: level.name,
      ...userDetails,
    };

    try {
      await addDoc(collection(firestore, 'assessments'), assessmentData);
    } catch (e) {
      console.error('Error saving assessment:', e);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Could not save your assessment. Please try again.",
      });
    }
  };

  const progress = (currentQuestion + 1) / questions.length * 100;

  return (
    <>
      <Header user={user} progress={screen === 'question' ? progress : 0} currentQuestion={currentQuestion + 1} totalQuestions={questions.length} />
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
              onShowAdmin={() => setAdminLoginOpen(true)}
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
      <AdminLoginModal 
        isOpen={isAdminLoginOpen} 
        onClose={() => setAdminLoginOpen(false)} 
        onSuccess={() => { setAdminLoginOpen(false); setAdminDashboardOpen(true); }}
      />
      <AdminDashboardModal 
        isOpen={isAdminDashboardOpen} 
        onClose={() => setAdminDashboardOpen(false)} 
      />
    </>
  );
}

// Sub-components for each screen

function Header({ user, progress, currentQuestion, totalQuestions }: { user?: User | null, progress: number; currentQuestion: number; totalQuestions: number }) {
  const auth = useAuth();
  return (
    <header className="glass-dark sticky top-0 z-50 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl glass flex items-center justify-center glow">
            <OrtLogo className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">מדד בשלות AI</h1>
            <p className="text-sm text-blue-300/70">מודל ICMM לבתי ספר</p>
          </div>
        </div>
        {progress > 0 && (
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-blue-300/70">התקדמות</span>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <Progress value={progress} className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500 progress-glow" indicatorClassName="bg-transparent" />
            </div>
            <span className="text-sm font-medium text-blue-300">{currentQuestion}/{totalQuestions}</span>
          </div>
        )}
        {user && (
          <div className="flex items-center gap-4">
            <Avatar className="w-10 h-10 border-2 border-blue-400/50">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <Button onClick={() => logout(auth)} variant="ghost" size="icon" className="glass rounded-xl text-blue-300 hover:text-white hover:bg-white/10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

function WelcomeScreen({ onStart }: { onStart: (details: UserDetails) => void }) {
  const [details, setDetails] = React.useState<UserDetails>({ schoolName: '', city: '', role: '' });
  
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
          <div className="w-28 h-28 mx-auto rounded-full glass flex items-center justify-center mb-6 animate-float">
            <CubeIcon className="w-16 h-16" />
          </div>
          <h2 className="text-4xl font-bold mb-4 gradient-text glow-text">מדד הבינה המלאכותית</h2>
          <p className="text-xl text-blue-200/80 mb-2">AI Intelligence Index</p>
          <p className="text-blue-300/60 max-w-lg mx-auto leading-relaxed">כלי אבחון מתקדם למנהלי בתי ספר להערכת רמת הבשלות הארגונית בתחום הבינה המלאכותית לפי מודל ICMM</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
             <div key={i} className="glass rounded-xl p-4">
                <div className="text-3xl font-bold text-blue-400">{stat.value}</div>
                <div className="text-xs text-blue-300/60">{stat.label}</div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8 space-y-4">
          <div className="text-right">
            <Label htmlFor="schoolName" className="block text-sm font-medium text-blue-300 mb-2">שם בית הספר</Label>
            <Input type="text" id="schoolName" value={details.schoolName} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-colors" placeholder="לדוגמה: אורט תל אביב" required />
          </div>
          <div className="text-right">
            <Label htmlFor="city" className="block text-sm font-medium text-blue-300 mb-2">עיר</Label>
            <Input type="text" id="city" value={details.city} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-colors" placeholder="לדוגמה: תל אביב" required />
          </div>
          <div className="text-right">
            <Label htmlFor="role" className="block text-sm font-medium text-blue-300 mb-2">תפקיד</Label>
            <Input type="text" id="role" value={details.role} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-colors" placeholder="לדוגמה: מנהל/ת בית הספר" required />
          </div>
          <Button type="submit" className="group relative px-10 py-4 h-auto bg-gradient-to-r from-[#004080] to-[#0066cc] rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,64,128,0.6)]">
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#004080] to-[#0066cc] flex items-center justify-center text-2xl font-bold shadow-lg">
            {questionNumber}
          </div>
          <div className="flex-1">
            <div className="text-sm text-blue-400 font-medium mb-1">{question.category}</div>
            <h3 className="text-xl font-bold text-white">{question.title}</h3>
          </div>
        </div>

        <div className="mb-10">
          <p className="text-lg text-blue-100/90 leading-relaxed mb-8">{question.text}</p>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-blue-300/70 px-2">
              <span>לא קיים</span>
              <span>מלא</span>
            </div>
            <div className="flex justify-between gap-1 sm:gap-3">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => onSelectRating(rating)}
                  className={`rating-btn flex-1 h-12 sm:h-16 rounded-xl glass text-xl font-bold transition-all duration-300 hover:scale-115 hover:shadow-[0_0_25px_rgba(96,165,250,0.6)] ${answer === rating ? 'bg-gradient-to-r from-[#004080] to-[#0066cc] scale-110 shadow-[0_0_30px_rgba(0,64,128,0.8)]' : ''}`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-blue-400/50 px-2">
              <span>1</span> <span>2</span> <span>3</span> <span>4</span> <span>5</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button onClick={onPrev} disabled={isFirst} variant="ghost" className="nav-btn flex items-center gap-2 px-6 py-3 h-auto glass rounded-xl font-medium transition-all hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white">
            <ArrowRight className="w-5 h-5" /> הקודם
          </Button>
          <Button onClick={onNext} disabled={answer === 0} className="nav-btn flex items-center gap-2 px-6 py-3 h-auto bg-gradient-to-r from-[#004080] to-[#0066cc] rounded-xl font-medium transition-all hover:scale-105 disabled:opacity-40">
            {isLast ? 'סיום' : 'הבא'} <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResultsScreen({ answers, onRestart, onShowSummary, onShowAdmin }: any) {
  const [totalScore, setTotalScore] = React.useState(0);
  const [displayScore, setDisplayScore] = React.useState(0);
  const [recommendation, setRecommendation] = React.useState('טוען המלצה...');

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

    const fetchRecommendation = async () => {
      try {
        const domainScores = questions.reduce((acc, q, i) => {
          acc[q.category] = answers[i];
          return acc;
        }, {} as Record<string, number>);

        const result = await generateRecommendations({
          maturityLevel: level.name,
          domainScores,
          weakness: weakness,
        });
        setRecommendation(result.recommendation);
      } catch (error) {
        console.error("Failed to get recommendation:", error);
        setRecommendation("לא ניתן היה לטעון המלצה כעת. נסה שוב מאוחר יותר.");
      }
    };

    fetchRecommendation();

    return () => clearInterval(scoreInterval);
  }, [answers, score, level.name, weakness, maturityPercent]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Score Summary Card */}
      <div className="glass-dark rounded-3xl p-8 glow">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-2">תוצאות ההערכה</h2>
          <p className="text-blue-300/70">ניתוח מקיף של רמת הבשלות הארגונית</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Score Circle */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                <circle id="score-circle" cx="96" cy="96" r="88" fill="none" stroke="url(#scoreGrad)" strokeWidth="12" strokeLinecap="round" strokeDasharray="553" strokeDashoffset="553" className="transition-all duration-1000" />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#60a5fa'}} />
                    <stop offset="50%" style={{stopColor: '#a78bfa'}} />
                    <stop offset="100%" style={{stopColor: '#f472b6'}} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold gradient-text">{displayScore}</span>
                <span className="text-blue-300/60">מתוך 50</span>
              </div>
            </div>
          </div>
          {/* Maturity Level */}
          <div className="flex flex-col justify-center">
            <div className="mb-4">
              <span className="text-sm text-blue-400 font-medium">רמת הבשלות שלך</span>
              <h3 className="text-2xl font-bold text-white mt-1">{level.name}</h3>
              <p className="text-blue-300/70 text-sm mt-2">{level.desc}</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-blue-300/60">
                <span>שלב 1</span> <span>שלב 2</span> <span>שלב 3</span> <span>שלב 4</span> <span>שלב 5</span>
              </div>
              <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
                <div id="maturity-bar" className="absolute inset-y-0 right-0 bg-gradient-to-l from-[#004080] via-blue-500 to-cyan-400 rounded-full transition-all duration-1000" style={{ width: '0%' }}></div>
                <div className="absolute inset-0 flex">
                  {[...Array(4)].map((_, i) => <div key={i} className="flex-1 border-l border-white/20"></div>)}
                  <div className="flex-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="glass-dark rounded-3xl p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <BarChart className="w-6 h-6 text-blue-400" /> מפת תחומים - מבט השוואתי
        </h3>
        <div className="relative h-[350px]">
          <RadarChart answers={answers} />
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-500/50 border border-blue-400"></div><span className="text-blue-300/70">הציון שלך</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border border-emerald-400 border-dashed"></div><span className="text-blue-300/70">יעד (רמה 5)</span></div>
        </div>
      </div>
      
       {/* Stage Feedback Card */}
       <div className="glass-dark rounded-3xl p-8 border-2 border-blue-400/30">
        <div className="flex items-start gap-6 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-lg">
             <Target className="w-9 h-9 text-white"/>
          </div>
          <div className="flex-1">
            <div className="text-sm text-cyan-400 font-medium mb-1">השלב שלכם</div>
            <h3 className="text-2xl font-bold text-white mb-3">{level.name}</h3>
            <p className="text-blue-200/90 leading-relaxed text-base">{level.desc}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-5 border border-amber-400/30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-amber-300"/>
            </div>
            <div>
              <h4 className="font-bold text-amber-300 mb-2 text-lg">היעד הבא שלכם</h4>
              <p className="text-amber-100/90 text-base leading-relaxed">{recommendation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Win & Domains */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="summary-card rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-amber-400 mb-2">Quick Win - צעד מיידי</h4>
              <p className="text-blue-200/80 text-sm leading-relaxed">{quickWin}</p>
            </div>
          </div>
        </div>
        <div className="summary-card rounded-2xl p-6">
          <h4 className="font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" /> נקודות חוזק וחולשה
          </h4>
          <div className="space-y-3">
            <div><span className="text-xs text-emerald-400 font-medium">חוזק מרכזי</span><p className="text-blue-200/80 text-sm">{strength}</p></div>
            <div><span className="text-xs text-rose-400 font-medium">תחום לשיפור</span><p className="text-blue-200/80 text-sm">{weakness}</p></div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <Button onClick={onShowSummary} variant="ghost" className="flex items-center gap-2 px-6 py-3 h-auto glass rounded-xl font-medium hover:bg-white/10 transition-all hover:text-white"><FileText className="w-5 h-5" /> צפייה בסיכום</Button>
        <Button onClick={onShowAdmin} variant="ghost" className="flex items-center gap-2 px-6 py-3 h-auto glass rounded-xl font-medium hover:bg-white/10 transition-all hover:text-white"><BarChart className="w-5 h-5" /> ריכוז נתונים</Button>
        <Button onClick={onRestart} className="flex items-center gap-2 px-6 py-3 h-auto bg-gradient-to-r from-[#004080] to-[#0066cc] rounded-xl font-medium hover:scale-105 transition-all"><RefreshCcw className="w-5 h-5" /> הערכה חוזרת</Button>
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
        <div className="p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#004080] flex items-center justify-center">
                <OrtLogo className="w-8 h-8" fill="white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#004080]">דוח בשלות AI</h2>
                <p className="text-sm text-gray-500">AI Intelligence Index - ICMM Model</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></Button>
          </div>
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><span className="text-blue-600 font-medium">בית הספר:</span> <span className="text-gray-700 mr-2">{userDetails.schoolName}</span></div>
                <div><span className="text-blue-600 font-medium">עיר:</span> <span className="text-gray-700 mr-2">{userDetails.city}</span></div>
                <div><span className="text-blue-600 font-medium">תפקיד:</span> <span className="text-gray-700 mr-2">{userDetails.role}</span></div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#004080] to-[#0066cc] rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div><p className="text-blue-200 text-sm mb-1">ציון כולל</p><p className="text-4xl font-bold">{totalScore}/50</p></div>
                <div className="text-left"><p className="text-blue-200 text-sm mb-1">רמת בשלות</p><p className="text-xl font-bold">{level.name}</p></div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-[#004080] mb-3">פירוט לפי תחומים</h3>
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{q.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#004080] rounded-full" style={{ width: `${answers[i] * 20}%` }}></div>
                      </div>
                      <span className="text-sm font-bold text-[#004080] w-6 text-center">{answers[i]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5" /> המלצה מרכזית
              </h3>
              <p className="text-amber-900 text-sm">{recommendation}</p>
            </div>
            <div className="text-center text-xs text-gray-400 pt-4 border-t">
              <p>נוצר על ידי מערכת מדד בשלות AI | רשת אורט ישראל</p>
              <p>{new Date().toLocaleDateString('he-IL')}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdminLoginModal({ isOpen, onClose, onSuccess }: any) {
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState(false);
  const ADMIN_CODE = '1212';
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === ADMIN_CODE) {
      onSuccess();
      setCode('');
      setError(false);
    } else {
      setError(true);
      setCode('');
    }
  };

  if(!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-dark rounded-2xl max-w-md w-full p-8 border-none sm:rounded-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#004080] to-[#0066cc] flex items-center justify-center mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">כניסת מנהל</h3>
          <p className="text-blue-300/70 text-sm">הזן קוד גישה לצפייה בריכוז נתונים</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="admin-code" className="sr-only">קוד גישה</Label>
            <Input type="password" id="admin-code" value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-4 py-3 bg-white/5 border-white/10 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:border-blue-400 transition-colors" placeholder="••••" maxLength={4} required />
            {error && <p className="mt-2 text-sm text-rose-400 text-center">קוד שגוי, נסה שוב</p>}
          </div>
          <div className="flex gap-3">
            <Button type="button" onClick={onClose} variant="ghost" className="flex-1 h-auto px-6 py-3 glass rounded-xl font-medium hover:bg-white/10 transition-all hover:text-white">ביטול</Button>
            <Button type="submit" className="flex-1 h-auto px-6 py-3 bg-gradient-to-r from-[#004080] to-[#0066cc] rounded-xl font-medium hover:scale-105 transition-all">כניסה</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdminDashboardModal({ isOpen, onClose }: any) {
    const firestore = useFirestore();
    const assessmentsQuery = React.useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'assessments'), orderBy('createdAt', 'desc'), limit(50));
    }, [firestore]);

    const { data: assessments, loading } = useCollection<AssessmentRecord>(assessmentsQuery);
    const { toast } = useToast();

    const clearData = () => {
        if(window.confirm('האם אתה בטוח שברצונך למחוק את כל נתוני ההערכות? פעולה זו אינה ניתנת לביטול.')) {
            toast({
                title: "Action Not Supported",
                description: "Clearing all data from the client is not supported in this version.",
            });
        }
    };

    if (!isOpen) return null;

    const totalAssessments = assessments?.length || 0;
    const avgScore = totalAssessments > 0 ? (assessments.reduce((sum, a) => sum + a.totalScore, 0) / totalAssessments).toFixed(1) : 0;
    
    const levelCounts: Record<string, number> = totalAssessments > 0 
        ? assessments.reduce((acc, a) => {
            acc[a.level] = (acc[a.level] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
        : {};
    const dominantLevel = totalAssessments > 0 ? Object.keys(levelCounts).reduce((a, b) => levelCounts[a] > levelCounts[b] ? a : b) : '-';

    const domainAverages = questions.map((_, idx) => {
        if(totalAssessments === 0 || !assessments) return 0;
        const sum = assessments.reduce((acc, a) => acc + a.answers[idx], 0);
        return sum / totalAssessments;
    });

    const weakestDomainIdx = domainAverages.indexOf(Math.min(...domainAverages));
    const weakestDomain = totalAssessments > 0 ? questions[weakestDomainIdx].category : '-';

    const stats = [
        { label: 'סה"כ הערכות', value: totalAssessments },
        { label: 'ממוצע ציונים', value: avgScore },
        { label: 'רמה דומיננטית', value: dominantLevel, small: true },
        { label: 'תחום חלש ביותר', value: weakestDomain, small: true },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-dark rounded-2xl max-w-6xl w-full max-h-[90vh] my-8 p-0 sm:rounded-2xl border-none flex flex-col">
                <div className="sticky top-0 glass-dark p-6 border-b border-white/10 flex items-center justify-between z-10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#004080] to-[#0066cc] flex items-center justify-center">
                            <BarChart className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">ריכוז נתונים - לוח בקרה</h2>
                            <p className="text-sm text-blue-300/70">סטטיסטיקות והערכות שבוצעו</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="w-6 h-6" /></Button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.map(stat => (
                            <div key={stat.label} className="summary-card rounded-xl p-4">
                                <div className="text-blue-400 text-sm mb-1">{stat.label}</div>
                                <div className={`${stat.small ? 'text-lg' : 'text-3xl'} font-bold text-white`}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="summary-card rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BarChart className="w-5 h-5 text-blue-400" /> ממוצעים לפי תחומים</h3>
                            <div className="space-y-3">
                                {loading && <p className="text-blue-300/60 text-center py-4">טוען נתונים...</p>}
                                {!loading && totalAssessments > 0 && assessments ? questions.map((q, idx) => (
                                    <div key={q.id} className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-blue-200">{q.category}</span>
                                                <span className="text-sm font-bold text-blue-400">{domainAverages[idx].toFixed(1)}</span>
                                            </div>
                                            <Progress value={domainAverages[idx] * 20} className="h-2 bg-white/10" indicatorClassName="bg-gradient-to-r from-blue-500 to-cyan-400" />
                                        </div>
                                    </div>
                                )) : !loading && <p className="text-blue-300/60 text-center py-4">לא בוצעו הערכות עדיין</p>}
                            </div>
                        </div>

                        <div className="summary-card rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400" /> הערכות אחרונות</h3>
                                <Button onClick={clearData} variant="ghost" size="sm" className="text-sm px-4 py-2 glass rounded-lg hover:bg-rose-500/20 hover:text-rose-300 transition-all">נקה נתונים</Button>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-auto pr-2">
                                {loading && <p className="text-blue-300/60 text-center py-4">טוען הערכות...</p>}
                                {!loading && totalAssessments > 0 && assessments ? assessments.map(a => (
                                    <div key={a.id} className="glass rounded-lg p-4 hover:bg-white/5 transition-all">
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg font-bold">{a.totalScore}</div>
                                              <div>
                                                  <div className="font-medium text-white">{a.level}</div>
                                                  <div className="text-xs text-blue-300/70">{new Date(a.createdAt).toLocaleString('he-IL')}</div>
                                              </div>
                                          </div>
                                        </div>
                                        <div className="flex gap-4 text-xs text-blue-300/60 pt-2 border-t border-white/5">
                                            <span><strong>בי"ס:</strong> {a.schoolName}</span>
                                            <span><strong>עיר:</strong> {a.city}</span>
                                        </div>
                                    </div>
                                )) : !loading && <p className="text-blue-300/60 text-center py-4">לא קיימות הערכות</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
