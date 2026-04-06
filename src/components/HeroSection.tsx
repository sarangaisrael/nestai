import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type TimeOfDay = "morning" | "noon" | "evening" | "night";

const getTimeOfDay = (): TimeOfDay => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "noon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};

// Morning: Large warm sun with soft rays and fluffy clouds
const MorningIllustration = () => (
  <svg viewBox="0 0 400 280" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
    <defs>
      <radialGradient id="sunCoreMorning" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFF9E6" />
        <stop offset="60%" stopColor="#FFE566" />
        <stop offset="100%" stopColor="#FFD93D" />
      </radialGradient>
      <radialGradient id="sunGlowMorning" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFE566" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#FFE566" stopOpacity="0" />
      </radialGradient>
      <filter id="cloudSoftMorning">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
      </filter>
    </defs>
    
    {/* Sun glow */}
    <circle cx="200" cy="120" r="120" fill="url(#sunGlowMorning)" />
    
    {/* Sun rays - soft */}
    <g opacity="0.25">
      <ellipse cx="200" cy="120" rx="100" ry="12" fill="#FFE566" transform="rotate(0 200 120)" />
      <ellipse cx="200" cy="120" rx="100" ry="12" fill="#FFE566" transform="rotate(45 200 120)" />
      <ellipse cx="200" cy="120" rx="100" ry="12" fill="#FFE566" transform="rotate(90 200 120)" />
      <ellipse cx="200" cy="120" rx="100" ry="12" fill="#FFE566" transform="rotate(135 200 120)" />
    </g>
    
    {/* Main sun */}
    <circle cx="200" cy="120" r="55" fill="url(#sunCoreMorning)" />
    
    {/* Bottom clouds - large and fluffy */}
    <g filter="url(#cloudSoftMorning)">
      <ellipse cx="80" cy="250" rx="70" ry="30" fill="white" opacity="0.95" />
      <ellipse cx="140" cy="240" rx="55" ry="28" fill="white" opacity="0.95" />
      <ellipse cx="40" cy="260" rx="50" ry="25" fill="white" opacity="0.9" />
      <ellipse cx="220" cy="255" rx="65" ry="28" fill="white" opacity="0.95" />
      <ellipse cx="300" cy="245" rx="60" ry="30" fill="white" opacity="0.95" />
      <ellipse cx="360" cy="260" rx="55" ry="25" fill="white" opacity="0.9" />
    </g>
    
    {/* Top clouds */}
    <g filter="url(#cloudSoftMorning)" opacity="0.7">
      <ellipse cx="320" cy="60" rx="50" ry="22" fill="white" />
      <ellipse cx="360" cy="50" rx="40" ry="18" fill="white" />
      <ellipse cx="290" cy="70" rx="35" ry="16" fill="white" />
    </g>
  </svg>
);

// Noon: Bright sun on left side with fluffy clouds
const NoonIllustration = () => (
  <svg viewBox="0 0 400 280" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
    <defs>
      <radialGradient id="noonSunCoreNoon" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFEF5" />
        <stop offset="40%" stopColor="#FFEB3B" />
        <stop offset="100%" stopColor="#FFC107" />
      </radialGradient>
      <radialGradient id="noonSunGlowNoon" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFEB3B" stopOpacity="0.5" />
        <stop offset="60%" stopColor="#FFC107" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#FFC107" stopOpacity="0" />
      </radialGradient>
      <filter id="noonCloudSoftNoon">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
      </filter>
      <filter id="noonRayBlur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
      </filter>
      <linearGradient id="cloudGradientNoon" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F0F4F8" />
      </linearGradient>
    </defs>
    
    {/* Sun glow - positioned on left */}
    <circle cx="100" cy="80" r="120" fill="url(#noonSunGlowNoon)" />
    
    {/* Soft blurred rays */}
    <g filter="url(#noonRayBlur)" opacity="0.35">
      <ellipse cx="100" cy="80" rx="90" ry="12" fill="#FFEB3B" transform="rotate(0 100 80)" />
      <ellipse cx="100" cy="80" rx="90" ry="12" fill="#FFEB3B" transform="rotate(45 100 80)" />
      <ellipse cx="100" cy="80" rx="90" ry="12" fill="#FFEB3B" transform="rotate(90 100 80)" />
      <ellipse cx="100" cy="80" rx="90" ry="12" fill="#FFEB3B" transform="rotate(135 100 80)" />
    </g>
    
    {/* Heat shimmer rings */}
    <circle cx="100" cy="80" r="60" fill="none" stroke="#FFC107" strokeWidth="2" opacity="0.2" />
    <circle cx="100" cy="80" r="75" fill="none" stroke="#FFC107" strokeWidth="1.5" opacity="0.1" />
    
    {/* Main sun */}
    <circle cx="100" cy="80" r="45" fill="url(#noonSunCoreNoon)" />
    
    {/* Sun highlight */}
    <circle cx="85" cy="65" r="12" fill="white" opacity="0.5" />
    
    {/* Top floating clouds on right side */}
    <g filter="url(#noonCloudSoftNoon)" opacity="0.8">
      <ellipse cx="300" cy="45" rx="50" ry="22" fill="url(#cloudGradientNoon)" />
      <ellipse cx="340" cy="40" rx="40" ry="18" fill="url(#cloudGradientNoon)" />
      <ellipse cx="270" cy="55" rx="35" ry="16" fill="url(#cloudGradientNoon)" />
      <ellipse cx="380" cy="50" rx="30" ry="14" fill="url(#cloudGradientNoon)" />
    </g>
    
    {/* Middle clouds */}
    <g filter="url(#noonCloudSoftNoon)" opacity="0.5">
      <ellipse cx="320" cy="120" rx="40" ry="18" fill="white" />
      <ellipse cx="360" cy="115" rx="30" ry="14" fill="white" />
    </g>
    
    {/* Bottom fluffy clouds - large and prominent */}
    <g filter="url(#noonCloudSoftNoon)">
      <ellipse cx="80" cy="250" rx="70" ry="30" fill="url(#cloudGradientNoon)" opacity="0.95" />
      <ellipse cx="140" cy="240" rx="55" ry="28" fill="url(#cloudGradientNoon)" opacity="0.95" />
      <ellipse cx="40" cy="260" rx="50" ry="25" fill="url(#cloudGradientNoon)" opacity="0.9" />
      <ellipse cx="220" cy="255" rx="65" ry="28" fill="url(#cloudGradientNoon)" opacity="0.95" />
      <ellipse cx="300" cy="245" rx="60" ry="30" fill="url(#cloudGradientNoon)" opacity="0.95" />
      <ellipse cx="360" cy="260" rx="55" ry="25" fill="url(#cloudGradientNoon)" opacity="0.9" />
    </g>
  </svg>
);

// Evening: Large crescent moon with stars and clouds
const EveningIllustration = () => (
  <svg viewBox="0 0 400 280" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
    <defs>
      <radialGradient id="moonSurfaceEve" cx="35%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#FFFEF8" />
        <stop offset="100%" stopColor="#E8E4D9" />
      </radialGradient>
      <radialGradient id="moonHaloEve" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFEF8" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#FFFEF8" stopOpacity="0" />
      </radialGradient>
      <filter id="starGlowEve">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
      </filter>
      <filter id="cloudSoftEve">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
      </filter>
      {/* Clip path for crescent moon */}
      <clipPath id="crescentClip">
        <circle cx="200" cy="100" r="55" />
      </clipPath>
      <mask id="crescentMask">
        <circle cx="200" cy="100" r="55" fill="white" />
        <circle cx="230" cy="80" r="45" fill="black" />
      </mask>
    </defs>
    
    {/* Moon halo */}
    <circle cx="200" cy="100" r="100" fill="url(#moonHaloEve)" />
    
    {/* Crescent moon using mask */}
    <circle cx="200" cy="100" r="55" fill="url(#moonSurfaceEve)" mask="url(#crescentMask)" />
    
    {/* Stars - scattered with trail effect */}
    <g filter="url(#starGlowEve)">
      <circle cx="80" cy="50" r="4" fill="#E8E4F0" opacity="0.9" />
      <circle cx="120" cy="80" r="3" fill="#E8E4F0" opacity="0.8" />
      <circle cx="60" cy="120" r="3.5" fill="#E8E4F0" opacity="0.85" />
      <circle cx="320" cy="40" r="4" fill="#E8E4F0" opacity="0.9" />
      <circle cx="350" cy="90" r="3" fill="#E8E4F0" opacity="0.75" />
      <circle cx="280" cy="60" r="2.5" fill="#E8E4F0" opacity="0.7" />
      {/* Star trail from moon */}
      <circle cx="250" cy="130" r="2" fill="#E8E4F0" opacity="0.6" />
      <circle cx="270" cy="150" r="1.5" fill="#E8E4F0" opacity="0.5" />
      <circle cx="285" cy="165" r="1.2" fill="#E8E4F0" opacity="0.4" />
    </g>
    
    {/* Bottom clouds */}
    <g filter="url(#cloudSoftEve)">
      <ellipse cx="100" cy="250" rx="80" ry="35" fill="white" opacity="0.85" />
      <ellipse cx="180" cy="240" rx="60" ry="30" fill="white" opacity="0.85" />
      <ellipse cx="50" cy="265" rx="55" ry="28" fill="white" opacity="0.8" />
      <ellipse cx="300" cy="255" rx="70" ry="32" fill="white" opacity="0.85" />
      <ellipse cx="370" cy="250" rx="50" ry="25" fill="white" opacity="0.8" />
    </g>
  </svg>
);

// Night: Crescent moon with twinkling stars and soft clouds
const NightIllustration = () => (
  <svg viewBox="0 0 400 280" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
    <defs>
      {/* Crescent moon gradient */}
      <radialGradient id="moonGradientNight" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFFEF0" />
        <stop offset="50%" stopColor="#F5F0D0" />
        <stop offset="100%" stopColor="#E8E0C0" />
      </radialGradient>
      {/* Moon glow */}
      <radialGradient id="moonGlowNight" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFACD" stopOpacity="0.5" />
        <stop offset="50%" stopColor="#FFFACD" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#FFFACD" stopOpacity="0" />
      </radialGradient>
      {/* Star sparkle gradient */}
      <radialGradient id="starSparkle" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#F8F4FF" />
        <stop offset="100%" stopColor="#E8E0FF" stopOpacity="0" />
      </radialGradient>
      {/* Filters */}
      <filter id="starGlowNight">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
      </filter>
      <filter id="starTwinkle">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
      </filter>
      <filter id="cloudSoftNight">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
      </filter>
      <filter id="moonSoftGlow">
        <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
      </filter>
      {/* Crescent mask */}
      <mask id="crescentMoonNight">
        <circle cx="200" cy="95" r="55" fill="white" />
        <circle cx="235" cy="75" r="45" fill="black" />
      </mask>
    </defs>
    
    {/* Large moon glow */}
    <circle cx="200" cy="95" r="120" fill="url(#moonGlowNight)" filter="url(#moonSoftGlow)" />
    
    {/* Crescent moon */}
    <g mask="url(#crescentMoonNight)">
      <circle cx="200" cy="95" r="55" fill="url(#moonGradientNight)" />
      {/* Moon surface texture */}
      <circle cx="180" cy="80" r="6" fill="#D8D4C0" opacity="0.3" />
      <circle cx="195" cy="105" r="4" fill="#D8D4C0" opacity="0.25" />
      <circle cx="170" cy="100" r="3" fill="#D8D4C0" opacity="0.2" />
    </g>
    
    {/* Bright stars with cross sparkle effect */}
    <g>
      {/* Large bright star - top left */}
      <circle cx="60" cy="45" r="6" fill="url(#starSparkle)" filter="url(#starGlowNight)" opacity="0.95" />
      <ellipse cx="60" cy="45" rx="12" ry="2" fill="white" opacity="0.6" />
      <ellipse cx="60" cy="45" rx="2" ry="12" fill="white" opacity="0.6" />
      
      {/* Large bright star - top right */}
      <circle cx="340" cy="55" r="5" fill="url(#starSparkle)" filter="url(#starGlowNight)" opacity="0.9" />
      <ellipse cx="340" cy="55" rx="10" ry="1.5" fill="white" opacity="0.5" />
      <ellipse cx="340" cy="55" rx="1.5" ry="10" fill="white" opacity="0.5" />
      
      {/* Bright star - left side */}
      <circle cx="45" cy="130" r="4" fill="url(#starSparkle)" filter="url(#starGlowNight)" opacity="0.85" />
      <ellipse cx="45" cy="130" rx="8" ry="1.2" fill="white" opacity="0.4" />
      <ellipse cx="45" cy="130" rx="1.2" ry="8" fill="white" opacity="0.4" />
    </g>
    
    {/* Medium twinkling stars */}
    <g filter="url(#starTwinkle)">
      <circle cx="95" cy="70" r="3.5" fill="#F8F4FF" opacity="0.9" />
      <circle cx="370" cy="90" r="3" fill="#F8F4FF" opacity="0.85" />
      <circle cx="300" cy="40" r="3.5" fill="#F8F4FF" opacity="0.9" />
      <circle cx="130" cy="35" r="2.8" fill="#F8F4FF" opacity="0.85" />
      <circle cx="80" cy="170" r="2.5" fill="#F8F4FF" opacity="0.8" />
      <circle cx="350" cy="150" r="3" fill="#F8F4FF" opacity="0.85" />
    </g>
    
    {/* Small distant stars */}
    <g opacity="0.7">
      <circle cx="25" cy="80" r="1.8" fill="#E8E4F8" />
      <circle cx="115" cy="110" r="1.5" fill="#E8E4F8" />
      <circle cx="280" cy="70" r="2" fill="#E8E4F8" />
      <circle cx="380" cy="40" r="1.5" fill="#E8E4F8" />
      <circle cx="320" cy="120" r="1.8" fill="#E8E4F8" />
      <circle cx="150" cy="160" r="1.5" fill="#E8E4F8" />
      <circle cx="250" cy="150" r="1.2" fill="#E8E4F8" />
      <circle cx="35" cy="200" r="1.5" fill="#E8E4F8" />
      <circle cx="375" cy="180" r="1.3" fill="#E8E4F8" />
    </g>
    
    {/* Tiny sparkling stars */}
    <g opacity="0.5">
      <circle cx="180" cy="40" r="1" fill="white" />
      <circle cx="220" cy="170" r="1" fill="white" />
      <circle cx="100" cy="145" r="0.8" fill="white" />
      <circle cx="295" cy="95" r="0.9" fill="white" />
      <circle cx="55" cy="105" r="0.8" fill="white" />
    </g>
    
    {/* Soft wispy clouds at bottom */}
    <g filter="url(#cloudSoftNight)">
      {/* Left cloud group */}
      <ellipse cx="70" cy="255" rx="80" ry="32" fill="#C8C4D8" opacity="0.5" />
      <ellipse cx="130" cy="245" rx="55" ry="25" fill="#D0CDE0" opacity="0.45" />
      <ellipse cx="30" cy="265" rx="50" ry="22" fill="#C0BCD0" opacity="0.4" />
      
      {/* Right cloud group */}
      <ellipse cx="320" cy="250" rx="70" ry="30" fill="#C8C4D8" opacity="0.5" />
      <ellipse cx="380" cy="258" rx="55" ry="25" fill="#D0CDE0" opacity="0.45" />
      <ellipse cx="260" cy="262" rx="45" ry="20" fill="#C0BCD0" opacity="0.4" />
      
      {/* Center connecting wisps */}
      <ellipse cx="200" cy="268" rx="60" ry="18" fill="#C8C4D8" opacity="0.35" />
    </g>
  </svg>
);

const illustrations: Record<TimeOfDay, () => JSX.Element> = {
  morning: MorningIllustration,
  noon: NoonIllustration,
  evening: EveningIllustration,
  night: NightIllustration,
};

const gradients: Record<TimeOfDay, string> = {
  morning: "from-amber-100/90 via-sky-100/70 to-background dark:from-amber-900/40 dark:via-sky-900/30 dark:to-background",
  noon: "from-sky-200/90 via-sky-100/60 to-background dark:from-sky-900/40 dark:via-sky-800/30 dark:to-background",
  evening: "from-indigo-300/80 via-purple-200/60 to-background dark:from-indigo-900/50 dark:via-purple-900/40 dark:to-background",
  night: "from-indigo-400/70 via-purple-300/50 to-background dark:from-indigo-950/70 dark:via-purple-950/50 dark:to-background",
};

const HeroSection = () => {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());
  const [mounted, setMounted] = useState(false);
  const { t, dir, isRTL } = useLanguage();

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const Illustration = illustrations[timeOfDay];
  const gradient = gradients[timeOfDay];
  const greeting = t.greetings[timeOfDay];

  return (
    <div 
      className={`relative w-full h-[38vh] min-h-[260px] max-h-[340px] overflow-hidden transition-opacity duration-500 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`} />

      {/* Illustration - Full width, positioned at bottom */}
      <div className="absolute inset-0 flex items-end justify-center">
        <div className="w-full h-[90%]">
          <Illustration />
        </div>
      </div>

      {/* Text overlay - positioned based on language direction */}
      <div className={`absolute top-6 z-10 ${isRTL ? 'right-6' : 'left-6'}`} dir={dir}>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground drop-shadow-sm">
          {greeting}
        </h1>
      </div>

      {/* Gradient fade to page background */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
};

export default HeroSection;
