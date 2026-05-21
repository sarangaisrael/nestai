import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

interface Topic {
  title: string;
  description: string;
  emoji: string;
}

const SessionPrepCard = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [noData, setNoData] = useState(false);
  const { toast } = useToast();
  const { isRTL } = useLanguage();

  const generate = async () => {
    setLoading(true);
    setNoData(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-session-prep");
      if (error) throw error;

      if (data?.noData) {
        setNoData(true);
        setGenerated(true);
        return;
      }

      setTopics(data?.topics || []);
      setGenerated(true);
    } catch (err) {
      console.error("Session prep error:", err);
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: isRTL ? "לא הצלחנו ליצור הכנה לפגישה" : "Could not generate session prep",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const text = topics
      .map((t, i) => `${t.emoji} ${t.title}\n${t.description}`)
      .join("\n\n");
    const header = isRTL ? "הכנה לפגישה הבאה" : "Prep for Next Session";
    navigator.clipboard.writeText(`${header}\n\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: isRTL ? "הועתק בהצלחה" : "Copied!",
      description: isRTL ? "אפשר לשלוח למטפל/ת" : "Ready to share with your therapist",
    });
  };

  if (!generated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-dashed border-2 border-primary/20 bg-primary/[0.02] rounded-3xl overflow-hidden">
          <CardContent className="flex flex-col items-center gap-4 py-8 px-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                {isRTL ? "הכנה לפגישה הבאה" : "Prep for Next Session"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                {isRTL
                  ? "קבלו 3-4 נושאים מרכזיים מהשבוע האחרון לדיון בפגישת הטיפול"
                  : "Get 3-4 key topics from the past week for your therapy session"}
              </p>
            </div>
            <Button
              onClick={generate}
              disabled={loading}
              className="rounded-2xl h-11 px-6 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isRTL ? "מכין..." : "Preparing..."}
                </>
              ) : (
                <>
                  <Sparkles className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {isRTL ? "תכין אותי" : "Generate Prep"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (noData) {
    return (
      <Card className="rounded-3xl border-border/50">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground text-sm">
            {isRTL
              ? "אין מספיק כתיבה מהשבוע האחרון. כתבו עוד ונחזור עם הנושאים 💙"
              : "Not enough entries from the past week. Write more and we'll prepare your topics 💙"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="rounded-3xl border-border shadow-card overflow-hidden relative">
          {/* Subtle gradient header bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-primary/60 to-accent" />
          
          <CardHeader className="pb-2 pt-5 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <span>🎯</span>
                {isRTL ? "הכנה לפגישה הבאה" : "Prep for Next Session"}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="rounded-xl h-8 gap-1.5 text-xs font-medium"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-primary" />
                    {isRTL ? "הועתק!" : "Copied!"}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    {isRTL ? "העתקה" : "Copy"}
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isRTL
                ? "נושאים מרכזיים מהשבוע – שתפו עם המטפל/ת או השתמשו כבסיס לשיחה"
                : "Key topics from this week – share with your therapist or use as a starting point"}
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6 pt-2 space-y-3">
            {topics.map((topic, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{topic.emoji}</span>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm text-foreground leading-snug">
                    {topic.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {topic.description}
                  </p>
                </div>
              </motion.div>
            ))}

            <div className="flex items-center justify-between pt-3 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground/60">
                {isRTL ? "מבוסס על הכתיבה של 7 הימים האחרונים" : "Based on the last 7 days of writing"}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setGenerated(false); setTopics([]); }}
                className="text-xs h-7 text-muted-foreground hover:text-foreground"
              >
                {isRTL ? "יצירה מחדש" : "Regenerate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default SessionPrepCard;
