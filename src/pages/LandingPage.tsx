import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

// ─── CSS ────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800;900&family=Heebo:wght@300;400;500;600;700;800;900&display=swap');

  .lp-root {
    --paper: #FBF6EC;
    --paper-card: #FFFFFF;
    --ink: #1A1625;
    --ink-soft: #5C5668;
    --purple: #5A4BFF;
    --purple-deep: #382CB8;
    --coral: #FF6B4A;
    --line: #E6DFD0;
    --radius: 18px;
    --serif: 'Rubik', sans-serif;
    --sans: 'Heebo', sans-serif;
    font-family: var(--sans);
    background: var(--paper);
    color: var(--ink);
    direction: rtl;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  .lp-root *, .lp-root *::before, .lp-root *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── Scroll reveal ── */
  .lp-reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.8s cubic-bezier(.16,1,.3,1), transform 0.8s cubic-bezier(.16,1,.3,1);
  }
  .lp-reveal.in { opacity: 1; transform: translateY(0); }

  /* ── NAV ── */
  .lp-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 48px;
    position: relative;
    z-index: 50;
  }

  .lp-logo {
    font-family: var(--serif);
    font-size: 24px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.5px;
  }

  .lp-nav-cta {
    background: var(--ink);
    color: var(--paper);
    border: none;
    border-radius: 50px;
    padding: 11px 26px;
    font-family: var(--sans);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s, background 0.2s;
  }
  .lp-nav-cta:hover { transform: translateY(-2px); background: var(--purple); }

  /* ── HERO ── */
  .lp-hero {
    position: relative;
    padding: 70px 24px 60px;
    max-width: 1180px;
    margin: 0 auto;
  }

  .lp-hero-grid {
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
    gap: 40px;
    align-items: center;
  }

  .lp-hero-visual {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 480px;
  }

  .lp-scatter-zone {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .lp-thought {
    position: absolute;
    font-family: var(--serif);
    font-weight: 500;
    font-size: 15px;
    color: var(--ink-soft);
    background: var(--paper-card);
    border: 1px solid var(--line);
    padding: 12px 16px;
    border-radius: 16px;
    box-shadow: 0 4px 14px rgba(26,22,37,0.07);
    max-width: 168px;
    line-height: 1.4;
    animation: lp-settle 1s cubic-bezier(.16,1,.3,1) backwards;
  }

  .lp-thought::before {
    content: '';
    position: absolute;
    top: -5px;
    right: 18px;
    width: 18px;
    height: 10px;
    background: rgba(255,107,74,0.35);
    border-radius: 3px;
    transform: rotate(-3deg);
  }

  @keyframes lp-settle {
    from { opacity: 0; transform: translateY(-24px) rotate(var(--rot,0deg)) scale(0.9); }
    to   { opacity: 1; transform: translateY(0)     rotate(var(--rot,0deg)) scale(1);   }
  }

  .lp-t1 { top: 0;   right: -10px; --rot: -5deg; transform: rotate(-5deg); animation-delay: 0.1s; }
  .lp-t2 { top: 60px; left: -30px; --rot: 4deg;  transform: rotate(4deg);  animation-delay: 0.35s; font-size: 14px; max-width: 140px; }
  .lp-t3 { bottom: 90px; right: -34px; --rot: 3deg; transform: rotate(3deg); animation-delay: 0.55s; }
  .lp-t4 { bottom: 20px; left: -16px; --rot: -3deg; transform: rotate(-3deg); animation-delay: 0.7s; font-size: 14px; max-width: 150px; }

  /* ── PHONE ── */
  .lp-phone {
    display: inline-block;
    position: relative;
    z-index: 1;
    background: linear-gradient(165deg, #2A2745, #1A1625);
    border-radius: 48px;
    padding: 13px;
    box-shadow: 0 50px 100px -20px rgba(90,75,255,0.3), 0 16px 40px -10px rgba(26,22,37,0.25);
    max-width: 270px;
    width: 100%;
    transform: rotate(-2deg);
  }

  .lp-phone::before {
    content: '';
    position: absolute;
    top: 13px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 24px;
    background: #1A1625;
    border-radius: 0 0 16px 16px;
    z-index: 2;
  }

  .lp-phone-screen {
    background: linear-gradient(180deg, #1C1934 0%, #14122A 100%);
    border-radius: 36px;
    padding: 40px 20px 26px;
    text-align: right;
    position: relative;
    overflow: hidden;
  }

  .lp-status { display: flex; justify-content: space-between; font-size: 12px; color: var(--paper); font-weight: 600; margin-bottom: 24px; }
  .lp-cin-lbl { font-size: 12px; color: #A09EC0; margin-bottom: 6px; }
  .lp-cin-q { font-family: var(--sans); font-size: 18px; font-weight: 700; color: var(--paper); line-height: 1.4; margin-bottom: 22px; }

  .lp-mood-row { display: flex; gap: 7px; justify-content: center; margin-bottom: 18px; flex-direction: row-reverse; }
  .lp-mood-btn {
    width: 40px; height: 40px; border-radius: 50%;
    background: #2A2645; display: flex; align-items: center; justify-content: center;
    font-size: 20px; cursor: pointer; transition: transform 0.15s;
    border: 2px solid transparent;
  }
  .lp-mood-btn.lp-on { background: rgba(90,75,255,0.35); border-color: var(--purple); transform: scale(1.15); }

  .lp-ai-bubble { background: linear-gradient(135deg, var(--purple), #8B7FFF); border-radius: 14px 14px 4px 14px; padding: 11px 13px; }
  .lp-ai-bubble p { font-size: 12px; color: var(--paper); line-height: 1.5; }
  .lp-ai-lbl { font-size: 10px; color: #C5C0FF; font-weight: 600; margin-bottom: 5px; display: block; }

  /* ── HERO COPY ── */
  .lp-hero-copy { position: relative; z-index: 2; text-align: right; }

  .lp-eyebrow {
    font-size: 13px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: var(--coral); margin-bottom: 18px;
  }

  .lp-hero-copy h1 {
    font-family: var(--serif); font-size: clamp(38px, 5vw, 58px);
    font-weight: 800; line-height: 1.1; letter-spacing: -1px;
    color: var(--ink); margin-bottom: 22px;
  }
  .lp-accent { color: var(--purple); }

  .lp-hero-copy > p {
    font-size: 18px; color: var(--ink-soft); line-height: 1.6;
    margin-bottom: 32px; max-width: 420px;
  }

  .lp-hero-actions { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }

  .lp-btn-primary {
    background: var(--purple); color: var(--paper); border: none;
    border-radius: 50px; padding: 17px 38px; font-family: var(--sans);
    font-size: 16px; font-weight: 800; cursor: pointer;
    text-decoration: none; display: inline-block;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 8px 24px rgba(90,75,255,0.3);
  }
  .lp-btn-primary:hover { transform: translateY(-3px) rotate(-1deg); box-shadow: 0 12px 32px rgba(90,75,255,0.4); }

  .lp-stores { display: flex; gap: 10px; flex-wrap: wrap; }
  .lp-store-link {
    font-size: 13px; font-weight: 700; color: var(--ink-soft);
    text-decoration: none; border: 1px solid var(--line);
    background: var(--paper-card); padding: 8px 16px; border-radius: 50px;
    transition: border-color 0.2s, color 0.2s;
  }
  .lp-store-link:hover { border-color: var(--purple); color: var(--purple); }

  /* ── SECTIONS ── */
  .lp-section { max-width: 1040px; margin: 0 auto; padding: 100px 24px; }
  .lp-section-tag { font-family: var(--serif); font-size: 16px; color: var(--coral); margin-bottom: 10px; }
  .lp-section-title {
    font-family: var(--serif); font-size: clamp(28px, 4.2vw, 44px);
    font-weight: 700; letter-spacing: -0.5px; color: var(--ink);
    line-height: 1.2; margin-bottom: 54px;
  }

  /* ── STEPS ── */
  .lp-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 28px; }

  .lp-step {
    background: var(--paper-card); border-radius: var(--radius);
    padding: 34px 28px; border: 1px solid var(--line);
    transition: transform 0.3s cubic-bezier(.16,1,.3,1), box-shadow 0.3s;
  }
  .lp-step:nth-child(1) { transform: rotate(-1deg); }
  .lp-step:nth-child(2) { transform: rotate(0.8deg) translateY(-10px); }
  .lp-step:nth-child(3) { transform: rotate(-0.6deg); }
  .lp-step:hover { transform: rotate(0deg) translateY(-14px) !important; box-shadow: 0 20px 44px rgba(90,75,255,0.12); }

  .lp-step-mark { font-family: var(--serif); font-size: 38px; color: var(--purple); opacity: 0.25; line-height: 1; margin-bottom: 14px; }
  .lp-step h3 { font-family: var(--sans); font-size: 18px; font-weight: 800; color: var(--ink); margin-bottom: 9px; }
  .lp-step p { font-size: 15px; color: var(--ink-soft); line-height: 1.6; }

  /* ── DARK SECTIONS ── */
  .lp-dark { background: var(--ink); padding: 100px 24px; }
  .lp-dark-inner { max-width: 1040px; margin: 0 auto; }
  .lp-dark-inner .lp-section-tag { color: var(--coral); }
  .lp-dark-inner .lp-section-title { color: var(--paper); }

  /* ── COMPARE ── */
  .lp-cmp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .lp-cmp-card { border-radius: var(--radius); padding: 30px 26px; }
  .lp-cmp-them { background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.18); }
  .lp-cmp-us   { background: var(--purple); border: 1px solid var(--purple-deep); }
  .lp-cmp-card h4 { font-family: var(--serif); font-size: 18px; font-weight: 500; margin-bottom: 20px; }
  .lp-cmp-them h4 { color: #8A87A3; }
  .lp-cmp-us h4   { color: rgba(255,255,255,0.85); }
  .lp-cmp-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 15px; }
  .lp-cmp-dot { width: 5px; height: 5px; border-radius: 50%; margin-top: 8px; flex-shrink: 0; }
  .lp-cmp-them .lp-cmp-dot { background: #5A5670; }
  .lp-cmp-us   .lp-cmp-dot { background: rgba(255,255,255,0.7); }
  .lp-cmp-item span { font-size: 15px; line-height: 1.5; }
  .lp-cmp-them span { color: #8A87A3; }
  .lp-cmp-us   span { color: var(--paper); font-weight: 500; }

  /* ── INSIGHTS ── */
  .lp-insights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
  .lp-insights-lead { font-family: var(--serif); font-size: 24px; font-weight: 700; color: var(--ink); line-height: 1.4; margin-bottom: 18px; }
  .lp-insights-body { font-size: 16px; color: var(--ink-soft); line-height: 1.7; }
  .lp-insights-card { background: var(--paper-card); border-radius: var(--radius); padding: 32px 28px; border: 1px solid var(--line); box-shadow: 0 16px 40px rgba(26,22,37,0.07); }
  .lp-insights-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .lp-insights-lbl { font-size: 14px; font-weight: 700; color: var(--ink-soft); }
  .lp-insights-pill { background: #EEF0FF; color: var(--purple); font-size: 13px; font-weight: 700; padding: 5px 14px; border-radius: 50px; }
  .lp-bars { display: flex; align-items: flex-end; gap: 8px; height: 90px; margin-bottom: 22px; }
  .lp-bar { flex: 1; background: linear-gradient(180deg, var(--purple), #8B7FFF); border-radius: 6px 6px 0 0; }
  .lp-insight-note { font-size: 14px; color: var(--ink-soft); line-height: 1.6; background: #FBF6EC; border-radius: 10px; padding: 14px 16px; }

  /* ── PRIVACY ── */
  .lp-priv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 24px; }
  .lp-priv-item { text-align: right; }
  .lp-priv-icon { font-size: 28px; margin-bottom: 16px; }
  .lp-priv-item h4 { font-family: var(--sans); font-size: 17px; font-weight: 800; color: var(--paper); margin-bottom: 8px; }
  .lp-priv-item p { font-size: 14px; color: #8A87A3; line-height: 1.6; }

  /* ── PRESS ── */
  .lp-press-wrap { background: var(--paper); padding: 100px 24px; }
  .lp-press-inner { max-width: 1040px; margin: 0 auto; }
  .lp-press-card {
    display: block; max-width: 640px; margin: 50px auto 0;
    background: var(--paper-card); border-radius: var(--radius);
    padding: 36px 40px; border: 1px solid var(--line);
    box-shadow: 0 12px 32px rgba(26,22,37,0.06);
    text-decoration: none; text-align: right;
    transition: transform 0.3s, box-shadow 0.3s;
  }
  .lp-press-card:hover { transform: translateY(-6px); box-shadow: 0 24px 48px rgba(90,75,255,0.12); }
  .lp-press-logo { font-family: var(--serif); font-weight: 900; font-size: 15px; color: var(--ink); background: var(--paper); border: 1px solid var(--line); padding: 4px 14px; border-radius: 6px; display: inline-block; margin-bottom: 18px; }
  .lp-press-hl { font-family: var(--serif); font-size: 24px; font-weight: 700; color: var(--ink); line-height: 1.4; margin-bottom: 12px; }
  .lp-press-ex { font-size: 15px; color: var(--ink-soft); line-height: 1.65; margin-bottom: 20px; }
  .lp-press-lnk { font-size: 14px; font-weight: 700; color: var(--purple); }

  /* ── PRICING ── */
  .lp-pricing-wrap { max-width: 1040px; margin: 0 auto; padding: 100px 24px; text-align: center; }
  .lp-pricing-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 20px; max-width: 720px; margin: 48px auto 0; align-items: stretch;
  }
  .lp-p-card {
    background: var(--paper-card); border-radius: 24px;
    padding: 40px 30px; border: 2px solid var(--line);
    box-shadow: 0 12px 32px rgba(26,22,37,0.05);
    position: relative; text-align: right;
    display: flex; flex-direction: column;
  }
  .lp-p-card.lp-featured {
    border-color: var(--purple);
    box-shadow: 0 24px 60px rgba(90,75,255,0.18);
    transform: translateY(-12px);
  }
  .lp-p-badge {
    font-family: var(--sans); background: var(--coral); color: var(--paper);
    font-size: 12px; font-weight: 700; padding: 5px 14px;
    border-radius: 50px; display: inline-block; margin-bottom: 18px; align-self: flex-end;
  }
  .lp-p-card:not(.lp-featured) .lp-p-badge { background: var(--paper); color: var(--ink-soft); border: 1px solid var(--line); }
  .lp-plan-name { font-family: var(--serif); font-size: 18px; font-weight: 700; color: var(--ink); margin-bottom: 4px; }
  .lp-price { font-family: var(--serif); font-size: 46px; font-weight: 900; color: var(--ink); letter-spacing: -1px; line-height: 1; margin-top: 10px; }
  .lp-price sup { font-size: 20px; vertical-align: super; font-weight: 700; }
  .lp-price-period { font-size: 14px; color: var(--ink-soft); margin-top: 6px; margin-bottom: 28px; }
  .lp-p-features { list-style: none; margin-bottom: 28px; flex-grow: 1; padding: 0; }
  .lp-p-features li { display: flex; align-items: center; gap: 9px; font-size: 14px; color: var(--ink); padding: 8px 0; border-bottom: 1px solid var(--line); }
  .lp-p-features li:last-child { border-bottom: none; }
  .lp-check { color: var(--purple); font-size: 15px; font-weight: 900; }
  .lp-trial-note { font-size: 12px; color: var(--ink-soft); margin-top: 14px; }

  /* ── FINAL CTA ── */
  .lp-fcta { background: var(--purple); padding: 110px 24px; text-align: center; overflow: hidden; }
  .lp-fcta-inner { position: relative; z-index: 1; }
  .lp-fcta h2 { font-family: var(--serif); font-size: clamp(30px,4.5vw,50px); font-weight: 700; color: var(--paper); line-height: 1.25; margin-bottom: 18px; }
  .lp-fcta p { font-size: 17px; color: rgba(255,255,255,0.8); margin-bottom: 38px; }
  .lp-btn-white {
    background: var(--paper); color: var(--purple-deep); border: none;
    border-radius: 50px; padding: 17px 42px; font-family: var(--sans);
    font-size: 17px; font-weight: 800; cursor: pointer;
    transition: transform 0.2s; box-shadow: 0 12px 32px rgba(0,0,0,0.18);
  }
  .lp-btn-white:hover { transform: translateY(-3px) rotate(1deg); }

  /* ── FOOTER ── */
  .lp-footer {
    background: var(--ink); padding: 32px 48px;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
  }
  .lp-footer .lp-logo { color: var(--paper); }
  .lp-footer p { font-size: 13px; color: #5C5668; }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .lp-nav { padding: 16px 20px; }
    .lp-hero { padding: 40px 20px 24px; }
    .lp-hero-grid { grid-template-columns: 1fr; }
    .lp-hero-visual { display: none; }
    .lp-insights-grid { grid-template-columns: 1fr; }
    .lp-cmp-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 768px) {
    .lp-section { padding: 64px 20px; }
    .lp-dark { padding: 64px 20px; }
    .lp-press-wrap { padding: 64px 20px; }
    .lp-pricing-wrap { padding: 64px 20px; }
    .lp-fcta { padding: 72px 20px; }
    .lp-footer { padding: 24px 20px; flex-direction: column; text-align: center; }
  }
  @media (max-width: 600px) {
    .lp-pricing-grid { grid-template-columns: 1fr; max-width: 380px; }
    .lp-p-card.lp-featured { transform: none; }
    .lp-step:nth-child(1), .lp-step:nth-child(2), .lp-step:nth-child(3) { transform: none; }
    .lp-press-card { padding: 24px 20px; }
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [activeMood, setActiveMood] = useState(2);

  // Redirect native app users who are already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && Capacitor.isNativePlatform()) navigate("/app/dashboard");
    });
  }, [navigate]);

  // Scroll-reveal via IntersectionObserver
  useEffect(() => {
    const els = document.querySelectorAll(".lp-reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const goAuth = () => navigate("/register");

  const moods = ["😔", "😐", "🙂", "😄", "🤩"];

  return (
    <div className="lp-root" dir="rtl">
      <style>{CSS}</style>

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <span className="lp-logo">NestAI</span>
        <button className="lp-nav-cta" onClick={goAuth}>התחל בחינם</button>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-grid">

          {/* Phone + scattered thoughts */}
          <div className="lp-hero-visual">
            <div className="lp-scatter-zone">
              <div className="lp-thought lp-t1">"לא חשבתי על זה קודם..."</div>
              <div className="lp-thought lp-t2">למה אני ככה?</div>
              <div className="lp-thought lp-t3">צריך לעבד את זה</div>
              <div className="lp-thought lp-t4">שוב אותו דפוס</div>
            </div>
            <div className="lp-phone">
              <div className="lp-phone-screen">
                <div className="lp-status"><span>21:14</span><span>🔋</span></div>
                <div className="lp-cin-lbl">יום שלישי, 21 ביוני</div>
                <div className="lp-cin-q">איך אתה מרגיש עכשיו?</div>
                <div className="lp-mood-row">
                  {moods.map((em, i) => (
                    <div key={em} className={`lp-mood-btn${activeMood === i ? " lp-on" : ""}`} onClick={() => setActiveMood(i)}>
                      {em}
                    </div>
                  ))}
                </div>
                <div className="lp-ai-bubble">
                  <span className="lp-ai-lbl">✦ NestAI</span>
                  <p>ראיתי שהשבוע הרגשת טוב יותר בימים שיצאת לטבע. רוצה לדבר על מה שמשפיע על המצב רוח שלך?</p>
                </div>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="lp-hero-copy">
            <p className="lp-eyebrow">המרחב האישי שלך בין הטיפולים</p>
            <h1>לא רק לתעד.<br />לעבד<span className="lp-accent">.</span></h1>
            <p>עדכון יומי של 30 שניות. ואז NestAI עוזר לך להבין מה באמת קורה אצלך.</p>
            <div className="lp-hero-actions">
              <button className="lp-btn-primary" onClick={goAuth}>7 ימים חינם – בלי כרטיס אשראי</button>
            </div>
            <div className="lp-stores">
              <a href="https://apps.apple.com/il/app/nestai-care/id6760186559" target="_blank" rel="noopener noreferrer" className="lp-store-link"> App Store</a>
              <a href="/app/install" className="lp-store-link"> אנדרואיד (PWA)</a>
            </div>
          </div>

        </div>
      </section>

      {/* ── STEPS ── */}
      <section className="lp-section lp-reveal">
        <div className="lp-section-title">שלושה צעדים. פחות מדקה ביום.</div>
        <div className="lp-steps">
          {[
            { mark: "א.", title: "מה מצב הרוח שלך היום?", text: "פעם ביום, מספר שניות בודדות." },
            { mark: "ב.", title: "כתיבה חופשית",           text: "יומן שקט לעיבוד מחשבות, או צ'אט AI לשיחה." },
            { mark: "ג.", title: "זמן להכיר את עצמך",     text: "NestAI מזהה דפוסים ועוזר לך להכיר את עצמך טוב יותר, לא רק לתעד את זה." },
          ].map((s) => (
            <div key={s.mark} className="lp-step">
              <div className="lp-step-mark">{s.mark}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="lp-dark">
        <div className="lp-dark-inner lp-reveal">
          <div className="lp-section-title">לא עוד צ'אט עם בוט.</div>
          <div className="lp-cmp-grid">
            <div className="lp-cmp-card lp-cmp-them">
              <h4>ChatGPT / כל כלי AI אחר</h4>
              {[
                "צ'אט כללי שחוזר לנקודת ההתחלה בכל שיחה",
                "לא מנטר שינה ולא זוכר את מצב הרוח שלך אתמול",
                "לא בנוי לעיבוד רגשי",
              ].map((t) => (
                <div key={t} className="lp-cmp-item"><div className="lp-cmp-dot" /><span>{t}</span></div>
              ))}
            </div>
            <div className="lp-cmp-card lp-cmp-us">
              <h4>NestAI</h4>
              {[
                "זוכר את ההיסטוריה הרגשית שלך",
                "מזהה דפוסים ומגמות",
                "נבנה לתמוך ולהעצים את התהליך האישי",
              ].map((t) => (
                <div key={t} className="lp-cmp-item"><div className="lp-cmp-dot" /><span>{t}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INSIGHTS ── */}
      <section className="lp-section lp-reveal">
        <div className="lp-section-title">תובנות ומגמות</div>
        <div className="lp-insights-grid">
          <div>
            <p className="lp-insights-lead">רואים את התמונה השלמה.</p>
            <p className="lp-insights-body">
              NestAI אוסף את הנקודות לאורך זמן ומראה לך את מה שקשה לראות מבפנים: ימים שחוזרים על עצמם,
              טריגרים שמופיעים שוב ושוב, ושינוי התנהגותי שלא תמיד שמים לב אליו.
            </p>
          </div>
          <div className="lp-insights-card">
            <div className="lp-insights-row">
              <span className="lp-insights-lbl">מגמה שבועית</span>
              <span className="lp-insights-pill">משתפר ↑</span>
            </div>
            <div className="lp-bars">
              {[30, 45, 35, 60, 55, 75, 80].map((h, i) => (
                <div key={i} className="lp-bar" style={{ height: `${h}%` }} />
              ))}
            </div>
            <p className="lp-insight-note">✦ שמתי לב שימים שבהם ישנת יותר משבע שעות, המצב רוח שלך עלה משמעותית למחרת.</p>
          </div>
        </div>
      </section>

      {/* ── PRIVACY ── */}
      <section className="lp-dark">
        <div className="lp-dark-inner lp-reveal">
          <p className="lp-section-tag">פרטיות ואבטחה</p>
          <div className="lp-section-title">המחשבות שלך נשארות שלך.</div>
          <div className="lp-priv-grid">
            {[
              { icon: "🔒", title: "הצפנה מקצה לקצה",         text: "כל מה שאתה כותב מוצפן ולא נגיש לאף אחד מלבדך." },
              { icon: "🚫", title: "בלי שיתוף עם צד שלישי",  text: "הנתונים שלך לא נמכרים, לא משותפים, לא מנותחים לפרסום." },
              { icon: "🗑️", title: "מחיקה מלאה בכל רגע",     text: "רוצה למחוק הכל? לחיצה אחת ואין זכר." },
            ].map((item) => (
              <div key={item.title} className="lp-priv-item">
                <div className="lp-priv-icon">{item.icon}</div>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRESS ── */}
      {/* ── PRICING ── */}
      <section className="lp-pricing-wrap lp-reveal" id="trial">
        <div className="lp-section-title">פשוט ושקוף.</div>
        <div className="lp-pricing-grid">

          {/* Monthly */}
          <div className="lp-p-card">
            <span className="lp-p-badge">חודשי</span>
            <div className="lp-plan-name">גמיש</div>
            <div className="lp-price">29<sup>₪</sup></div>
            <div className="lp-price-period">לחודש · ביטול בכל עת</div>
            <ul className="lp-p-features">
              {["עדכון יומי ומעקב מצב רוח", "יומן שקט לעיבוד מחשבות", "שיחה עם AI – ללא הגבלה", "תובנות ומגמות שבועיות", "מעקב שינה"].map((f) => (
                <li key={f}><span className="lp-check">✓</span>{f}</li>
              ))}
            </ul>
            <button className="lp-btn-primary" onClick={goAuth} style={{ width: "100%", textAlign: "center" }}>התחל 7 ימים חינם</button>
          </div>

          {/* Yearly — featured */}
          <div className="lp-p-card lp-featured">
            <span className="lp-p-badge">שנתי · חוסכים 30%</span>
            <div className="lp-plan-name">פרמיום</div>
            <div className="lp-price">249<sup>₪</sup></div>
            <div className="lp-price-period">לשנה · כ-20.75 ₪ לחודש</div>
            <ul className="lp-p-features">
              {["כל מה שבחבילה החודשית", "חיסכון של כ-100 ₪ בשנה", "תובנות ומגמות מתקדמות", "מעקב שינה מלא", "פרטיות מלאה ואבטחת מידע"].map((f) => (
                <li key={f}><span className="lp-check">✓</span>{f}</li>
              ))}
            </ul>
            <button className="lp-btn-primary" onClick={goAuth} style={{ width: "100%", textAlign: "center" }}>התחל 7 ימים חינם</button>
          </div>

        </div>
        <p className="lp-trial-note">7 ימי ניסיון חינם בשתי החבילות · ביטול בקליק בכל עת</p>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="lp-fcta">
        <div className="lp-fcta-inner lp-reveal">
          <h2>המחשבות שלך מחכות<br />לנחיתה רכה</h2>
          <p>התחל ב-7 ימים חינם. בלי מחויבות.</p>
          <button className="lp-btn-white" onClick={goAuth}>התחל עכשיו</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <span className="lp-logo" style={{ color: "var(--paper)" }}>NestAI</span>
        <p>© 2026 NestAI · כל הזכויות שמורות</p>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/privacy" style={{ fontSize: 13, color: "#5C5668", textDecoration: "underline" }}>מדיניות פרטיות</a>
          <a href="/terms" style={{ fontSize: 13, color: "#5C5668", textDecoration: "underline" }}>תנאי שימוש</a>
        </div>
      </footer>
    </div>
  );
}
