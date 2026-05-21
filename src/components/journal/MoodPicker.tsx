import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

const MOODS = [
  { key: "happy", emoji: "😊", he: "שמח/ה", en: "Happy" },
  { key: "anxious", emoji: "😰", he: "חרד/ה", en: "Anxious" },
  { key: "exhausted", emoji: "😩", he: "מותש/ת", en: "Exhausted" },
  { key: "sad", emoji: "😢", he: "עצוב/ה", en: "Sad" },
  { key: "calm", emoji: "😌", he: "רגוע/ה", en: "Calm" },
] as const;

interface MoodPickerProps {
  /** Force the popover open externally */
  forceOpen?: boolean;
  /** Callback after a mood is selected */
  onMoodSelected?: (mood: string) => void;
}

const MoodPicker = ({ forceOpen, onMoodSelected }: MoodPickerProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { isRTL } = useLanguage();

  // Respond to external forceOpen
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const handleMoodSelect = async (mood: string) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from("mood_entries" as any).insert({
        user_id: session.user.id,
        mood,
      } as any);

      if (error) throw error;

      toast({
        title: isRTL ? "מצב הרוח נשמר ✓" : "Mood saved ✓",
        description: isRTL ? "תודה ששיתפת!" : "Thanks for sharing!",
      });
      setOpen(false);
      onMoodSelected?.(mood);
    } catch (error) {
      console.error("Error saving mood:", error);
      toast({
        title: isRTL ? "שגיאה" : "Error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Heart className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-3">
        <p className="text-sm font-medium text-foreground mb-2 text-center">
          {isRTL ? "איך את/ה מרגיש/ה?" : "How are you feeling?"}
        </p>
        <div className="flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => handleMoodSelect(m.key)}
              disabled={saving}
              className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors min-w-[52px]"
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] text-muted-foreground">{isRTL ? m.he : m.en}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MoodPicker;
