import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

const F = "'Heebo', sans-serif";
const R = "'Righteous', sans-serif";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=Righteous&display=swap');
  *{box-sizing:border-box}
  body{overflow-x:hidden}
  .lp-btn-main:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(99,102,241,0.3)!important}
  .lp-btn-sec:hover{border-color:#0f172a!important}
  .lp-nav-link:hover{color:#0f172a!important}
  .lp-foot-link:hover{color:#94a3b8!important}
  .lp-steps{position:relative}
  .lp-steps::before{content:'';position:absolute;top:28px;right:16%;left:16%;height:1px;background:linear-gradient(to left,transparent,#e2e8f0 20%,#e2e8f0 80%,transparent);z-index:0}
  @media(max-width:900px){
    .lp-hero{grid-template-columns:1fr!important;padding:56px 24px 48px!important;gap:40px!important}
    .lp-phone-wrap{display:none!important}
    .lp-proof{padding:24px!important}
    .lp-proof-inner{gap:20px!important;flex-wrap:wrap!important}
    .lp-proof-div{display:none!important}
    .lp-how{padding:64px 24px!important}
    .lp-steps{grid-template-columns:1fr!important}
    .lp-steps::before{display:none}
    .lp-screens{padding:64px 24px!important}
    .lp-screens-grid{grid-template-columns:1fr!important}
    .lp-compare{padding:64px 24px!important}
    .lp-pricing{padding:64px 24px!important}
    .lp-pricing-grid{grid-template-columns:1fr!important}
    .lp-footer{padding:32px 24px!important;flex-direction:column!important;align-items:flex-start!important}
    .lp-nav-inner{padding:12px 20px!important}
  }
`;

const Logo = ({ size = 22, color = "#0f172a", accentColor = "#6366f1" }: { size?: number; color?: string; accentColor?: string }) => (
  <span style={{ fontFamily: R, fontSize: size, color }}> Nest<span style={{ color: accentColor }}>AI</span></span>
);

const Check = () => <span style={{ color: "#10b981", fontWeight: 700, flexShrink: 0 }}>✓</span>;

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && Capacitor.isNativePlatform()) navigate("/app/dashboard");
      setAuthChecked(true);
    });
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!authChecked) return null;

  return (
    <div dir="rtl" style={{ fontFamily: F, background: "#fff", color: "#0f172a", overflowX: "hidden" }}>
      <style>{CSS}</style>

      {/* ── NAV ── */}
      {/* Outer: sticky anchor — transparent so page shows in the gap when pill is active */}
      <div style={{ position: "sticky", top: 0, zIndex: 100 }}>
        {/* Inner: the visual nav element that morphs into a pill */}
        <div
          className="lp-nav-inner"
          style={{
            margin: scrolled ? "8px 24px 0" : "0",
            borderRadius: scrolled ? 18 : 0,
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.08),0 1px 6px rgba(0,0,0,0.04)" : "none",
            borderBottom: scrolled ? "none" : "1px solid #f1f5f9",
            border: scrolled ? "1px solid #e2e8f0" : undefined,
            padding: "18px 64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "margin 0.3s ease, border-radius 0.3s ease, box-shadow 0.3s ease",
          }}
        >
          <Logo />
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <a href="#how" className="lp-nav-link" style={{ fontSize: 14, color: "#64748b", fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}>איך זה עובד</a>
            <a href="#pricing" className="lp-nav-link" style={{ fontSize: 14, color: "#64748b", fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}>תמחור</a>
            <button onClick={() => navigate("/register")} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
              מתחילים
            </button>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <section style={{ background: "#fff" }}>
        <div className="lp-hero" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 80, padding: "100px 64px 80px", alignItems: "center", maxWidth: 1140, margin: "0 auto" }}>

          {/* Left copy */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 24 }}>
              <div style={{ width: 6, height: 6, background: "#10b981", borderRadius: "50%" }} />
              כלי להתפתחות אישית בעברית
            </div>
            <h1 style={{ fontSize: 52, fontWeight: 900, color: "#0f172a", letterSpacing: "-2.5px", lineHeight: 1.05, margin: "0 0 22px" }}>
              הכלי שעוזר לך להיות<br />
              <em style={{ fontStyle: "normal", color: "#6366f1" }}>הגרסה הטובה</em><br />
              ביותר שלך
            </h1>
            <p style={{ fontSize: 18, color: "#64748b", lineHeight: 1.8, margin: "0 0 36px", maxWidth: 440, fontWeight: 400 }}>
              מעקב יומי פשוט של מצב הרוח והפעילות שלך. אחרי שבוע, תתחיל לראות דפוסים שלא הכרת.
            </p>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 28 }}>
              <button
                onClick={() => navigate("/register")}
                className="lp-btn-main"
                style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, padding: "16px 32px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: F, transition: "transform 0.15s,box-shadow 0.15s" }}
              >
                מתחילים 14 יום בחינם
              </button>
              <button
                className="lp-btn-sec"
                onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
                style={{ background: "transparent", color: "#0f172a", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F, transition: "border-color 0.2s" }}
              >
                איך זה עובד?
              </button>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {["ללא כרטיס אשראי", "מוצפן ופרטי", "בעברית"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                  <span style={{ color: "#10b981", fontSize: 14 }}>✓</span> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Phone mockup */}
          <div className="lp-phone-wrap" style={{ display: "flex", justifyContent: "center", position: "relative" }}>
            <div style={{ background: "#0f172a", borderRadius: 48, padding: 14, boxShadow: "0 48px 120px rgba(15,23,42,0.22),0 12px 40px rgba(15,23,42,0.12)", width: 310, position: "relative" }}>
              <div style={{ width: 80, height: 6, background: "#1e293b", borderRadius: 3, margin: "0 auto 10px" }} />
              <div style={{ background: "#f9fafb", borderRadius: 36, overflow: "hidden" }}>
                {/* Status bar */}
                <div style={{ background: "#fff", borderBottom: "1px solid #f1f5f9", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#c2410c", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 20, padding: "2px 7px" }}>🔥 5 ימים</div>
                  <Logo size={13} />
                  <div style={{ width: 18 }} />
                </div>
                {/* Body */}
                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>ערב טוב 🌙</div>
                  {/* Mood card */}
                  <div style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", borderRadius: 14, padding: 16, textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#fff", marginBottom: 4 }}>איך היה היום?</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", marginBottom: 12 }}>בחר את מצב הרוח שלך</div>
                    <div style={{ display: "flex", justifyContent: "space-around" }}>
                      {[["😔","קשה"],["😕","לא טוב"],["😐","בסדר"],["🙂","טוב"],["😊","מעולה"]].map(([em, lbl]) => (
                        <div key={lbl} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          <span style={{ fontSize: 18 }}>{em}</span>
                          <span style={{ fontSize: 7, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{lbl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#0f172a" }}>מה עשית היום?</div>
                  {/* Activities */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 }}>
                    {[["💼","עבודה",true],["🏋️","ספורט",false],["🚶","הליכה",true],["👫","דייט",true]].map(([em, lbl, sel]) => (
                      <div key={String(lbl)} style={{ background: sel ? "#ede9fe" : "#fff", borderRadius: 8, border: `1px solid ${sel ? "#6366f1" : "#e2e8f0"}`, padding: "5px 3px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <span style={{ fontSize: 13 }}>{em}</span>
                        <span style={{ fontSize: 6, fontWeight: 600, color: sel ? "#6366f1" : "#64748b", textAlign: "center" }}>{String(lbl)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Float badge */}
            <div style={{ position: "absolute", bottom: -20, right: -30, background: "#fff", borderRadius: 16, padding: "14px 18px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 10, border: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 22 }}>📈</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>שבוע 3 של עלייה</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>מצב הרוח שלך טוב יותר</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <div className="lp-proof" style={{ background: "#f8fafc", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", padding: "28px 64px" }}>
        <div className="lp-proof-inner" style={{ maxWidth: 1140, margin: "0 auto", display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap" }}>
          {[["30 שניות","בכל יום"],["7 ימים","לתובנות ראשונות"],["100%","בעברית"]].map(([num, lbl]) => (
            <div key={num} style={{ display: "contents" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", letterSpacing: -1 }}>{num}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{lbl}</div>
              </div>
              <div className="lp-proof-div" style={{ width: 1, height: 40, background: "#e2e8f0", flexShrink: 0 }} />
            </div>
          ))}
          <div style={{ flex: 1, fontSize: 14, color: "#64748b", lineHeight: 1.7, fontStyle: "italic", minWidth: 200 }}>
            "אחרי שבוע הבנתי שהימים שהלכתי לספורט היו הימים הכי טובים שלי. לא חשבתי שזה קשור."
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, fontStyle: "normal" }}>משתמש NestAI</div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="lp-how" style={{ padding: "100px 64px", maxWidth: 1140, margin: "0 auto" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>איך זה עובד</div>
        <div style={{ fontSize: 40, fontWeight: 900, color: "#0f172a", letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 16 }}>פשוט. עקבי. חכם.</div>
        <div style={{ fontSize: 16, color: "#64748b", lineHeight: 1.75, marginBottom: 56, maxWidth: 520 }}>לא צריך לכתוב הרבה. לא צריך זמן. רק 30 שניות ביום — והמערכת עושה את השאר.</div>
        <div className="lp-steps" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 40 }}>
          {[
            { bg: "#ede9fe", em: "😊", title: "מעדכן פעם ביום",      text: "בשעה שבחרת, תקבל תזכורת. תבחר אמוג'י למצב הרוח ותסמן מה עשית היום. 30 שניות." },
            { bg: "#ecfdf5", em: "📊", title: "המערכת לומדת",        text: "אחרי שבוע, NestAI מנתח את הנתונים ומגלה דפוסים. אילו פעילויות משפיעות עליך ואיך." },
            { bg: "#fff7ed", em: "🌱", title: "רואה שינוי מוחשי",    text: "סיכומים שבועיים וחודשיים מראים לך בדיוק איפה אתה עומד ולאן אתה הולך." },
          ].map(s => (
            <div key={s.title}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 20, position: "relative", zIndex: 1 }}>{s.em}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 10, letterSpacing: "-0.3px" }}>{s.title}</div>
              <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{s.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SCREENS ── */}
      <section className="lp-screens" style={{ background: "#f8fafc", padding: "100px 64px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>מה רואים</div>
          <div style={{ fontSize: 40, fontWeight: 900, color: "#0f172a", letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 16 }}>הכל במקום אחד</div>
          <div style={{ fontSize: 16, color: "#64748b", lineHeight: 1.75, marginBottom: 56, maxWidth: 520 }}>דשבורד פשוט, יומן שקט, ותובנות שמתעדכנות בלי שתעשה כלום.</div>

          <div className="lp-screens-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>

            {/* Screen 01 — Check-in */}
            <ScreenCol badge="01" title="Check-in יומי" desc="30 שניות ביום. מצב רוח ופעילויות. ללא כתיבה, ללא מחויבות.">
              <div style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", borderRadius: 12, padding: 14, textAlign: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#fff", marginBottom: 10 }}>איך היה היום?</div>
                <div style={{ display: "flex", justifyContent: "space-around" }}>
                  {[["😔","קשה"],["😕","לא טוב"],["😐","בסדר"],["🙂","טוב"],["😊","מעולה"]].map(([em, lbl]) => (
                    <div key={lbl} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 20 }}>{em}</div>
                      <div style={{ fontSize: 7, color: "rgba(255,255,255,0.7)" }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 }}>
                {[["💼",true],["🏋️",false],["🚶",true],["👫",true]].map(([em, sel], i) => (
                  <div key={i} style={{ background: sel ? "#ede9fe" : "#f1f5f9", borderRadius: 8, padding: 6, textAlign: "center", fontSize: 14 }}>{em}</div>
                ))}
              </div>
            </ScreenCol>

            {/* Screen 02 — Trends */}
            <ScreenCol badge="02" title="מגמות ותובנות" desc="אחרי שבוע תראה אילו פעילויות משפיעות על מצב הרוח שלך.">
              <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>מצב רוח השבוע</div>
              {[["😕",30,"#ddd6fe","א׳"],["🙂",70,"#6366f1","ב׳"],["😊",90,"#4f46e5","ג׳"],["😐",50,"#a5b4fc","ד׳"]].map(([em, w, c, d]) => (
                <div key={String(d)} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <span style={{ fontSize: 14, width: 20 }}>{em}</span>
                  <div style={{ flex: 1, height: 7, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${w}%`, height: "100%", background: String(c), borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 9, color: "#94a3b8", width: 20 }}>{d}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, fontSize: 11, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>מה משפיע עליך</div>
              {[["👫",88,"#10b981","↑88%"],["🚶",72,"#6366f1","↑72%"],["💼",35,"#f59e0b","↓35%"]].map(([em, w, c, val]) => (
                <div key={String(em)} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                  <span style={{ fontSize: 14, width: 20 }}>{em}</span>
                  <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${w}%`, height: "100%", background: String(c), borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, width: 28, color: String(c) }}>{val}</span>
                </div>
              ))}
            </ScreenCol>

            {/* Screen 03 — Journal */}
            <ScreenCol badge="03" title="יומן שקט" desc="מקום לכתוב בחופשיות. בלי תגובות, בלי שיפוטים. רק אתה.">
              <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>יומן</div>
              {[
                { when: "היום · 20:15",  mood: "🙂", text: "היום היה יום טוב. הדייט עם שרה היה נפלא, הלכנו לים..." },
                { when: "אתמול · 21:30", mood: "😐", text: "יום עמוס בעבודה. הרגשתי קצת מותש אבל..." },
              ].map(e => (
                <div key={e.when} style={{ background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", padding: 10, marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#6366f1" }}>{e.when}</span>
                    <span style={{ fontSize: 12 }}>{e.mood}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#374151", lineHeight: 1.6 }}>{e.text}</div>
                </div>
              ))}
            </ScreenCol>

          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="lp-compare" style={{ padding: "100px 64px", maxWidth: 1140, margin: "0 auto" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>למה לא ChatGPT?</div>
        <div style={{ fontSize: 40, fontWeight: 900, color: "#0f172a", letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 16 }}>לא כל AI מתאים לצמיחה אישית</div>
        <div style={{ fontSize: 16, color: "#64748b", lineHeight: 1.75, marginBottom: 56, maxWidth: 520 }}>ההבדל בין כלי כללי לכלי שנבנה בשביל זה.</div>

        <div style={{ borderRadius: 24, overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", background: "#f8fafc" }}>
            <div style={{ padding: "18px 24px", fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em" }}>תכונה</div>
            <div style={{ padding: "18px 24px", fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em" }}>ChatGPT</div>
            <div style={{ padding: "18px 24px", background: "#0f172a", display: "flex", alignItems: "center" }}>
              <Logo size={14} color="#fff" accentColor="#818cf8" />
            </div>
          </div>
          {[
            ["זיכרון לאורך זמן",   "מתחיל מאפס בכל שיחה",     "עוקב לאורך כל התהליך"],
            ["מעקב פעילויות",      "לא קיים",                   "יומי, אוטומטי, ויזואלי"],
            ["סיכום שבועי",        "לא קיים",                   "אוטומטי אחרי 7 ימים"],
            ["בעברית",             "אנגלית בעיקר",               "בנוי בעברית מהיסוד"],
            ["פרטיות והצפנה",      "נתונים לאימון מודלים",      "מוצפן, לא נשמר לאימון"],
          ].map(([feat, gpt, nest], i) => (
            <div key={feat} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", borderTop: "1px solid #f1f5f9", background: i % 2 === 1 ? "#fafafa" : "#fff" }}>
              <div style={{ padding: "16px 24px", fontSize: 13, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center" }}>{feat}</div>
              <div style={{ padding: "16px 24px", fontSize: 13, color: "#94a3b8", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>✗</span> {gpt}
              </div>
              <div style={{ padding: "16px 24px", fontSize: 13, color: "#0f172a", fontWeight: 500, display: "flex", alignItems: "center", gap: 8, background: "#fafbff" }}>
                <span style={{ color: "#10b981", fontWeight: 700 }}>✓</span> {nest}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="lp-pricing" style={{ background: "#f8fafc", padding: "100px 64px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>תמחור</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: "#0f172a", letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 16 }}>פשוט. שקוף. משתלם.</div>
            <div style={{ fontSize: 16, color: "#64748b", lineHeight: 1.75, margin: "0 auto 56px" }}>ההבדל היחיד בין התוכניות הוא משך הגישה.</div>
          </div>

          <div className="lp-pricing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Monthly */}
            <PricingCard
              name="חודשי"
              price="29"
              period="לחודש"
              saving="פחות מ-5% ממפגש טיפולי"
              features={["גישה מלאה","Check-in יומי","מגמות ותובנות","יומן שקט","צ'אט AI רגשי"]}
              href="/month"
              note="נחזור תוך 24 שעות"
            />

            {/* Yearly - featured */}
            <PricingCard
              name="שנתי"
              price="249"
              period="לשנה"
              saving="₪20.75 לחודש — חיסכון של 3 חודשים"
              features={["גישה מלאה לשנה שלמה","Check-in יומי","מגמות ותובנות","יומן שקט","צ'אט AI רגשי"]}
              href="https://wa.me/9720537000277?text=היי, אני מעוניין במנוי השנתי של NestAI"
              note="נחזור תוך 24 שעות"
              featured
              badge="הכי משתלם"
            />

          </div>

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
            המחירים ייכנסו לתוקף בקרוב. משתמשים קיימים יקבלו הודעה מראש.
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer" style={{ background: "#0f172a", padding: "48px 64px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
        <Logo size={20} color="#fff" accentColor="#818cf8" />
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {[["מדיניות פרטיות","/privacy"],["תנאי שימוש","/terms"],["צור קשר","mailto:info@nestai.care"]].map(([lbl, href]) => (
            <a key={href} href={href} className="lp-foot-link" style={{ fontSize: 13, color: "#475569", textDecoration: "none", transition: "color 0.2s" }}>{lbl}</a>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#334155" }}>© 2025 NestAI.care</div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function ScreenCol({ badge, title, desc, children }: { badge: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "inline-block", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#64748b" }}>{badge}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>{title}</div>
      <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{desc}</div>
      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <div style={{ background: "#0f172a", padding: "10px 14px" }}>
          <span style={{ fontFamily: R, fontSize: 12, color: "#fff" }}>Nest<span style={{ color: "#818cf8" }}>AI</span></span>
        </div>
        <div style={{ padding: 12 }}>{children}</div>
      </div>
    </div>
  );
}

function PricingCard({ name, price, period, saving, features, href, note, featured = false, badge }: {
  name: string; price: string; period: string; saving: string;
  features: string[]; href: string; note: string;
  featured?: boolean; badge?: string;
}) {
  const F = "'Heebo', sans-serif";
  return (
    <div style={{ background: "#fff", borderRadius: 20, border: featured ? "2px solid #6366f1" : "1.5px solid #e2e8f0", padding: 30, position: "relative", overflow: "hidden" }}>
      {badge && (
        <div style={{ position: "absolute", top: 18, left: 18, background: "#6366f1", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>{badge}</div>
      )}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", marginBottom: 10, marginTop: badge ? 8 : 0 }}>{name}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
        <span style={{ fontSize: 18, fontWeight: 700, verticalAlign: "top", marginTop: 8, display: "inline-block" }}>₪</span>
        <span style={{ fontSize: 40, fontWeight: 900, color: "#0f172a", letterSpacing: -2, lineHeight: 1 }}>{price}</span>
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, marginBottom: 4 }}>{period}</div>
      <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, marginBottom: 18 }}>{saving}</div>
      <div style={{ height: 1, background: "#f1f5f9", margin: "16px 0" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 22 }}>
        {features.map(f => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", fontWeight: 500 }}>
            <Check /> {f}
          </div>
        ))}
      </div>
      <a href={href} style={{ display: "flex", width: "100%", background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: F, textDecoration: "none", alignItems: "center", justifyContent: "center", gap: 6, boxSizing: "border-box" }}>
        מתחילים עכשיו
      </a>
      <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", marginTop: 8 }}>{note}</div>
    </div>
  );
}
