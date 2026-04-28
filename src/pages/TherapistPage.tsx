import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  Lock,
  MessageCircle,
} from "lucide-react";
import makoArticle from "@/assets/mako-article.png";

export default function TherapistPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-white overflow-x-hidden"
      style={{ fontFamily: '"DM Sans", sans-serif' }}
    >
      {/* ─── 1. Sticky Navbar ─── */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: "#ffffff",
          borderBottom: "0.5px solid #e5e7eb",
          height: "64px",
        }}
      >
        <div
          className="max-w-6xl mx-auto flex items-center justify-between px-6"
          style={{ height: "100%" }}
        >
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 600,
              fontSize: "1.2rem",
            }}
          >
            Nest<span style={{ color: "#1D9E75" }}>AI</span>.care
          </span>
          <button
            onClick={() => navigate("/app/professional/intro")}
            style={{
              backgroundColor: "#1D9E75",
              color: "#ffffff",
              borderRadius: "50px",
              paddingLeft: "24px",
              paddingRight: "24px",
              paddingTop: "8px",
              paddingBottom: "8px",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
            }}
          >
            הצטרפו לפיילוט בחינם ←
          </button>
        </div>
      </header>

      {/* ─── 2. Hero ─── */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Text column — right in RTL */}
          <div>
            <span
              className="rounded-full text-sm px-3 py-1 inline-block"
              style={{
                backgroundColor: "rgba(29,158,117,0.1)",
                color: "#1D9E75",
              }}
            >
              למטפלי CBT ו-DBT
            </span>

            <h1
              className="text-4xl md:text-5xl text-gray-900 mt-4 leading-tight"
              style={{ fontFamily: '"Fraunces", serif', fontWeight: 300 }}
            >
              המטופלים שלך{" "}
              <span style={{ color: "#1D9E75", fontStyle: "italic" }}>
                לא מבצעים
              </span>
              <br />
              את המשימות הביתיות?
            </h1>

            <p className="text-base text-gray-600 mt-4 leading-relaxed">
              NestAI מחזירה את הרצף לפרוטוקול.
              <br />
              המטופל מתעד בטבעיות בין הפגישות —<br />
              אתה מקבל סיכום מוכן לפני כל פגישה,
              <br />
              בלי לבקש ובלי להכין.
            </p>

            <div className="flex gap-3 mt-6 flex-wrap">
              <button
                onClick={() => navigate("/app/professional/intro")}
                style={{
                  backgroundColor: "#1D9E75",
                  color: "#ffffff",
                  borderRadius: "50px",
                  paddingLeft: "24px",
                  paddingRight: "24px",
                  paddingTop: "12px",
                  paddingBottom: "12px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                הצטרפו לפיילוט בחינם ←
              </button>
              <button
                onClick={() => navigate("/app/professional/demo")}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  borderRadius: "50px",
                  paddingLeft: "24px",
                  paddingRight: "24px",
                  paddingTop: "12px",
                  paddingBottom: "12px",
                  border: "1px solid #d1d5db",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                צפו בדמו
              </button>
            </div>

            <div className="flex gap-4 mt-5 text-sm text-gray-500 flex-wrap">
              <span>
                <CheckCircle2
                  className="w-4 h-4 inline ml-1"
                  style={{ color: "#1D9E75" }}
                />
                30 יום בחינם
              </span>
              <span>
                <CheckCircle2
                  className="w-4 h-4 inline ml-1"
                  style={{ color: "#1D9E75" }}
                />
                ללא כרטיס אשראי
              </span>
              <span>
                <CheckCircle2
                  className="w-4 h-4 inline ml-1"
                  style={{ color: "#1D9E75" }}
                />
                אפס התערבות קלינית
              </span>
            </div>
          </div>

          {/* Phone mockup column — left in RTL */}
          <div className="flex justify-center">
            <div
              style={{
                width: "260px",
                borderRadius: "36px",
                border: "2px solid #1a1a1a",
                backgroundColor: "#ffffff",
                boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Notch */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "80px",
                  height: "24px",
                  backgroundColor: "#1a1a1a",
                  borderRadius: "0 0 16px 16px",
                  zIndex: 10,
                }}
              />

              {/* Screen content */}
              <div style={{ paddingTop: "36px" }}>
                {/* Chat header */}
                <div
                  style={{
                    backgroundColor: "#1D9E75",
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      backgroundColor: "#ffffff",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "#1D9E75",
                      flexShrink: 0,
                    }}
                  >
                    N
                  </div>
                  <div>
                    <div
                      style={{
                        color: "#ffffff",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      NestAI
                    </div>
                    <div
                      style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px" }}
                    >
                      המרחב שלך
                    </div>
                  </div>
                </div>

                {/* Messages area */}
                <div
                  style={{
                    backgroundColor: "#f7f7f7",
                    padding: "8px",
                    minHeight: "240px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {/* AI bubble 1 */}
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px 12px 2px 12px",
                      padding: "6px 10px",
                      fontSize: "11px",
                      color: "#1f2937",
                      maxWidth: "85%",
                      marginRight: "auto",
                    }}
                  >
                    איך היה היום? קרה משהו שרצית לתעד? 🌿
                  </div>

                  {/* User bubble 1 */}
                  <div
                    style={{
                      backgroundColor: "#1D9E75",
                      borderRadius: "12px 12px 12px 2px",
                      padding: "6px 10px",
                      fontSize: "11px",
                      color: "#ffffff",
                      maxWidth: "85%",
                      marginLeft: "auto",
                    }}
                  >
                    הרגשתי לחוץ בעבודה, שוב ויכוח עם המנהל
                  </div>

                  {/* AI bubble 2 */}
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px 12px 2px 12px",
                      padding: "6px 10px",
                      fontSize: "11px",
                      color: "#1f2937",
                      maxWidth: "85%",
                      marginRight: "auto",
                    }}
                  >
                    מובן. ספר לי — מה בדיוק גרם ללחץ?
                  </div>

                  {/* User bubble 2 */}
                  <div
                    style={{
                      backgroundColor: "#1D9E75",
                      borderRadius: "12px 12px 12px 2px",
                      padding: "6px 10px",
                      fontSize: "11px",
                      color: "#ffffff",
                      maxWidth: "85%",
                      marginLeft: "auto",
                    }}
                  >
                    הוא לא מקשיב. פגישה קשה עם המנהל
                  </div>

                  {/* AI bubble 3 */}
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px 12px 2px 12px",
                      padding: "6px 10px",
                      fontSize: "11px",
                      color: "#1f2937",
                      maxWidth: "85%",
                      marginRight: "auto",
                    }}
                  >
                    שווה לדבר על זה בטיפול הבא 📝
                  </div>

                  {/* Summary label */}
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "10px",
                      color: "#1D9E75",
                      fontWeight: 500,
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    ✓ סיכום נשלח למטפל
                  </div>
                </div>

                {/* Input bar */}
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    borderTop: "0.5px solid #e5e7eb",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: "#f3f4f6",
                      borderRadius: "50px",
                      padding: "4px 12px",
                      fontSize: "10px",
                      color: "#9ca3af",
                    }}
                  >
                    כתוב משהו...
                  </div>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: "#1D9E75",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "12px",
                      flexShrink: 0,
                    }}
                  >
                    →
                  </div>
                </div>

                {/* Home indicator */}
                <div
                  style={{
                    height: "20px",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "3px",
                      backgroundColor: "#e5e7eb",
                      borderRadius: "2px",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. Problem Section ─── */}
      <section
        className="py-20 px-6"
        style={{
          backgroundColor: "#f9fafb",
          borderTop: "0.5px solid #e5e7eb",
          borderBottom: "0.5px solid #e5e7eb",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl text-center mb-4"
            style={{ fontFamily: '"Fraunces", serif', fontWeight: 300 }}
          >
            מה קורה בין הפגישות?
          </h2>
          <p className="text-gray-500 text-base text-center mb-12">
            הנתונים מדברים בעד עצמם
          </p>

          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                num: "90%",
                desc: "מהמטופלים לא מבצעים משימות ביתיות באופן עקבי",
              },
              {
                num: "40%",
                desc: "נשירה מוקדמת — רובה ב-2 הפגישות הראשונות",
              },
              {
                num: "80%",
                desc: "מהתהליך קורה מחוץ לחדר הטיפול",
              },
            ].map((card) => (
              <div
                key={card.num}
                className="text-center"
                style={{
                  backgroundColor: "#ffffff",
                  border: "0.5px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    fontFamily: '"Fraunces", serif',
                    fontWeight: 400,
                    fontSize: "3rem",
                    color: "#1D9E75",
                  }}
                >
                  {card.num}
                </div>
                <p className="text-gray-600 text-sm mt-2">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Challenge / Solution cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Challenge */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "0.5px solid #e5e7eb",
                borderTop: "3px solid #E24B4A",
                borderRadius: "12px",
                padding: "20px 24px 24px",
              }}
            >
              <span
                className="inline-block mb-3 rounded-full text-xs px-2 py-0.5"
                style={{ backgroundColor: "#FCEBEB", color: "#A32D2D" }}
              >
                האתגר
              </span>
              <h3 className="font-semibold text-gray-900 mb-2">
                רצף טיפולי שנשבר
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                המטופל מגיע לפגישה ריק. שכח מה עבר עליו. הפרוטוקול לא מתקדם
                ואתה מתחיל מאפס בכל פגישה.
              </p>
            </div>

            {/* Solution */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "0.5px solid #e5e7eb",
                borderTop: "3px solid #1D9E75",
                borderRadius: "12px",
                padding: "20px 24px 24px",
              }}
            >
              <span
                className="inline-block mb-3 rounded-full text-xs px-2 py-0.5"
                style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}
              >
                הפתרון
              </span>
              <h3 className="font-semibold text-gray-900 mb-2">NestAI.care</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                המטופל מתעד ביומיום בשיחה טבעית עם AI. אתה מקבל סיכום מובנה
                לפני כל פגישה — ודוח מגמות חודשי.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Tools Section ─── */}
      <section
        className="py-20 px-6 bg-white"
        style={{ borderBottom: "0.5px solid #e5e7eb" }}
      >
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl text-center mb-12"
            style={{ fontFamily: '"Fraunces", serif', fontWeight: 300 }}
          >
            מה תקבל כמטפל
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <ClipboardList className="w-5 h-5" style={{ color: "#1D9E75" }} />,
                title: "סיכום טרום-פגישה",
                body: "לפני כל מפגש תקבל סיכום ממוקד של מה שעבר על המטופל בשבוע. ללא בקשה, ללא הכנה.",
              },
              {
                icon: <TrendingUp className="w-5 h-5" style={{ color: "#1D9E75" }} />,
                title: "דוח מגמות חודשי",
                body: "תמונה מלאה של הדפוסים הרגשיים, השינויים ונקודות המפנה בתהליך הטיפולי.",
              },
              {
                icon: <Lock className="w-5 h-5" style={{ color: "#1D9E75" }} />,
                title: "דשבורד מאובטח",
                body: "גישה מוגנת לנתוני המטופלים שלך בלבד. הפרטיות היא עיקרון יסוד, לא פיצ'ר.",
              },
              {
                icon: <MessageCircle className="w-5 h-5" style={{ color: "#1D9E75" }} />,
                title: "יומן רגשי מונחה AI",
                body: "המטופל מתעד בשיחה טבעית — לא בטפסים. האפליקציה מלווה אותו בין הפגישות.",
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  backgroundColor: "#f9fafb",
                  border: "0.5px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: "#E1F5EE",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  {card.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-2">
                  {card.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. How It Works ─── */}
      <section
        className="py-20 px-6"
        style={{
          backgroundColor: "#f9fafb",
          borderBottom: "0.5px solid #e5e7eb",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl text-center mb-12"
            style={{ fontFamily: '"Fraunces", serif', fontWeight: 300 }}
          >
            איך זה עובד
          </h2>

          <div className="max-w-2xl mx-auto space-y-8">
            {[
              {
                n: "1",
                title: "נרשמים לפיילוט בחינם",
                body: "תהליך של 5 דקות. ללא כרטיס אשראי, ללא התחייבות. תקבלו גישה מיידית לדשבורד.",
              },
              {
                n: "2",
                title: "מזמינים מטופל אחד לנסות",
                body: "שולחים קישור. המטופל מוריד את האפליקציה ומתחיל לתעד — בלי הסבר ארוך.",
              },
              {
                n: "3",
                title: "מגיעים לפגישה מוכנים",
                body: "לפני כל פגישה מקבלים סיכום אוטומטי. הפרוטוקול מתקדם, הקשר מתעמק.",
              },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-5">
                <div
                  style={{
                    flexShrink: 0,
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#1D9E75",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "1.125rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {step.n}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. Mako Section ─── */}
      <section
        className="py-20 px-6 bg-white"
        style={{ borderBottom: "0.5px solid #e5e7eb" }}
      >
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl text-center mb-12"
            style={{ fontFamily: '"Fraunces", serif', fontWeight: 300 }}
          >
            הסיפור שמאחורינו
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Text column */}
            <div>
              <span
                className="inline-block rounded-full text-xs px-3 py-1 mb-4"
                style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
              >
                כתבה ב-mako
              </span>
              <h3 className="font-semibold text-gray-900 text-xl mb-3">
                מתקשים בפגישה עם הפסיכולוג? ישראלי בנה עוזר AI לטיפול
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                קראו את הכתבה המלאה שפורסמה ב-mako על הדרך שהובילה לפיתוח
                NestAI.
              </p>
              <a
                href="https://www.mako.co.il/nexter-news/Article-a19b0da777b6c91027.htm"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "50px",
                  padding: "8px 20px",
                  fontSize: "0.875rem",
                  color: "#374151",
                  textDecoration: "none",
                }}
              >
                לקריאת הכתבה המלאה ↗
              </a>
            </div>

            {/* Image column */}
            <div>
              <img
                src={makoArticle}
                alt="כתבה על NestAI ב-mako"
                className="w-full rounded-xl border border-gray-200"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. Pricing ─── */}
      <section
        className="py-20 px-6"
        style={{
          backgroundColor: "#f9fafb",
          borderBottom: "0.5px solid #e5e7eb",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl text-center mb-12"
            style={{ fontFamily: '"Fraunces", serif', fontWeight: 300 }}
          >
            מחירון
          </h2>

          <div
            className="mx-auto"
            style={{
              maxWidth: "460px",
              backgroundColor: "#ffffff",
              border: "0.5px solid #e5e7eb",
              borderRadius: "16px",
              padding: "32px",
            }}
          >
            <span
              className="inline-block text-sm font-medium px-3 py-1 rounded-full mb-4"
              style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}
            >
              ✦ פיילוט — כניסה חינמית לחודש
            </span>

            <div
              style={{
                fontFamily: '"Fraunces", serif',
                fontWeight: 400,
                fontSize: "3.75rem",
                color: "#1D9E75",
                lineHeight: 1,
              }}
            >
              חינם
            </div>

            <p className="text-gray-500 text-sm mt-1 mb-6">
              לחודש הראשון — אחריו 20 ₪ לחודש למטופל
            </p>

            <div style={{ borderTop: "0.5px solid #e5e7eb", marginBottom: "24px" }} />

            <ul className="space-y-3">
              {[
                "סיכום טרום-פגישה לכל מפגש",
                "דוח מגמות חודשי",
                "דשבורד מטפל מאובטח",
                "אפליקציה למטופל — iOS ו-Android",
                "תמיכה אישית בהטמעה",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "#1D9E75" }}
                  />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/app/professional/intro")}
              style={{
                marginTop: "32px",
                width: "100%",
                paddingTop: "12px",
                paddingBottom: "12px",
                borderRadius: "50px",
                backgroundColor: "#1D9E75",
                color: "#ffffff",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              הצטרפו לפיילוט בחינם ←
            </button>
          </div>
        </div>
      </section>

      {/* ─── 8. Final CTA ─── */}
      <section
        className="py-20 px-6 text-center"
        style={{ backgroundColor: "#1D9E75" }}
      >
        <h2
          className="text-3xl text-white mb-4"
          style={{ fontFamily: '"Fraunces", serif', fontWeight: 300 }}
        >
          מוכנים להחזיר את הרצף לטיפול?
        </h2>
        <p
          className="text-base mb-8 max-w-xl mx-auto"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          הצטרפו למטפלים שכבר משתמשים ב-NestAI — ותראו את ההבדל מהפגישה
          הראשונה
        </p>
        <button
          onClick={() => navigate("/app/professional/intro")}
          style={{
            backgroundColor: "#ffffff",
            color: "#1D9E75",
            borderRadius: "50px",
            paddingLeft: "32px",
            paddingRight: "32px",
            paddingTop: "12px",
            paddingBottom: "12px",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          הצטרפו לפיילוט בחינם ←
        </button>
      </section>

      {/* ─── 9. Footer ─── */}
      <footer
        className="py-6 px-6 bg-white"
        style={{ borderTop: "0.5px solid #e5e7eb" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center">
            <span
              style={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}
            >
              Nest<span style={{ color: "#1D9E75" }}>AI</span>.care
            </span>
            <span className="text-gray-400 text-sm mr-3">© 2025</span>
          </div>
          <Link
            to="/app/privacy"
            className="text-gray-500 text-sm hover:text-gray-700"
          >
            מדיניות פרטיות
          </Link>
        </div>
      </footer>
    </div>
  );
}
