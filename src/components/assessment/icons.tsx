import { cn } from "@/lib/utils";

export const OrtLogo = ({ className }: { className?: string }) => (
  <img 
    src="/ort-logo.png"
    alt="ORT Logo"
    className={cn("h-20 w-32 rounded-xl border border-white/10 border-2 glass glow", className)}
  />
);

export const CubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="url(#iconGrad)" strokeWidth="1.5">
    <defs>
      <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "#60a5fa" }} />
        <stop offset="50%" style={{ stopColor: "#a78bfa" }} />
        <stop offset="100%" style={{ stopColor: "#f472b6" }} />
      </linearGradient>
    </defs>
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);
