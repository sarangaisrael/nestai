import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { he as heLocale } from "date-fns/locale";

/* ── Brand tokens ── */
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

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  created_at: string;
  slug: string;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setPost(data as Post);
      }
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  /* ── SEO ── */
  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} | NestAI`;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    const setOg = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
      el.content = content;
    };

    if (post.excerpt) setMeta('description', post.excerpt);
    setOg('og:title', post.title);
    if (post.excerpt) setOg('og:description', post.excerpt);
    if (post.cover_image) setOg('og:image', post.cover_image);
    setOg('og:type', 'article');
  }, [post]);

  const formatDate = (iso: string) => {
    try {
      return format(new Date(iso), "d בMMMM yyyy", { locale: heLocale });
    } catch {
      return iso;
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: "'Heebo', sans-serif" }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${C.cardBorder}`, borderTopColor: C.accent, animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── 404 ── */
  if (notFound || !post) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: "'Heebo', sans-serif", gap: 16, padding: 24 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;800&display=swap');`}</style>
        <div style={{ fontSize: 56 }}>📄</div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: C.text, margin: 0 }}>המאמר לא נמצא</h1>
        <p style={{ fontSize: 15, color: C.textSec, margin: 0 }}>ייתכן שהמאמר הוסר או שהקישור שגוי.</p>
        <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 15, color: C.accent, fontWeight: 600, textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          חזרה לבלוג
        </Link>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Heebo', sans-serif", minHeight: '100vh', background: C.bg, color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap');
        .blog-content h1,.blog-content h2,.blog-content h3 { color: ${C.text}; font-weight: 700; line-height: 1.3; margin: 1.6em 0 0.6em; }
        .blog-content h1 { font-size: 1.9rem; }
        .blog-content h2 { font-size: 1.5rem; }
        .blog-content h3 { font-size: 1.2rem; }
        .blog-content p { margin: 0 0 1.1em; line-height: 1.85; }
        .blog-content ul,.blog-content ol { padding-right: 1.5em; margin: 0 0 1.1em; }
        .blog-content li { margin-bottom: 0.4em; line-height: 1.75; }
        .blog-content a { color: ${C.accent}; text-decoration: underline; }
        .blog-content blockquote { border-right: 4px solid ${C.accent}; padding: 10px 16px; background: ${C.bgAlt}; border-radius: 4px; margin: 1.2em 0; color: ${C.textSec}; }
        .blog-content img { max-width: 100%; border-radius: 10px; margin: 1.2em 0; }
        .blog-content code { background: ${C.bgAlt}; padding: 2px 6px; border-radius: 4px; font-size: 0.88em; }
        .blog-content pre { background: ${C.bgAlt}; padding: 16px; border-radius: 10px; overflow-x: auto; margin: 1.2em 0; }
        .blog-content hr { border: none; border-top: 1px solid ${C.cardBorder}; margin: 2em 0; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: C.navBg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.navBorder}`, height: 64 }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '100%' }}>
          <Link to="/blog" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: C.text, fontWeight: 500, textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            ← חזרה לבלוג
          </Link>
          <img src="/logo.png" alt="NestAI" style={{ height: 36, width: 'auto' }} />
          <Link to="/app/auth" style={{ background: 'none', border: 'none', color: C.text, fontSize: 14, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}>
            התחברות
          </Link>
        </div>
      </nav>

      {/* ── Cover image ── */}
      {post.cover_image && (
        <div style={{ paddingTop: 64, background: C.bgAlt }}>
          <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 24px 0' }}>
            <img
              src={post.cover_image}
              alt={post.title}
              style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: '0 0 16px 16px', display: 'block' }}
            />
          </div>
        </div>
      )}

      {/* ── Article ── */}
      <article style={{ maxWidth: '48rem', margin: '0 auto', padding: post.cover_image ? '48px 24px 80px' : '104px 24px 80px' }}>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EFF6FF', borderRadius: 50, padding: '4px 12px' }}>
            <BookOpen size={13} color={C.accent} />
            <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>מאמר</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.textSec }}>
            <Calendar size={13} />
            <span style={{ fontSize: 13 }}>{formatDate(post.created_at)}</span>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, color: C.text, lineHeight: 1.2, margin: '0 0 20px' }}>
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{ fontSize: '1.1rem', color: C.textSec, lineHeight: 1.75, margin: '0 0 36px', paddingBottom: 28, borderBottom: `1px solid ${C.cardBorder}` }}>
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        {post.content && (
          <div
            className="blog-content"
            style={{ fontSize: '1rem', color: C.text, lineHeight: 1.85 }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}

        {/* Back link */}
        <div style={{ marginTop: 56, paddingTop: 28, borderTop: `1px solid ${C.cardBorder}` }}>
          <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, color: C.accent, fontWeight: 600, textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            ← חזרה לכל המאמרים
          </Link>
        </div>
      </article>

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

export default BlogPost;
