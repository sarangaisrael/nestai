import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const BackButton = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate(-1)}
      className="gap-1.5 text-muted-foreground hover:text-foreground mb-2"
    >
      <ArrowRight className={`h-4 w-4 ${isRTL ? '' : 'rotate-180'}`} />
      {isRTL ? "חזרה" : "Back"}
    </Button>
  );
};

export default BackButton;
