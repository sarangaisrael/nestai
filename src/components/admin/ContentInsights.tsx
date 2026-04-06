import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Minus, BarChart3, Heart, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmotionStat {
  name: string;
  percentage: number;
  trend: "up" | "down" | "stable";
}

interface ThemeStat {
  name: string;
  percentage: number;
}

interface Insights {
  emotions: EmotionStat[];
  themes: ThemeStat[];
}

interface Meta {
  total_summaries: number;
  unique_users: number;
  period: string;
  generated_at: string;
}

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-red-400" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-green-400" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

const ContentInsights = () => {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("content-insights");
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      if (!data?.insights) {
        setError("אין מספיק נתונים לניתוח");
        setInsights(null);
        return;
      }

      setInsights(data.insights);
      setMeta(data.meta);
      toast({ title: "✓ הנתונים עודכנו" });
    } catch (e: any) {
      setError(e?.message || "שגיאה בטעינת הנתונים");
      toast({ title: "שגיאה", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            נתונים אגרגטיביים ואנונימיים מסיכומים שבועיים. לחץ "רענן" כדי לטעון.
          </p>
        </div>
        <Button onClick={fetchInsights} disabled={loading} size="sm" className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? "מנתח..." : "רענן נתונים"}
        </Button>
      </div>

      {error && !insights && (
        <Card className="p-6 text-center text-muted-foreground">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{error}</p>
        </Card>
      )}

      {!insights && !loading && !error && (
        <Card className="p-10 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm font-medium">לחץ על "רענן נתונים" כדי לטעון את הנתונים</p>
          <p className="text-xs mt-1 opacity-70">הנתונים מבוססים על סיכומים שבועיים מ-30 יום אחרונים</p>
        </Card>
      )}

      {insights && (
        <>
          {/* Meta info */}
          {meta && (
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="bg-muted/50 px-3 py-1 rounded-full">{meta.total_summaries} סיכומים</span>
              <span className="bg-muted/50 px-3 py-1 rounded-full">{meta.unique_users} משתמשים ייחודיים</span>
              <span className="bg-muted/50 px-3 py-1 rounded-full">{meta.period}</span>
            </div>
          )}

          {/* Emotions */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              קטגוריות רגשיות (% מהמשתמשים)
            </h3>
            <div className="space-y-3">
              {insights.emotions.map((emotion) => (
                <div key={emotion.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendIcon trend={emotion.trend} />
                      <span className="text-sm font-medium text-foreground">{emotion.name}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-foreground">{emotion.percentage}%</span>
                  </div>
                  <Progress value={emotion.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </Card>

          {/* Themes */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Hash className="h-4 w-4 text-secondary" />
              נושאים מרכזיים (% מהמשתמשים)
            </h3>
            <div className="space-y-3">
              {insights.themes.map((theme) => (
                <div key={theme.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{theme.name}</span>
                    <span className="text-sm font-bold tabular-nums text-foreground">{theme.percentage}%</span>
                  </div>
                  <Progress value={theme.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </Card>

        </>
      )}
    </div>
  );
};

export default ContentInsights;
