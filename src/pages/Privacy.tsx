import { ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const Privacy = () => {
  const navigate = useNavigate();
  const { t, dir, isRTL } = useLanguage();

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-muted-foreground"
          >
            <ArrowIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.common.back}
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
          מדיניות פרטיות — NestAI.care
        </h1>
        <p className="text-xs text-muted-foreground text-center mb-8">
          עדכון אחרון: מאי 2026
        </p>

        <div className="space-y-6 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">כללי</h2>
            <p className="text-sm">
              NestAI.care מפעיל פלטפורמה לתיעוד רגשי אישי. מדיניות זו מסבירה אילו נתונים נאספים, כיצד הם משמשים ומוגנים. השירות מיועד לבני 18 ומעלה בלבד.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">איזה מידע נשמר</h2>
            <p className="text-sm">
              כתובת אימייל (לצורך התחברות בלבד), רשומות יומן אישיות כולל תאריך ושעה, סיכומים שבועיים שנוצרו אוטומטית, העדפות אישיות (יום ושעה לסיכום שבועי), ותיעוד תודות יומי אם נעשה שימוש בפיצ'ר. איננו אוספים שם מלא, מספר טלפון, תעודת זהות, או כל מידע מזהה אחר מעבר לאימייל.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">הצפנה ואבטחה</h2>
            <p className="text-sm">
              כל התקשורת מוצפנת באמצעות HTTPS. רשומות היומן והסיכומים השבועיים מוצפנים באמצעות AES-256-GCM. הסיסמה מוצפנת ואינה נשמרת בצורה גלויה. המערכת משתמשת בטכנולוגיית Row Level Security המבטיחה הפרדה מוחלטת בין משתמשים.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">למי יש גישה למידע?</h2>
            <p className="text-sm">
              רק לך. כל הרשומות והסיכומים שלך מוגנים ומקושרים אך ורק לחשבון שלך. אף משתמש אחר לא יכול לראות, לערוך או למחוק את התוכן שלך. אין גישה לגורמים חיצוניים, מפרסמים או צדדים שלישיים.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">מה לגבי הבינה המלאכותית?</h2>
            <p className="text-sm">
              הבינה המלאכותית משמשת ליצירת הסיכומים השבועיים ולתגובות בצ'אט. רק הטקסט הרלוונטי מועבר לעיבוד — בלי כתובת מייל, מספר טלפון או פרטים מזהים אחרים. הטקסטים לא נשמרים אצל ספק ה-AI לאחר העיבוד.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">מיקום אחסון הנתונים</h2>
            <p className="text-sm">
              הנתונים מאוחסנים בשרתים באיחוד האירופי (פרנקפורט, גרמניה) בהתאם לתקנות GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">שמירת נתונים</h2>
            <p className="text-sm">
              נתונים פעילים נשמרים כל עוד החשבון קיים. לאחר מחיקת חשבון, כל הנתונים האישיים נמחקים תוך 30 יום. גיבויים טכניים נמחקים תוך 90 יום.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">ניהול המידע שלך</h2>
            <p className="text-sm">
              בכל עת ניתן לבקש למחוק את החשבון והנתונים המשויכים אליו דרך הגדרות החשבון.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">עדכונים למדיניות</h2>
            <p className="text-sm">
              במקרה של שינויים מהותיים, תישלח הודעה לכתובת האימייל הרשומה לפחות 14 יום מראש.
            </p>
          </section>

          <section className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              לכל שאלה בנושא פרטיות:{" "}
              <a
                href="mailto:sarangaisrael@gmail.com"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                sarangaisrael@gmail.com
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-4 border-t border-border text-center text-xs text-muted-foreground">
          {t.footer.copyright}
        </footer>
      </div>
    </div>
  );
};

export default Privacy;