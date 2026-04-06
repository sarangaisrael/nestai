import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, AlertTriangle, Repeat, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts";
import AppHeader from "@/components/AppHeader";
import BackButton from "@/components/BackButton";

interface Pattern {
  title: string;
  description: string;
  emoji: string;
  type: "pattern" | "trigger" | "positive" | "warning";
}

interface IntensityPoint {
  date: string;
  intensity: number;
  label: string;
}

const typeConfig: Record<string, { icon: any; bgClass: string; borderClass: string }> = {
  pattern: { icon: Repeat, bgClass: "bg-primary/8", borderClass: "border-primary/20" },
  trigger: { icon: AlertTriangle, bgClass: "bg-destructive/8", borderClass: "border-destructive/20" },
  positive: { icon: TrendingUp, bgClass: "bg-secondary/10", borderClass: "border-secondary/30" },
  warning: { icon: AlertTriangle, bgClass: "bg-accent/10", borderClass: "border-accent/30" },
};

const PatternsInsights = () => {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [intensityData, setIntensityData] = useState<IntensityPoint[]>([]);
  const [overallTrend, setOverallTrend] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [noData, setNoData] = useState(false);
  const { toast } = useToast();
  const { isRTL, dir } = useLanguage();
  const navigate = useNavigate();
  

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/app/auth");
    });
  }, [navigate]);

  const generate = async () => {
    setLoading(true);
    setNoData(false);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-patterns");
      if (error) throw error;

      if (data?.noData) {
        setNoData(true);
        setGenerated(true);
        return;
      }

      setPatterns(data?.patterns || []);
      setOverallTrend(data?.overallTrend || "");

      // Format intensity data for chart
      const formatted = (data?.intensityData || []).map((d: IntensityPoint) => ({
        ...d,
        shortDate: new Date(d.date).toLocaleDateString(isRTL ? "he-IL" : "en-US", { day: "numeric", month: "short" }),
      }));
      setIntensityData(formatted);
      setGenerated(true);
    } catch (err) {
      console.error("Patterns error:", err);
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: isRTL ? "לא הצלחנו לנתח דפוסים" : "Could not analyze patterns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.[0]) {
      const d = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-sm">
          <p className="font-semibold text-foreground">{d.shortDate}</p>
          <p className="text-muted-foreground">{d.label}</p>
          <p className="text-primary font-bold">{d.intensity}/10</p>
        </div>
      );
    }
    return null;
  };


  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <AppHeader />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <BackButton />

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span>🔍</span>
            {isRTL ? "דפוסים ותובנות" : "Patterns & Insights"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRTL
              ? "ניתוח 30 הימים האחרונים – דפוסים חוזרים, טריגרים ומגמות רגשיות"
              : "Analysis of the last 30 days – recurring patterns, triggers and emotional trends"}
          </p>
        </motion.div>

        {!generated ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-dashed border-2 border-primary/20 bg-primary/[0.02] rounded-3xl">
              <CardContent className="flex flex-col items-center gap-5 py-10 px-6">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-foreground">
                    {isRTL ? "גלו את הדפוסים שלכם" : "Discover Your Patterns"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-[320px]">
                    {isRTL
                      ? "ה-AI ינתח את הכתיבה מ-30 הימים האחרונים ויזהה דפוסים רגשיים, טריגרים ומגמות"
                      : "AI will analyze 30 days of writing to identify emotional patterns, triggers and trends"}
                  </p>
                </div>
                <Button
                  onClick={generate}
                  disabled={loading}
                  size="lg"
                  className="rounded-2xl h-12 px-8 font-semibold text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      {isRTL ? "מנתח..." : "Analyzing..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className={`h-5 w-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                      {isRTL ? "התחילו ניתוח" : "Start Analysis"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : noData ? (
          <Card className="rounded-3xl">
            <CardContent className="py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📝</span>
              </div>
              <p className="text-muted-foreground">
                {isRTL
                  ? "אין מספיק נתונים מ-30 הימים האחרונים. כתבו עוד ונוכל לזהות דפוסים 💙"
                  : "Not enough data from the last 30 days. Write more and we'll identify patterns 💙"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {/* Overall Trend */}
            {overallTrend && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="rounded-3xl border-secondary/20 bg-secondary/[0.04]">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-secondary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <TrendingUp className="h-4 w-4 text-secondary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1">
                          {isRTL ? "מגמה כללית" : "Overall Trend"}
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">{overallTrend}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Emotional Intensity Chart */}
            {intensityData.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="rounded-3xl overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-secondary via-primary to-accent" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <span>📈</span>
                      {isRTL ? "עוצמה רגשית לאורך החודש" : "Emotional Intensity Over the Month"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={intensityData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="intensityGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                          <XAxis
                            dataKey="shortDate"
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            domain={[0, 10]}
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            width={30}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="intensity"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2.5}
                            fill="url(#intensityGradient)"
                            dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Pattern Cards */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-foreground px-1">
                {isRTL ? "דפוסים שזוהו" : "Identified Patterns"}
              </h2>
              {patterns.map((pattern, index) => {
                const config = typeConfig[pattern.type] || typeConfig.pattern;
                const Icon = config.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.08 }}
                  >
                    <Card className={`rounded-2xl ${config.bgClass} ${config.borderClass} border`}>
                      <CardContent className="py-4 px-4">
                        <div className="flex gap-3">
                          <span className="text-2xl flex-shrink-0">{pattern.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-semibold text-sm text-foreground">{pattern.title}</h4>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                pattern.type === "positive" 
                                  ? "bg-secondary/15 text-secondary" 
                                  : pattern.type === "trigger" || pattern.type === "warning"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-primary/10 text-primary"
                              }`}>
                                {pattern.type === "pattern" ? (isRTL ? "דפוס" : "Pattern") :
                                 pattern.type === "trigger" ? (isRTL ? "טריגר" : "Trigger") :
                                 pattern.type === "positive" ? (isRTL ? "חיובי" : "Positive") :
                                 (isRTL ? "שימו לב" : "Notice")}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {pattern.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Regenerate */}
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setGenerated(false); setPatterns([]); setIntensityData([]); setOverallTrend(""); }}
                className="text-xs text-muted-foreground"
              >
                {isRTL ? "נתח מחדש" : "Re-analyze"}
              </Button>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground/60 py-6">
          {isRTL ? "© NestAI – כל הזכויות שמורות" : "© NestAI – All rights reserved"}
        </div>
      </div>
    </div>
  );
};

export default PatternsInsights;
