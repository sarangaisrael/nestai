import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, TrendingUp, Wind } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t, dir } = useLanguage();

  const screens = [
    {
      icon: <FileText className="w-12 h-12 text-primary" strokeWidth={1.5} />,
      title: t.onboarding.screen1Title,
      text: t.onboarding.screen1Text,
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-tech-green" strokeWidth={1.5} />,
      title: t.onboarding.screen2Title,
      text: t.onboarding.screen2Text,
    },
    {
      icon: <Wind className="w-12 h-12 text-tech-pink" strokeWidth={1.5} />,
      title: t.onboarding.screen3Title,
      text: t.onboarding.screen3Text,
    },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/app/dashboard", { replace: true });
      } else {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const handleStart = () => {
    navigate("/app/auth", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const screen = screens[currentScreen];
  const isLastScreen = currentScreen === screens.length - 1;

  return (
    <div 
      className="min-h-[100dvh] bg-background flex flex-col items-center justify-between px-6 py-8"
      dir={dir}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-10 w-80 h-80 bg-tech-pink/10 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-md flex-1 justify-center">
        {/* Feature icon */}
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-muted/50">
          {screen.icon}
        </div>
        {/* Title */}
        <h1 className="text-xl md:text-2xl font-semibold text-foreground text-center mt-4">
          {screen.title}
        </h1>

        {/* Description text */}
        <p className="text-sm text-foreground/70 text-center leading-relaxed">
          {screen.text}
        </p>

        {/* Progress dots */}
        <div className="flex gap-2 mt-2">
          {screens.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentScreen 
                  ? "bg-primary" 
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Button area */}
      <div className="relative z-10 w-full max-w-md">
        <Button
          onClick={isLastScreen ? handleStart : handleNext}
          className="bg-primary hover:bg-primary/90 text-primary-foreground py-5 rounded-full shadow-lg transition-colors w-full"
          size="lg"
        >
          {isLastScreen ? t.common.start : t.common.next}
        </Button>
      </div>

      {/* Footer */}
      <div className="text-xs text-foreground/40 mt-4">
        {t.footer.copyright}
      </div>
    </div>
  );
};

export default Onboarding;