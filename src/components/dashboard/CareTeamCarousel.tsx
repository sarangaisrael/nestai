import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { User, Share2 } from "lucide-react";
import { motion } from "framer-motion";

interface TeamMember {
  name: string;
  role: string;
}

const CareTeamCarousel = () => {
  const { isRTL } = useLanguage();

  // Placeholder data – will be dynamic when therapist connections exist
  const team: TeamMember[] = [
    { name: isRTL ? "ד״ר שרה כהן" : "Dr. Sarah Cohen", role: isRTL ? "פסיכולוגית" : "Psychologist" },
    { name: isRTL ? "מיכל לוי" : "Michal Levi", role: isRTL ? "עובדת סוציאלית" : "Social Worker" },
    { name: isRTL ? "ד״ר יוסי אברהם" : "Dr. Yossi Avraham", role: isRTL ? "פסיכיאטר" : "Psychiatrist" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35 }}
    >
      <h3 className="text-base font-semibold text-foreground mb-3">
        {isRTL ? "הצוות המטפל שלי" : "My Care Team"}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
        {team.map((member) => (
          <div
            key={member.name}
            className="flex-shrink-0 w-40 rounded-2xl bg-card border border-border/40 p-4 shadow-card flex flex-col items-center gap-2 text-center"
            style={{ scrollSnapAlign: "start" }}
          >
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground leading-tight">{member.name}</p>
            <p className="text-xs text-muted-foreground">{member.role}</p>
            <Button variant="outline" size="sm" className="w-full mt-1 rounded-xl text-xs h-8 gap-1">
              <Share2 className="h-3 w-3" />
              {isRTL ? "שתף סיכום" : "Share Summary"}
            </Button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default CareTeamCarousel;
