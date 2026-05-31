import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import BackButton from "@/components/BackButton";

interface GratitudeEntry {
  id: string;
  content: string;
  created_at: string;
}

interface DayGroup {
  dateLabel: string;
  isoDate: string;
  entries: GratitudeEntry[];
}

// Groups entries by calendar day (Israel locale)
function groupByDay(entries: GratitudeEntry[]): DayGroup[] {
  const map = new Map<string, GratitudeEntry[]>();

  for (const entry of entries) {
    const d = new Date(entry.created_at);
    const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!map.has(isoDate)) map.set(isoDate, []);
    map.get(isoDate)!.push(entry);
  }

  // Sort days descending (newest first)
  const sorted = [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return sorted.map(([isoDate, dayEntries]) => {
    const d = new Date(isoDate + "T12:00:00");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const toISO = (dt: Date) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

    let dateLabel: string;
    if (isoDate === toISO(today)) {
      dateLabel = "היום";
    } else if (isoDate === toISO(yesterday)) {
      dateLabel = "אתמול";
    } else {
      dateLabel = d.toLocaleDateString("he-IL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }

    return { dateLabel, isoDate, entries: dayEntries };
  });
}

const Gratitude = () => {
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/app/auth");
        return;
      }

      const { data, error } = await supabase
        .from("gratitude_entries")
        .select("id, content, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setGroups(groupByDay(data));
        setTotalCount(data.length);
      }
      setLoading(false);
    };

    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AppHeader />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <BackButton />

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🙏</span>
            <div>
              <h1 className="text-[22px] font-bold text-foreground leading-tight">התודות שלי</h1>
              {totalCount > 0 && (
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  {totalCount} רשומות תודה
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {groups.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">🙏</span>
            </div>
            <h2 className="text-[18px] font-semibold text-foreground mb-2">עדיין אין תודות</h2>
            <p className="text-[14px] text-muted-foreground max-w-[260px] mx-auto">
              התחל לרשום תודות יומיות מכרטיס התודות בדף הבית
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.isoDate}>
                {/* Day label */}
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-[12px] font-semibold uppercase tracking-wide"
                    style={{ color: "#64748b" }}
                  >
                    {group.dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span
                    className="text-[11px] font-medium"
                    style={{
                      color: group.entries.length >= 3 ? "#16a34a" : "#94a3b8",
                      background: group.entries.length >= 3 ? "#dcfce7" : "#f1f5f9",
                      borderRadius: 50,
                      padding: "2px 8px",
                    }}
                  >
                    {group.entries.length}/3
                  </span>
                </div>

                {/* Entry bubbles */}
                <div className="space-y-2">
                  {group.entries.map((entry, i) => (
                    <div
                      key={entry.id}
                      style={{
                        background: "#f0f9ff",
                        border: "0.5px solid #bae6fd",
                        borderRadius: 12,
                        padding: "11px 14px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 14, color: "#0ea5e9", flexShrink: 0, marginTop: 1 }}>
                        {i === 0 ? "✦" : i === 1 ? "✦" : "✦"}
                      </span>
                      <p style={{ margin: 0, fontSize: 14, color: "#0c4a6e", lineHeight: 1.6 }}>
                        {entry.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground/50 py-6">
          © {new Date().getFullYear()} NestAI.care
        </div>
      </div>
    </div>
  );
};

export default Gratitude;
