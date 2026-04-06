import { Check, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const PricingSection = () => {
  const { isRTL } = useLanguage();

  const features = [
    isRTL ? "צ'אט ללא הגבלה" : "Unlimited chat",
    isRTL ? "סיכומים שבועיים" : "Weekly summaries",
    isRTL ? "סיכומים חודשיים" : "Monthly summaries",
    isRTL ? "מגמות ותובנות מתקדמות" : "Advanced trends & insights",
    isRTL ? "ייצוא PDF למטפל" : "PDF export for therapist",
  ];

  return (
    <section className="py-24 px-6 bg-muted/30" id="pricing">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {isRTL ? "חינם לגמרי" : "Completely Free"}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            {isRTL ? "הכל כלול, בחינם" : "Everything Included, Free"}
          </h2>
        </div>

        <Card className="rounded-3xl p-8 border border-border bg-card space-y-6">
          <div className="text-center">
            <p className="text-4xl font-extrabold text-foreground">
              0₪
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {isRTL ? "כל הפיצ'רים, בלי תשלום" : "All features, no payment"}
            </p>
          </div>
          <ul className="space-y-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            <Link to="/app">
              <Button className="w-full rounded-2xl h-11">
                {isRTL ? "התחל עכשיו" : "Get Started"}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default PricingSection;
