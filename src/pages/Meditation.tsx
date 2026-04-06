import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star } from "lucide-react";
import AddToHomeBanner from "@/components/AddToHomeBanner";
import AppHeader from "@/components/AppHeader";
import BackButton from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useAppDirectives } from "@/hooks/useAppDirectives";
import { Loader2 } from "lucide-react";

interface MeditationItem {
  id: string;
  title: string;
  description: string;
  media_url: string;
  media_type: string;
  tags: string[];
  sort_order: number;
}

const Meditation = () => {
  const [meditations, setMeditations] = useState<MeditationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MeditationItem | null>(null);
  const { getValue } = useAppDirectives();
  const focusTheme = getValue("MEDITATION_FOCUS", "").toLowerCase();

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("meditations")
        .select("id, title, description, media_url, media_type, tags, sort_order")
        .eq("published", true)
        .order("sort_order", { ascending: true });

      if (!error && data) {
        setMeditations(data as MeditationItem[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Sort: if focus theme is set, matching meditations appear first
  const sorted = focusTheme
    ? [...meditations].sort((a, b) => {
        const aMatch = a.tags.some(t => t.toLowerCase().includes(focusTheme));
        const bMatch = b.tags.some(t => t.toLowerCase().includes(focusTheme));
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return a.sort_order - b.sort_order;
      })
    : meditations;

  if (selected) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => setSelected(null)} className="h-9 w-9">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Button>
          <h1 className="text-base font-medium text-foreground">{selected.title}</h1>
          <div className="w-9" />
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
            {selected.media_type === "youtube" ? (
              <iframe
                src={`https://www.youtube.com/embed/${selected.media_url}?autoplay=1`}
                title={selected.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <audio controls autoPlay className="w-full mt-4" src={selected.media_url}>
                הדפדפן לא תומך בנגן אודיו
              </audio>
            )}
          </div>
          <p className="text-muted-foreground text-center mt-4">{selected.description}</p>
          {selected.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {selected.tags.map(tag => (
                <span key={tag} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AppHeader />

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <BackButton />
        <AddToHomeBanner />

        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🧘</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">מדיטציות מודרכות</h1>
          <p className="text-base text-muted-foreground max-w-[360px] mx-auto">
            בחרו מדיטציה והתחילו לתרגל
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>אין מדיטציות זמינות כרגע</p>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            {sorted.map((med) => {
              const isHighlighted = focusTheme && med.tags.some(t => t.toLowerCase().includes(focusTheme));
              return (
                <button
                  key={med.id}
                  onClick={() => setSelected(med)}
                  className={`w-full p-5 rounded-xl border transition-all text-right group ${
                    isHighlighted
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isHighlighted ? "bg-primary/20" : "bg-primary/10 group-hover:bg-primary/20"
                    }`}>
                      {isHighlighted ? <Star className="h-6 w-6 text-primary" /> : <Play className="h-6 w-6 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{med.title}</h3>
                        {isHighlighted && (
                          <span className="text-[10px] bg-primary/20 text-primary font-medium px-2 py-0.5 rounded-full">מומלץ</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{med.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Meditation;
