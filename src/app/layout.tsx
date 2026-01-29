import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import AnimatedBackground from '@/components/assessment/animated-background';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'אורטקן AI',
  description: 'כלי אבחון מתקדם למנהלי בתי ספר להערכת רמת הבשלות הארגונית בתחום הבינה המלאכותית לפי מודל ICMM',
  icons: {
    icon: '/ort-logo.png',
    shortcut: '/ort-logo.png',
    apple: '/ort-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <head>
        <link rel="icon" href="/ort-logo.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'h-full overflow-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 text-slate-900 font-body antialiased'
        )}
      >
        <FirebaseClientProvider>
          <div id="app" className="h-full w-full relative overflow-auto">
            <AnimatedBackground />
            <div className="relative z-10 min-h-full flex flex-col">
              {children}
            </div>
          </div>
          <Toaster />
        </FirebaseClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
