import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

const ActionGrid = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [journalCount, setJournalCount] = useState<number | null>(null);
  const [hasSummary, setHasSummary]     = useState(false);
  const { isExpired }                   = useSubscription();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Count journal messages this week
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("role", "user")
        .gte("created_at", weekAgo);
      if (count !== null) setJournalCount(count);

      // Check for unviewed weekly summary
      const { data: summaries } = await supabase
        .from("weekly_summaries")
        .select("id")
        .eq("user_id", session.user.id)
        .is("viewed_at", null)
        .limit(1);
      if (summaries && summaries.length > 0) setHasSummary(true);
    };
    load();
  }, []);

  const tiles = [
    {
      label:    t.dashboard.weeklySummaries,
      subtitle: isExpired ? "🔒 " + t.dashboard.weeklySummariesSub : t.dashboard.weeklySummariesSub,
      emoji:    "📋",
      path:     "/app/summary",
      bg:       "#fffbeb",
      border:   "#fde68a",
      titleColor: "#92400e",
      subColor:   "#b45309",
      badge:    hasSummary ? "חדש" : null,
      badgeBg:  "#fde68a",
      badgeColor: "#92400e",
      locked:   isExpired,
    },
    {
      label:    t.dashboard.myJournal,
      subtitle: isExpired ? "🔒 " + t.dashboard.myJournalSub : t.dashboard.myJournalSub,
      emoji:    "📖",
      path:     "/app/chat",
      bg:       "#ecfdf5",
      border:   "#6ee7b7",
      titleColor: "#065f46",
      subColor:   "#059669",
      badge:    journalCount !== null ? `${journalCount}` : null,
      badgeBg:  "#6ee7b7",
      badgeColor: "#065f46",
      locked:   isExpired,
    },
    {
      label:    t.dashboard.therapyTools,
      subtitle: t.dashboard.therapyToolsSub,
      emoji:    "✨",
      path:     "/app/meditation",
      bg:       "#faf5ff",
      border:   "#c4b5fd",
      titleColor: "#5b21b6",
      subColor:   "#7c3aed",
      badge:    null,
      badgeBg:  "",
      badgeColor: "",
      locked:   false,
    },
    {
      label:    t.dashboard.monthlyTrends,
      subtitle: t.dashboard.monthlyTrendsSub,
      emoji:    "📈",
      path:     "/app/monthly-summary",
      bg:       "#eff6ff",
      border:   "#93c5fd",
      titleColor: "#1e40af",
      subColor:   "#3b82f6",
      badge:    "↑",
      badgeBg:  "#93c5fd",
      badgeColor: "#1e40af",
      locked:   false,
    },
  ];

  return (
    <>
      <style>{`
        .action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          font-family: 'Heebo', sans-serif;
        }
        @media (min-width: 768px) {
          .action-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
          }
        }
      `}</style>
      <div className="action-grid">
        {tiles.map((tile) => (
          <TileButton key={tile.path} tile={tile} onClick={() => navigate(tile.path)} />
        ))}
      </div>
    </>
  );
};

interface Tile {
  label: string; subtitle: string; emoji: string; path: string;
  bg: string; border: string; titleColor: string; subColor: string;
  badge: string | null; badgeBg: string; badgeColor: string;
  locked?: boolean;
}

const TileButton = ({ tile, onClick }: { tile: Tile; onClick: () => void }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:     tile.bg,
        border:         `1.5px solid ${tile.border}`,
        borderRadius:   16,
        padding:        "14px 12px 14px 14px",
        display:        "flex",
        flexDirection:  "column",
        cursor:         "pointer",
        textAlign:      "start",
        position:       "relative",
        transform:      hovered ? "translateY(-2px)" : "translateY(0)",
        transition:     "transform 0.18s ease, box-shadow 0.18s ease",
        boxShadow:      hovered ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
        fontFamily:     "'Heebo', sans-serif",
        opacity:        tile.locked ? 0.6 : 1,
      }}
    >
      {/* Badge — top-left (visual left = start in RTL) */}
      {tile.badge && (
        <span style={{
          position: "absolute", top: 10, left: 10,
          background: tile.badgeBg, color: tile.badgeColor,
          borderRadius: 50, padding: "1px 7px",
          fontSize: 10, fontWeight: 700,
        }}>
          {tile.badge}
        </span>
      )}

      {/* Emoji — top-right (visual right = end in RTL) */}
      <span style={{
        position: "absolute", top: 10, right: 10,
        fontSize: 18, lineHeight: 1,
      }}>
        {tile.emoji}
      </span>

      {/* Text — pushed down to clear the absolute elements */}
      <div style={{ marginTop: 28 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: tile.titleColor, margin: "0 0 3px", letterSpacing: "-0.2px" }}>
          {tile.label}
        </p>
        <p style={{ fontSize: 10, fontWeight: 500, color: tile.subColor, margin: 0, opacity: 0.85 }}>
          {tile.subtitle}
        </p>
      </div>
    </button>
  );
};

export default ActionGrid;
