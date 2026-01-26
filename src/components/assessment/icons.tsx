import { cn } from "@/lib/utils";

export const OrtLogo = ({ className, fill = "url(#logoGrad)" }: { className?: string, fill?: string }) => (
  <svg viewBox="0 0 100 100" className={cn("w-10 h-10", className)}>
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "#60a5fa" }} />
        <stop offset="100%" style={{ stopColor: "#004080" }} />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGrad)" strokeWidth="4" />
    <text x="50" y="58" textAnchor="middle" fill={fill} fontSize="24" fontWeight="bold">
      אורט
    </text>
  </svg>
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
