import { cn } from "@/lib/utils";

export const OrtLogo = ({ className }: { className?: string }) => (
  <img 
    src="/ort-logo.png"
    alt="ORT Logo"
    className={cn("h-20 w-32 rounded-xl", className)}
  />
);

export const CubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);
