import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteContent } from "@/contexts/SiteContentContext";
import { ArrowRight, ArrowLeft, Lock, Heart, Shield, Smartphone, Apple } from "lucide-react";
import { AndroidIcon } from "@/components/icons/AndroidIcon";

interface HeroSectionProps {
  onShowIOSOverlay: () => void;
}

const HeroSection = ({ onShowIOSOverlay }: HeroSectionProps) => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { get } = useSiteContent();

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center">
        {/* Subtle blue-to-white gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-primary/[0.02] to-background" />
          <div className="absolute top-0 left-0 right-0 h-[60%] bg-gradient-to-b from-primary/[0.06] to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left: Text & CTA */}
            <div className="space-y-10 text-center lg:text-start">
              <div className="space-y-8">
                <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.12] tracking-tight">
                  {get("hero_title", t.landing.heroTitle)}
                  <br />
                  <span className="text-primary">{get("hero_highlight1", t.landing.heroTitleHighlight1)}</span>{" "}
                  <span className="text-primary">{get("hero_highlight2", t.landing.heroTitleHighlight2)}</span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground leading-[1.9] max-w-xl mx-auto lg:mx-0">
                  {get("hero_subtitle", t.landing.heroSubtitle)}
                </p>
              </div>

              <div className="flex flex-col gap-4 justify-center lg:justify-start items-stretch">
                <div className="space-y-2">
                  <Button
                    size="lg"
                    className="rounded-full px-12 gap-2 text-lg h-16 w-full shadow-lg hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.4)] transition-all duration-300"
                    onClick={() => navigate('/app')}
                  >
                    {t.landing.ctaButton}
                    <ArrowIcon className="w-5 h-5" />
                  </Button>
                  <p className="text-center text-sm font-medium text-primary">
                    ✨ {isRTL ? "30 יום ניסיון חינם — ללא כרטיס אשראי" : "30-day free trial — no credit card required"}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <a
                    href="https://apps.apple.com/il/app/nestai-care/id6760186559"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full px-6 gap-2 text-base h-14 flex-1 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Apple className="w-5 h-5" />
                    <span>{isRTL ? "הורד ל-iOS" : "Download for iOS"}</span>
                  </a>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-6 gap-2 text-base h-14 flex-1"
                    onClick={onShowIOSOverlay}
                  >
                    <AndroidIcon className="w-5 h-5" />
                    <span>{isRTL ? "הורד ל-Android" : "Download for Android"}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Phone Mockup */}
            <div className="hidden lg:flex justify-center lg:justify-end">
              <div className="relative animate-[float_5s_ease-in-out_infinite]">
                {/* Network constellation texture */}
                <div className="absolute -inset-20 sm:-inset-32">
                  <div className="absolute inset-0 rounded-full bg-primary/[0.08] blur-3xl" />
                  <svg className="absolute inset-0 w-full h-full opacity-[0.35]" viewBox="0 0 600 700" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Radial lines from center */}
                    <line x1="300" y1="350" x2="180" y2="200" stroke="hsl(var(--primary))" strokeWidth="1.2" />
                    <line x1="300" y1="350" x2="420" y2="180" stroke="hsl(var(--primary))" strokeWidth="1.2" />
                    <line x1="300" y1="350" x2="150" y2="400" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <line x1="300" y1="350" x2="460" y2="420" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <line x1="300" y1="350" x2="220" y2="520" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <line x1="300" y1="350" x2="400" y2="540" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <line x1="300" y1="350" x2="100" y2="300" stroke="hsl(var(--primary))" strokeWidth="0.8" />
                    <line x1="300" y1="350" x2="500" y2="280" stroke="hsl(var(--primary))" strokeWidth="0.8" />
                    <line x1="300" y1="350" x2="340" y2="120" stroke="hsl(var(--primary))" strokeWidth="0.8" />
                    <line x1="300" y1="350" x2="260" y2="600" stroke="hsl(var(--primary))" strokeWidth="0.8" />
                    {/* Cross connections */}
                    <line x1="180" y1="200" x2="420" y2="180" stroke="hsl(var(--primary))" strokeWidth="0.7" />
                    <line x1="180" y1="200" x2="100" y2="300" stroke="hsl(var(--primary))" strokeWidth="0.7" />
                    <line x1="420" y1="180" x2="500" y2="280" stroke="hsl(var(--primary))" strokeWidth="0.7" />
                    <line x1="150" y1="400" x2="220" y2="520" stroke="hsl(var(--primary))" strokeWidth="0.6" />
                    <line x1="460" y1="420" x2="400" y2="540" stroke="hsl(var(--primary))" strokeWidth="0.6" />
                    <line x1="100" y1="300" x2="150" y2="400" stroke="hsl(var(--primary))" strokeWidth="0.5" />
                    <line x1="500" y1="280" x2="460" y2="420" stroke="hsl(var(--primary))" strokeWidth="0.5" />
                    <line x1="340" y1="120" x2="420" y2="180" stroke="hsl(var(--primary))" strokeWidth="0.5" />
                    <line x1="220" y1="520" x2="400" y2="540" stroke="hsl(var(--primary))" strokeWidth="0.5" />
                    {/* Outer extensions */}
                    <line x1="180" y1="200" x2="60" y2="140" stroke="hsl(var(--primary))" strokeWidth="0.4" />
                    <line x1="420" y1="180" x2="550" y2="120" stroke="hsl(var(--primary))" strokeWidth="0.4" />
                    <line x1="100" y1="300" x2="20" y2="250" stroke="hsl(var(--primary))" strokeWidth="0.4" />
                    <line x1="500" y1="280" x2="580" y2="220" stroke="hsl(var(--primary))" strokeWidth="0.4" />
                    <line x1="220" y1="520" x2="120" y2="600" stroke="hsl(var(--primary))" strokeWidth="0.4" />
                    <line x1="400" y1="540" x2="500" y2="620" stroke="hsl(var(--primary))" strokeWidth="0.4" />
                    {/* Nodes */}
                    <circle cx="300" cy="350" r="5" fill="hsl(var(--primary))" opacity="0.5" />
                    <circle cx="180" cy="200" r="4" fill="hsl(var(--primary))" opacity="0.4" />
                    <circle cx="420" cy="180" r="4" fill="hsl(var(--primary))" opacity="0.4" />
                    <circle cx="150" cy="400" r="3.5" fill="hsl(var(--primary))" opacity="0.35" />
                    <circle cx="460" cy="420" r="3.5" fill="hsl(var(--primary))" opacity="0.35" />
                    <circle cx="220" cy="520" r="3" fill="hsl(var(--primary))" opacity="0.3" />
                    <circle cx="400" cy="540" r="3" fill="hsl(var(--primary))" opacity="0.3" />
                    <circle cx="100" cy="300" r="2.5" fill="hsl(var(--primary))" opacity="0.25" />
                    <circle cx="500" cy="280" r="2.5" fill="hsl(var(--primary))" opacity="0.25" />
                    <circle cx="340" cy="120" r="2.5" fill="hsl(var(--primary))" opacity="0.25" />
                    <circle cx="260" cy="600" r="2.5" fill="hsl(var(--primary))" opacity="0.25" />
                    <circle cx="60" cy="140" r="2" fill="hsl(var(--primary))" opacity="0.18" />
                    <circle cx="550" cy="120" r="2" fill="hsl(var(--primary))" opacity="0.18" />
                    <circle cx="20" cy="250" r="1.5" fill="hsl(var(--primary))" opacity="0.15" />
                    <circle cx="580" cy="220" r="1.5" fill="hsl(var(--primary))" opacity="0.15" />
                    <circle cx="120" cy="600" r="1.5" fill="hsl(var(--primary))" opacity="0.15" />
                    <circle cx="500" cy="620" r="1.5" fill="hsl(var(--primary))" opacity="0.15" />
                  </svg>
                </div>

                {/* Phone frame */}
                <div className="relative w-[220px] sm:w-[300px] max-h-[320px] sm:max-h-none bg-card rounded-[2.5rem] border-[6px] border-foreground/10 shadow-elevated overflow-hidden">
                  {/* Status bar */}
                  <div className="h-7 bg-foreground/5 flex items-center justify-center">
                    <div className="w-20 h-4 bg-foreground/10 rounded-full" />
                  </div>

                  {/* Chat content placeholder */}
                  <div className="p-4 space-y-3 min-h-[220px] sm:min-h-[480px] bg-background">
                    {/* App header */}
                    <div className="flex items-center gap-2 pb-3 border-b border-border">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">NestAI</span>
                    </div>

                    {/* Mock messages */}
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] text-sm">
                        {isRTL ? "הרגשתי לחוץ היום בעבודה..." : "I felt stressed at work today..."}
                      </div>
                    </div>

                    <div className={`flex ${isRTL ? "justify-start" : "justify-start"}`}>
                      <div className="bg-muted text-foreground rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%] text-sm leading-relaxed">
                        {isRTL
                          ? "מובן לגמרי. ספר לי עוד — מה בדיוק גרם ללחץ?"
                          : "That's completely valid. Tell me more — what caused the stress?"}
                      </div>
                    </div>

                    <div className={`hidden sm:flex ${isRTL ? "justify-end" : "justify-end"}`}>
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] text-sm">
                        {isRTL ? "פגישה קשה עם המנהל..." : "A tough meeting with my manager..."}
                      </div>
                    </div>

                    <div className={`hidden sm:flex ${isRTL ? "justify-start" : "justify-start"}`}>
                      <div className="bg-muted text-foreground rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%] text-sm leading-relaxed">
                        {isRTL
                          ? "שווה לדבר על זה בטיפול הבא 📝"
                          : "Worth bringing up in your next session 📝"}
                      </div>
                    </div>

                    {/* Typing indicator */}
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl px-4 py-3 flex gap-1.5">
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom bar */}
                  <div className="h-5 bg-foreground/5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="relative border-y border-border/50 bg-muted/30">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap items-center justify-center gap-8 sm:gap-14">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium">{t.landing.trustPrivate}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium">{t.landing.trustEncrypted}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium">{t.landing.trustSecure}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
