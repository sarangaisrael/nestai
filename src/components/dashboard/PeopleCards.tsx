import { Card } from "@/components/ui/card";
import { Heart, Home, Briefcase, Users, Baby, Dog } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface Person {
  name: string;
  icon: string;
  narrative: string;
}

interface PeopleCardsProps {
  people: Person[];
}

const PeopleCards = ({ people }: PeopleCardsProps) => {
  const { isRTL } = useLanguage();

  if (!people || people.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 px-1">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          {isRTL ? "האנשים בעולם שלך" : "The People in Your World"}
        </h3>
      </div>

      <div className="space-y-2.5">
        {people.map((person, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: isRTL ? 16 : -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
          >
            <Card className="p-4 border-0 rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-lg">
                  {person.icon || "❤️"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground mb-0.5">
                    {person.name}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {person.narrative}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default PeopleCards;
