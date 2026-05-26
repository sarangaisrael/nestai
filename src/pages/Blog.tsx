import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";
import { format } from "date-fns";
import { he as heLocale } from "date-fns/locale";

/* ── Brand tokens (matches LandingPage) ── */
const C = {
  bg:         '#F8F8F6',
  bgAlt:      '#F0F4F8',
  card:       '#ffffff',
  cardBorder: '#E5E7EB',
  text:       '#1A1A2E',
  textSec:    '#6B7280',
  accent:     '#4a9eff',
  navBg:      'rgba(248,248,246,0.9)',
  navBorder:  '#E5E7EB',
};

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  created_at: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "הבלוג שלנו | NestAI";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "מאמרים, תובנות ועצות לגבי תהליכי טיפול, בריאות נפשית ורצף טיפולי.");
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, cover_image, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (!error && data) setPosts(data as BlogPost[]);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const formatDate = (iso: string) => {
    try {
      return format(new Date(iso), "d בMMMM yyyy", { locale: heLocale });
    } catch {
      return iso;
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Heebo', sans-serif", minHeight: '100vh', background: C.bg, color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* ── Navbar ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: C.navBg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.navBorder}`, height: 64 }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '100%' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: C.text, fontWeight: 500, textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            חזרה לדף הבית
          </Link>
          <img src="/logo.png" alt="NestAI" style={{ height: 36, width: 'auto' }} />
          <Link to="/app/auth" style={{ background: 'none', border: 'none', color: C.text, fontSize: 14, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}>
            התחברות
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ paddingTop: 120, paddingBottom: 48, paddingLeft: 24, paddingRight: 24, background: C.bgAlt, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EFF6FF', borderRadius: 50, padding: '6px 16px', marginBottom: 16 }}>
          <BookOpen size={15} color={C.accent} />
          <span style={{ fontSize: 13, color: C.accent, fontWeight: 600 }}>הבלוג שלנו</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: C.text, margin: '0 0 12px', lineHeight: 1.2 }}>
          מאמרים ותובנות
        </h1>
        <p style={{ fontSize: '1.05rem', color: C.textSec, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          עצות, ידע ומחקר על בריאות נפשית, רצף טיפולי וטיפול בעצמך
        </p>
      </section>

      {/* ── Posts grid ── */}
      <section style={{ maxWidth: '64rem', margin: '0 auto', padding: '56px 24px 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${C.cardBorder}`, borderTopColor: C.accent, animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: C.text, marginBottom: 8 }}>עדיין אין מאמרים</p>
            <p style={{ fontSize: 14, color: C.textSec }}>נחזור בקרוב עם תוכן חדש</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 28 }}>
            {posts.map(post => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <article
                  style={{
                    background: C.card,
                    borderRadius: 16,
                    border: `1px solid ${C.cardBorder}`,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
                >
                  {/* Cover image */}
                  {post.cover_image ? (
                    <div style={{ height: 200, overflow: 'hidden' }}>
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
                      />
                    </div>
                  ) : (
                    <div style={{ height: 140, background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={40} color={C.accent} strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ padding: '20px 22px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <Calendar size={13} color={C.textSec} />
                      <span style={{ fontSize: 12, color: C.textSec }}>{formatDate(post.created_at)}</span>
                    </div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: C.text, margin: '0 0 10px', lineHeight: 1.4 }}>
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p style={{
                        fontSize: 14, color: C.textSec, lineHeight: 1.7, margin: '0 0 16px', flexGrow: 1,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {post.excerpt}
                      </p>
                    )}
                    <span style={{ fontSize: 13, color: C.accent, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto' }}>
                      קרא עוד ←
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#1A1A2E', borderTop: `1px solid #2a2a45`, padding: '28px 24px' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link to="/app/privacy" style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}>מדיניות פרטיות</Link>
            <Link to="/" style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}>דף הבית</Link>
          </div>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>© 2025 NestAI.care</span>
        </div>
      </footer>
    </div>
  );
};

export default Blog;
