import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

type JournalEntry = {
  id: string;
  text: string;
  created_at: string;
};

const SilentJournal = () => {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const { toast } = useToast();
  const { isRTL, language } = useLanguage();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries]);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("decrypt-messages", {
        body: { source: "journal" },
      });
      if (error) throw error;
      setEntries((data?.messages || []) as JournalEntry[]);
    } catch (err) {
      console.error("Error loading journal entries:", err);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("encrypt-message", {
        body: {
          text: text.trim(),
          role: "user",
          is_system: false,
          reply_count: 0,
          source: "journal",
        },
      });

      if (error) throw error;

      // Add to entries list with the returned message
      if (data?.message) {
        setEntries(prev => [...prev, data.message as JournalEntry]);
      }

      toast({
        title: isRTL ? "הרשומה נשמרה ✓" : "Entry saved ✓",
        description: isRTL ? "הכתיבה שלך תיכלל בסיכום השבועי" : "Your writing will be included in the weekly summary",
      });
      setText("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving journal entry:", error);
      toast({
        title: isRTL ? "שגיאה בשמירה" : "Error saving",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "he" ? "he-IL" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 flex flex-col px-4 py-6 max-w-2xl mx-auto w-full">
        {/* Header area */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📝</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {isRTL ? "יומן שקט" : "Silent Journal"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            {isRTL
              ? "מרחב שקט לכתיבה חופשית. בלי תגובות, בלי ניתוח — רק את/ה והמילים."
              : "A quiet space for free writing. No responses, no analysis — just you and your words."}
          </p>
        </div>

        {/* Previous entries */}
        {loadingEntries ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-3 mb-6 overflow-y-auto max-h-[40vh]">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-card border border-border rounded-2xl px-4 py-3"
              >
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed break-words">
                  {entry.text}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDate(entry.created_at)}
                </p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        ) : null}

        {/* Text area */}
        <div className="flex-1 min-h-0">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              isRTL
                ? "מה עובר עלייך עכשיו? כתוב/י בחופשיות..."
                : "What's on your mind right now? Write freely..."
            }
            className="w-full h-full min-h-[180px] resize-none bg-background border border-border focus:border-primary rounded-2xl text-base leading-relaxed p-4"
            style={{ fontSize: "16px" }}
            maxLength={10000}
          />
        </div>

        {/* Save button */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {text.length > 0 && `${text.length.toLocaleString()} ${isRTL ? "תווים" : "chars"}`}
          </span>
          <Button
            onClick={handleSave}
            disabled={saving || !text.trim()}
            className="rounded-2xl min-w-[120px]"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <>✓ {isRTL ? "נשמר" : "Saved"}</>
            ) : (
              <>
                <Save className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {isRTL ? "שמור רשומה" : "Save Entry"}
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default SilentJournal;
