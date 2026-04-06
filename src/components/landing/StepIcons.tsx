const iconStyle = "w-14 h-14 text-primary";

export const WritingHandIcon = ({ className = iconStyle }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Notebook */}
    <rect x="14" y="8" width="30" height="48" rx="3" stroke="currentColor" strokeWidth="2.2" fill="none" />
    <line x1="20" y1="8" x2="20" y2="56" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
    {/* Notebook lines */}
    <line x1="24" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
    <line x1="24" y1="26" x2="36" y2="26" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
    <line x1="24" y1="32" x2="34" y2="32" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
    {/* Hand holding pen */}
    <g transform="translate(30, 28) rotate(-35)">
      {/* Pen */}
      <rect x="-1.8" y="-18" width="3.6" height="24" rx="1.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <polygon points="0,-20 -2,-18 2,-18" fill="currentColor" />
      {/* Hand (simplified curved shape) */}
      <path d="M-5,6 Q-8,4 -8,0 Q-8,-2 -6,-2 L-3,0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M5,6 Q8,4 8,1 Q8,-1 6,-1 L3,0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M-5,6 Q-4,10 0,10 Q4,10 5,6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

export const InsightsTrendIcon = ({ className = iconStyle }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Document */}
    <path d="M12 8 h28 l10 10 v38 a3 3 0 0 1 -3 3 H15 a3 3 0 0 1 -3 -3 V8z" stroke="currentColor" strokeWidth="2.2" fill="none" />
    <path d="M40 8 v10 h10" stroke="currentColor" strokeWidth="2.2" fill="none" />
    {/* Rising chart line */}
    <polyline points="20,46 28,38 34,42 44,28" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {/* Arrow tip on chart */}
    <polyline points="40,27 44,28 43,32" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {/* Spark / insight rays */}
    <circle cx="44" cy="18" r="0" fill="currentColor" />
    <line x1="48" y1="14" x2="52" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="50" y1="20" x2="55" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="48" y1="26" x2="52" y2="29" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="48" cy="14" r="1.2" fill="currentColor" opacity="0.6" />
    <circle cx="50" cy="20" r="1.2" fill="currentColor" opacity="0.6" />
  </svg>
);

export const TherapyGrowthIcon = ({ className = iconStyle }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Therapist (larger person, left side) */}
    <circle cx="20" cy="16" r="6" stroke="currentColor" strokeWidth="2.2" fill="none" />
    <path d="M8 44 Q8 30 20 28 Q32 30 32 44" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" />

    {/* Patient (slightly smaller person, right side) */}
    <circle cx="42" cy="20" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M32 48 Q32 36 42 34 Q52 36 52 48" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />

    {/* Growth arrows above patient */}
    <line x1="38" y1="12" x2="38" y2="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <polyline points="36,6 38,4 40,6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />

    <line x1="44" y1="10" x2="44" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <polyline points="42,5 44,3 46,5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />

    {/* Conversation indicator (small speech dots between them) */}
    <circle cx="30" cy="22" r="1.2" fill="currentColor" opacity="0.5" />
    <circle cx="33" cy="24" r="1" fill="currentColor" opacity="0.35" />
    <circle cx="28" cy="25" r="0.8" fill="currentColor" opacity="0.25" />
  </svg>
);
