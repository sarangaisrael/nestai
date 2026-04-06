import { Mail, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

const SUPPORT_EMAIL = "sarangaisrael@gmail.com";

const faqItems = {
  he: [
    { q: "מה האפליקציה עושה?", a: "NestAI הוא יומן רגשי חכם המונע על ידי בינה מלאכותית. תוכל/י לשוחח עם הבוט, לקבל סיכומים שבועיים וחודשיים, לעקוב אחרי דפוסים רגשיים ולקבל תובנות מותאמות אישית." },
    { q: "איך מוחקים את החשבון?", a: "ניתן למחוק את החשבון דרך הגדרות חשבון. לחצ/י על תפריט ← החשבון שלי ← מחיקת חשבון. פעולה זו תמחק את כל המידע שלך לצמיתות." },
    { q: "איך מאפסים סיסמה?", a: "במסך ההתחברות, לחצ/י על ״שכחתי סיסמה״. תקבל/י מייל עם קישור לאיפוס הסיסמה." },
    { q: "האם המידע שלי מאובטח?", a: "כן. כל ההודעות מוצפנות והמידע שלך מאוחסן בצורה מאובטחת. אנחנו לא משתפים מידע אישי עם צדדים שלישיים." },
    { q: "איך יוצרים קשר עם התמיכה?", a: `ניתן לשלוח מייל ל-${SUPPORT_EMAIL} ונחזור אליך בהקדם האפשרי.` },
  ],
  en: [
    { q: "What does the app do?", a: "NestAI is an AI-powered emotional journal. Chat with the bot, receive weekly and monthly summaries, track emotional patterns, and get personalized insights." },
    { q: "How do I delete my account?", a: "Go to Menu → My Account → Delete Account. This will permanently remove all your data." },
    { q: "How do I reset my password?", a: "On the login screen, tap \"Forgot password\". You'll receive an email with a link to reset your password." },
    { q: "Is my data secure?", a: "Yes. All messages are encrypted and your data is stored securely. We never share personal information with third parties." },
    { q: "How do I contact support?", a: `You can email us at ${SUPPORT_EMAIL} and we'll get back to you as soon as possible.` },
  ],
};

const Support = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const items = isRTL ? faqItems.he : faqItems.en;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowRight className={`h-4 w-4 ${isRTL ? "" : "rotate-180"}`} />
          {isRTL ? "חזרה" : "Back"}
        </Button>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {isRTL ? "תמיכה ועזרה" : "Support & Help"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRTL ? "מצא/י תשובות לשאלות נפוצות או צור/י קשר איתנו" : "Find answers to common questions or reach out to us"}
          </p>
        </div>

        {/* Contact card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {isRTL ? "צור/י קשר" : "Contact Us"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRTL ? "לכל שאלה או בעיה, שלח/י לנו מייל ונחזור אליך בהקדם:" : "For any questions or issues, send us an email and we'll respond promptly:"}
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-block text-primary font-medium underline underline-offset-4 hover:text-primary/80 transition-colors"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            {isRTL ? "שאלות נפוצות" : "Frequently Asked Questions"}
          </h2>
          <Accordion type="single" collapsible className="rounded-xl border border-border bg-card overflow-hidden">
            {items.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="px-4 last:border-b-0">
                <AccordionTrigger className="text-sm text-start">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default Support;
