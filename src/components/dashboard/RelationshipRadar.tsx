import { Card } from "@/components/ui/card";
import { Users, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface KeyPerson {
  name: string;
  sentimentScore: number; // 0-100
  positivePercent: number;
  associatedEmotions: string[];
}

interface RelationshipRadarProps {
  people?: KeyPerson[];
}

const RelationshipRadar = ({ people }: RelationshipRadarProps) => {
  const { t, isRTL } = useLanguage();

  const defaultPeople: KeyPerson[] = [
    {
      name: isRTL ? 'נועה' : 'Noa',
      sentimentScore: 82,
      positivePercent: 80,
      associatedEmotions: isRTL ? ['ביטחון', 'רוגע'] : ['Security', 'Calm'],
    },
  ];

  const keyPeople = people && people.length > 0 ? people : defaultPeople;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="relative overflow-hidden p-5 border-0 rounded-3xl glass-card tech-border shadow-card">
        <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-emotion-love/5 blur-2xl" />

        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-emotion-love/10">
              <Users className="h-5 w-5" style={{ color: 'hsl(var(--emotion-love))' }} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {t.dashboard.relationshipsTitle}
            </h3>
          </div>

          {keyPeople.map((person, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{person.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.dashboard.sentimentScore}: {person.sentimentScore}/100
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">{person.positivePercent}%</span>
                  <p className="text-xs text-muted-foreground">{t.dashboard.positiveTexts}</p>
                </div>
              </div>

              {/* Sentiment bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: 0 }}
                  animate={{ width: `${person.sentimentScore}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.dashboard.relationshipInsight
                  .replace('{name}', person.name)
                  .replace('{percent}', String(person.positivePercent))
                  .replace('{emotions}', person.associatedEmotions.join(isRTL ? ' ו' : ' and '))
                }
              </p>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default RelationshipRadar;
