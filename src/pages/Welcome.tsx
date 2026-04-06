import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import nestLogo from "@/assets/nestai-logo-full.png";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AddToHomePrompt from "@/components/AddToHomePrompt";

const Welcome = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { t, dir } = useLanguage();

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

  const handleStart = () => {
    navigate("/app/onboarding");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <img 
          src={nestLogo} 
          alt="NestAI"
          className="w-32 h-32 object-contain animate-pulse"
        />
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-[100dvh] bg-background flex flex-col items-center justify-between px-6 py-12"
      dir={dir}
    >
      {/* Add to Home Screen Prompt */}
      <AddToHomePrompt />
      
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center gap-6 w-full max-w-md flex-1 justify-center">
        {/* Logo */}
        <img 
          src={nestLogo} 
          alt="NestAI"
          className="w-52 h-52 object-contain"
        />

        {/* Title */}
        <h1 className="text-2xl font-semibold text-foreground text-center mt-4">
          {t.welcome.title}
        </h1>

        {/* Description text */}
        <p className="text-base text-foreground/70 text-center leading-relaxed max-w-xs whitespace-pre-line">
          {t.welcome.description}
        </p>
      </div>

      {/* Button area */}
      <div className="w-full max-w-md space-y-4">
        <Button
          onClick={handleStart}
          className="bg-primary hover:bg-primary/90 text-primary-foreground py-5 rounded-full shadow-lg transition-colors w-full"
          size="lg"
        >
          {t.welcome.getStarted}
        </Button>

        {/* Secondary link */}
        <p className="text-sm text-foreground/60 text-center">
          {t.welcome.alreadyRegistered}{" "}
          <Link 
            to="/app/auth" 
            className="text-primary hover:underline font-medium"
          >
            {t.welcome.login}
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className="text-xs text-foreground/40 mt-6">
        {t.footer.copyright}
      </div>
    </div>
  );
};

export default Welcome;