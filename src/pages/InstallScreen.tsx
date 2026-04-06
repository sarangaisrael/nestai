import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Share } from "lucide-react";
import nestLogo from "@/assets/nestai-logo-full.png";

const InstallScreen = () => {
  const navigate = useNavigate();
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "NestAI",
          text: "Add NestAI to your home screen",
          url: window.location.origin,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log("Share cancelled or failed:", error);
      }
    } else {
      setShowManualInstructions(true);
    }
  };

  return (
    <div 
      className="min-h-screen bg-background flex flex-col items-center relative overflow-hidden"
      dir="rtl"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-tech-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-10 w-80 h-80 bg-tech-pink/5 rounded-full blur-3xl" />
      </div>

      {/* Back button */}
      <div className="w-full max-w-md px-4 pt-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="text-sm">חזרה</span>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-8 flex-1 justify-center max-w-md w-full">
        {/* Logo */}
        <img 
          src={nestLogo} 
          alt="NestAI" 
          className="w-32 h-32 object-contain drop-shadow-sm"
        />

        {/* Title */}
        <h1 className="text-2xl font-semibold text-foreground text-center">
          להוסיף את NestAI למסך הבית?
        </h1>

        {/* App Preview Card */}
        <div className="bg-card border border-border rounded-2xl p-6 w-full shadow-sm">
          <div className="flex flex-col items-center gap-3">
            {/* App icon preview */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <img 
                src={nestLogo} 
                alt="NestAI Icon" 
                className="w-12 h-12 object-contain"
              />
            </div>
            
            {/* App name */}
            <span className="text-lg font-medium text-foreground">NestAI</span>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground text-center">
              גישה מהירה למרחב הכתיבה הרגשית שלך
            </p>
          </div>
        </div>

        {/* Instructions text */}
        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          לחיצה על הכפתור תפתח את תפריט השיתוף של הדפדפן.
          <br />
          משם בוחרים "הוספה למסך הבית".
        </p>

        {/* Manual instructions when share not supported */}
        {showManualInstructions && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 w-full">
            <p className="text-sm text-amber-800 dark:text-amber-200 text-center leading-relaxed">
              כדי להוסיף את NestAI למסך הבית: לחצו על כפתור השיתוף בדפדפן ובחרו "הוספה למסך הבית".
            </p>
          </div>
        )}

        {/* Share button */}
        <Button
          onClick={handleShare}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-full shadow-lg transition-colors w-full flex items-center justify-center gap-3"
          size="lg"
        >
          <Share className="w-5 h-5" />
          <span>פתח תפריט שיתוף</span>
        </Button>
      </div>

      {/* Footer */}
      <div className="pb-6 text-xs text-foreground/40">
        © 2025 NestAI.care. All rights reserved
      </div>
    </div>
  );
};

export default InstallScreen;
