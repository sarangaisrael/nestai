import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import BackButton from "@/components/BackButton";
import { Loader2, X, Play } from "lucide-react";

/* ── Types ──────────────────────────────────────────────────── */
interface MeditationVideo {
  id: string;
  title: string;
  instructor: string | null;
  duration_minutes: number | null;
  category: string | null;
  video_url: string | null;
  thumbnail_emoji: string;
  thumbnail_gradient: string;
  is_featured: boolean;
  is_new: boolean;
  sort_order: number;
}

/* ── Constants ───────────────────────────────────────────────── */
const CATEGORIES = ["הכל", "חרדה", "שינה", "נשימה", "מיקוד", "טראומה"];

const CATEGORY_GRADIENT: Record<string, string> = {
  חרדה:   "linear-gradient(135deg,#dbeafe,#eff6ff)",
  שינה:   "linear-gradient(135deg,#e0f2fe,#f0f9ff)",
  נשימה:  "linear-gradient(135deg,#d1fae5,#ecfdf5)",
  מיקוד:  "linear-gradient(135deg,#fef3c7,#fffbeb)",
  טראומה: "linear-gradient(135deg,#ede9fe,#faf5ff)",
};

/* ── Helpers ─────────────────────────────────────────────────── */
function extractYouTubeId(url: string): string {
  if (!url) return "";
  const t = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(t)) return t;
  const short = t.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  const long = t.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (long) return long[1];
  const embed = t.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embed) return embed[1];
  return t;
}

function durationLabel(mins: number | null): string {
  if (!mins) return "";
  if (mins < 60) return `${mins} דק׳`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}:${String(m).padStart(2, "0")} ש׳` : `${h} ש׳`;
}

const CSS = `
  .med-scroll-hide::-webkit-scrollbar { display: none; }
  .med-scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
  @keyframes med-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .med-fade-in { animation: med-fade-in 0.3s ease both; }
`;

/* ══════════════════════════════════════════════════════════════ */
const Meditation = () => {
  const [videos, setVideos]               = useState<MeditationVideo[]>([]);
  const [loading, setLoading]             = useState(true);
  const [category, setCategory]           = useState("הכל");
  const [playing, setPlaying]             = useState<MeditationVideo | null>(null);

  /* ── Load ── */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("meditation_videos")
        .select("id,title,instructor,duration_minutes,category,video_url,thumbnail_emoji,thumbnail_gradient,is_featured,is_new,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setVideos((data as MeditationVideo[]) ?? []);
      setLoading(false);
    })();
  }, []);

  /* ── Filtered list ── */
  const filtered = category === "הכל"
    ? videos
    : videos.filter((v) => v.category === category);

  const featured  = filtered.find((v) => v.is_featured) ?? null;
  const newVideos = filtered.filter((v) => v.is_new && v.id !== featured?.id);
  const popular   = filtered.filter((v) => !v.is_new && v.id !== featured?.id);

  /* ── Close modal on Escape ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPlaying(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Render ── */
  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Heebo', sans-serif" }} dir="rtl">
      <style>{CSS}</style>
      <AppHeader />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 0 80px" }}>
        <div style={{ padding: "24px 20px 0" }}>
          <BackButton />
        </div>

        {/* ── Page title ── */}
        <div style={{ padding: "16px 20px 0" }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.5px" }}>
            כלים טיפוליים 🧘
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0, fontWeight: 400 }}>
            מדיטציות ותרגילים לרגעים שבין הפגישות
          </p>
        </div>

        {/* ── Category pills ── */}
        <div
          className="med-scroll-hide"
          style={{
            display: "flex", gap: 8, overflowX: "auto",
            padding: "16px 20px 0", userSelect: "none",
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                flexShrink: 0,
                padding: "6px 16px",
                borderRadius: 50,
                border: `1.5px solid ${category === cat ? "transparent" : "#e2e8f0"}`,
                background: category === cat ? "#6366f1" : "#ffffff",
                color: category === cat ? "#ffffff" : "#64748b",
                fontSize: 13, fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s ease, color 0.15s ease",
                fontFamily: "'Heebo', sans-serif",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 size={28} style={{ animation: "spin 0.8s linear infinite", color: "#6366f1" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15, margin: 0 }}>אין סרטונים בקטגוריה זו עדיין</p>
          </div>
        ) : (
          <div style={{ padding: "20px 20px 0" }} className="med-fade-in">

            {/* ── Featured card ── */}
            {featured && (
              <button
                onClick={() => setPlaying(featured)}
                style={{
                  width: "100%", height: 180,
                  borderRadius: 20, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                  position: "relative", overflow: "hidden",
                  display: "flex", flexDirection: "column",
                  justifyContent: "flex-end", padding: 20,
                  marginBottom: 24, boxSizing: "border-box",
                  boxShadow: "0 8px 32px rgba(79,70,229,0.35)",
                  textAlign: "right",
                }}
              >
                {/* Badge */}
                <span style={{
                  position: "absolute", top: 14, right: 14,
                  background: "rgba(255,255,255,0.2)",
                  color: "#ffffff", fontSize: 11, fontWeight: 700,
                  borderRadius: 50, padding: "4px 12px",
                  backdropFilter: "blur(4px)",
                  fontFamily: "'Heebo', sans-serif",
                }}>
                  ✨ מומלץ השבוע
                </span>

                {/* Play button */}
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(255,255,255,0.92)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                }}>
                  <Play size={22} fill="#6366f1" color="#6366f1" style={{ marginRight: -2 }} />
                </div>

                {/* Text */}
                <div>
                  <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: "0 0 2px", lineHeight: 1.2 }}>
                    {featured.title}
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: 0, fontWeight: 400 }}>
                    {[featured.instructor, durationLabel(featured.duration_minutes)].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </button>
            )}

            {/* ── "פופולריים" section ── */}
            {popular.length > 0 && (
              <Section title="פופולריים" videos={popular} onPlay={setPlaying} />
            )}

            {/* ── "חדש באוסף" section ── */}
            {newVideos.length > 0 && (
              <Section title="חדש באוסף" videos={newVideos} onPlay={setPlaying} />
            )}
          </div>
        )}
      </div>

      {/* ── YouTube Modal ── */}
      {playing && (
        <VideoModal video={playing} onClose={() => setPlaying(null)} />
      )}
    </div>
  );
};

/* ── Section with 2-col grid ─────────────────────────────────── */
const Section = ({
  title, videos, onPlay,
}: {
  title: string;
  videos: MeditationVideo[];
  onPlay: (v: MeditationVideo) => void;
}) => (
  <div style={{ marginBottom: 28 }}>
    <h2 style={{
      fontSize: 16, fontWeight: 800, color: "#0f172a",
      margin: "0 0 12px", letterSpacing: "-0.2px",
    }}>
      {title}
    </h2>
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
    }}>
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} onClick={() => onPlay(v)} />
      ))}
    </div>
  </div>
);

/* ── Video Card ──────────────────────────────────────────────── */
const VideoCard = ({
  video, onClick,
}: {
  video: MeditationVideo;
  onClick: () => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const gradient = video.thumbnail_gradient || CATEGORY_GRADIENT[video.category ?? ""] || "linear-gradient(135deg,#ede9fe,#f5f3ff)";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#ffffff",
        border: `1.5px solid ${hovered ? "#c4b5fd" : "#e2e8f0"}`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        textAlign: "right",
        padding: 0,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        boxShadow: hovered ? "0 6px 20px rgba(0,0,0,0.09)" : "0 1px 4px rgba(0,0,0,0.04)",
        fontFamily: "'Heebo', sans-serif",
      }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 90, background: gradient,
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 36 }}>{video.thumbnail_emoji}</span>

        {/* Play overlay bottom-left */}
        <div style={{
          position: "absolute", bottom: 8, left: 8,
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(255,255,255,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          <Play size={12} fill="#6366f1" color="#6366f1" style={{ marginRight: -1 }} />
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "10px 10px 12px" }}>
        <p style={{
          fontSize: 12, fontWeight: 700, color: "#0f172a",
          margin: "0 0 5px", lineHeight: 1.3,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        } as React.CSSProperties}>
          {video.title}
        </p>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {video.duration_minutes && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: "#6366f1",
              background: "#ede9fe", borderRadius: 50,
              padding: "2px 7px",
            }}>
              {durationLabel(video.duration_minutes)}
            </span>
          )}
          {video.category && (
            <span style={{
              fontSize: 10, fontWeight: 500, color: "#64748b",
              background: "#f1f5f9", borderRadius: 50,
              padding: "2px 7px",
            }}>
              {video.category}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

/* ── YouTube Modal ───────────────────────────────────────────── */
const VideoModal = ({
  video, onClose,
}: {
  video: MeditationVideo;
  onClose: () => void;
}) => {
  const videoId = extractYouTubeId(video.video_url ?? "");

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 100,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 16px",
        fontFamily: "'Heebo', sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 560 }}
      >
        {/* Close button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Video embed */}
        <div style={{
          borderRadius: 16, overflow: "hidden",
          aspectRatio: "16/9", background: "#000",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}>
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&autoplay=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 14,
            }}>
              אין URL לסרטון זה
            </div>
          )}
        </div>

        {/* Video title */}
        <div style={{ marginTop: 14, textAlign: "center" }}>
          <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>
            {video.title}
          </p>
          {video.instructor && (
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: 0 }}>
              {video.instructor}
              {video.duration_minutes ? ` · ${durationLabel(video.duration_minutes)}` : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Meditation;
