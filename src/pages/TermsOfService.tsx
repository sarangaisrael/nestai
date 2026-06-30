import { useNavigate } from "react-router-dom";

const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f8f7ff", fontFamily: "'Heebo', sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#534AB7", fontSize: 14, marginBottom: 24, padding: 0, display: "flex", alignItems: "center", gap: 6 }}
        >
          ← חזרה
        </button>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a1a2e", margin: "0 0 8px" }}>תנאי שימוש</h1>
        <p style={{ fontSize: 13, color: "#7F77DD", margin: "0 0 40px" }}>עדכון אחרון: {today}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 32, fontSize: 15, lineHeight: 1.8, color: "#2d2b3d" }}>

          <section>
            <h2 style={h2}>1. כללי</h2>
            <p>השימוש באפליקציית NestAI ובאתר nestai.care ("השירות") כפוף לתנאים אלו. הרשמה ושימוש בשירות מהווים הסכמה מלאה לתנאים אלו ולמדיניות הפרטיות. אם אינך מסכים לתנאים, אנא הימנע משימוש בשירות.</p>
          </section>

          <section>
            <h2 style={h2}>2. גיל מינימלי</h2>
            <p>השירות מיועד למשתמשים בני 18 ומעלה בלבד. אם אתה מתחת לגיל 18, אינך רשאי להשתמש בשירות.</p>
          </section>

          <section>
            <h2 style={h2}>3. אופי השירות</h2>
            <p>NestAI הוא כלי למעקב מצב רוח, רפלקציה יומית ושיחה עם בינה מלאכותית. <strong>השירות אינו מהווה טיפול נפשי, ייעוץ רפואי, אבחנה, או תחליף לטיפול מקצועי מכל סוג.</strong></p>
            <p style={{ marginTop: 12, padding: "12px 16px", background: "#fef3f2", borderRadius: 8, border: "1px solid #fecaca", fontSize: 14 }}>
              אם אתה חווה מצוקה נפשית, מחשבות פגיעה עצמית, או פגיעה באחרים — פנה <strong>מיידית</strong> לאנשי מקצוע מוסמכים או לקווי סיוע: <strong>ער"ן 1201</strong> (24/7).
            </p>
          </section>

          <section>
            <h2 style={h2}>4. חשבון משתמש</h2>
            <p>אתה אחראי לשמירת סודיות פרטי ההתחברות שלך ולכל פעילות המתבצעת תחת חשבונך. עליך לספק מידע נכון ועדכני בעת ההרשמה. יש ליידע אותנו מיידית על כל שימוש בלתי מורשה בחשבונך.</p>
          </section>

          <section>
            <h2 style={h2}>5. מנוי ותשלום</h2>
            <p>השירות כולל תקופת ניסיון חינמית, ולאחריה מסלולי מנוי בתשלום (חודשי/שנתי) כמפורט באתר. ביטול מנוי אפשרי בכל עת דרך הגדרות החשבון. חיובים שכבר בוצעו אינם ניתנים להחזר אלא אם נדרש אחרת על פי חוק הגנת הצרכן הישראלי.</p>
          </section>

          <section>
            <h2 style={h2}>6. קניין רוחני</h2>
            <p>כל הזכויות בשירות, לרבות עיצוב, קוד, טקסטים ומאגר הנתונים, שייכות ל-NestAI. תוכן שאתה יוצר (רשומות יומן, הודעות, נתוני מצב רוח) נשאר בבעלותך המלאה.</p>
          </section>

          <section>
            <h2 style={h2}>7. שימוש אסור</h2>
            <p>חל איסור להשתמש בשירות לכל מטרה בלתי חוקית, לפגוע בפעילות התקינה של המערכת, לנסות לגשת למידע של משתמשים אחרים, להפיץ תכנים פוגעניים, או לבצע כל פעולה שתפגע בשירות או במשתמשיו.</p>
          </section>

          <section>
            <h2 style={h2}>8. הגבלת אחריות</h2>
            <p>השירות מסופק כפי שהוא ("as is"). אנו עושים מאמץ סביר לשמור על זמינות ואיכות השירות, אך אין אנו מתחייבים לזמינות רציפה או נטולת תקלות. השימוש בשירות הוא על אחריות המשתמש בלבד. NestAI לא תישא באחריות לנזקים עקיפים, תוצאתיים, או מיוחדים הנובעים מהשימוש בשירות.</p>
          </section>

          <section>
            <h2 style={h2}>9. פרטיות ונתונים</h2>
            <p>השימוש בנתוניך כפוף ל<a href="/privacy" style={{ color: "#534AB7" }}>מדיניות הפרטיות</a> שלנו. תוכן השיחות והיומן מוצפן בהצפנת AES-256-GCM בצד הלקוח. חלק מהתוכן מועבר לעיבוד על-ידי ספק AI (Google Gemini) לצורך מתן תשובות — ראה מדיניות הפרטיות לפרטים.</p>
          </section>

          <section>
            <h2 style={h2}>10. שינויים בתנאים</h2>
            <p>אנו רשאים לעדכן תנאים אלו מעת לעת. במקרה של שינוי מהותי תישלח הודעה לכתובת המייל הרשומה לפחות 14 יום מראש. המשך השימוש בשירות לאחר כניסת השינויים לתוקף מהווה הסכמה לתנאים המעודכנים.</p>
          </section>

          <section>
            <h2 style={h2}>11. סיום שימוש</h2>
            <p>ניתן לבטל את החשבון בכל עת דרך הגדרות החשבון — כל הנתונים יימחקו. אנו רשאים להשעות או לסגור חשבון במקרה של הפרת תנאים אלו, עם הודעה מראש ככל שניתן.</p>
          </section>

          <section>
            <h2 style={h2}>12. דין חל וסמכות שיפוט</h2>
            <p>תנאים אלו כפופים לדיני מדינת ישראל. כל מחלוקת תובא לפני בתי המשפט המוסמכים בישראל.</p>
          </section>

          <section>
            <h2 style={h2}>13. יצירת קשר</h2>
            <p>לשאלות בנוגע לתנאים אלו: <a href="mailto:sarangaisrael@gmail.com" style={{ color: "#534AB7" }}>sarangaisrael@gmail.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
};

const h2: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 800,
  color: "#534AB7",
  margin: "0 0 10px",
};

export default TermsOfService;
