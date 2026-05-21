import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface WeeklyEmotionMeterProps {
  summaryId: string;
}

const EMOTION_LEVELS = [
  { value: 1, color: "bg-green-500", label: { he: "מצוין", en: "Great" }, emoji: "😊" },
  { value: 2, color: "bg-lime-500", label: { he: "טוב", en: "Good" }, emoji: "🙂" },
  { value: 3, color: "bg-yellow-500", label: { he: "בסדר", en: "Okay" }, emoji: "😐" },
  { value: 4, color: "bg-orange-500", label: { he: "לא קל", en: "Not Easy" }, emoji: "😔" },
  { value: 5, color: "bg-red-500", label: { he: "קשה", en: "Hard" }, emoji: "😢" },
];

export const WeeklyEmotionMeter = ({ summaryId }: WeeklyEmotionMeterProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { isRTL } = useLanguage();

  useEffect(() => {
    loadExistingRating();
  }, [summaryId]);

  const loadExistingRating = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("weekly_emotion_ratings")
        .select("rating")
        .eq("summary_id", summaryId)
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading rating:", error);
        return;
      }

      if (data) {
        setRating(data.rating);
        setHasRated(true);
      }
    } catch (error) {
      console.error("Error loading rating:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveRating = async (newRating: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("weekly_emotion_ratings")
        .upsert({
          user_id: session.user.id,
          summary_id: summaryId,
          rating: newRating,
        }, {
          onConflict: "user_id,summary_id",
        });

      if (error) throw error;

      setHasRated(true);
      toast.success(isRTL ? "הדירוג נשמר!" : "Rating saved!");
    } catch (error) {
      console.error("Error saving rating:", error);
      toast.error(isRTL ? "שגיאה בשמירת הדירוג" : "Error saving rating");
    }
  };

  const calculateRatingFromPosition = (clientX: number): number => {
    if (!sliderRef.current) return 3;
    
    const rect = sliderRef.current.getBoundingClientRect();
    let percentage = (clientX - rect.left) / rect.width;
    
    // Clamp between 0 and 1
    percentage = Math.max(0, Math.min(1, percentage));
    
    // Convert to rating 1-5 (left=1=great, right=5=hard)
    const ratingValue = Math.round(percentage * 4) + 1;
    return Math.max(1, Math.min(5, ratingValue));
  };

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    const newRating = calculateRatingFromPosition(clientX);
    setRating(newRating);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const newRating = calculateRatingFromPosition(clientX);
    setRating(newRating);
  };

  const handleEnd = () => {
    if (isDragging && rating) {
      saveRating(rating);
    }
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleClick = (value: number) => {
    setRating(value);
    saveRating(value);
  };

  if (loading) {
    return (
      <div className="bg-muted/30 rounded-[14px] p-4 border border-border/50 animate-pulse">
        <div className="h-16 bg-muted rounded-lg" />
      </div>
    );
  }

  const currentEmotion = rating ? EMOTION_LEVELS.find(e => e.value === rating) : null;
  const thumbPosition = rating ? ((rating - 1) / 4) * 100 : 50;

  return (
    <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-[16px] p-5 border border-border/50 space-y-4">
      <div className="text-center">
        <h3 className="text-[15px] font-medium text-foreground mb-1">
          {isRTL ? "מד הרגשות השבועי" : "Weekly Emotion Meter"}
        </h3>
        <p className="text-[13px] text-muted-foreground">
          {hasRated 
            ? (isRTL ? "ניתן לעדכן בכל עת" : "You can update anytime")
            : (isRTL ? "החליקו או לחצו לבחירה" : "Slide or tap to select")}
        </p>
      </div>

      {/* Emotion display */}
      <div className="flex justify-center items-center h-16">
        {currentEmotion ? (
          <div className="text-center animate-in zoom-in-50 duration-200">
            <span className="text-4xl block mb-1">{currentEmotion.emoji}</span>
            <span className="text-[14px] font-medium text-foreground">
              {isRTL ? currentEmotion.label.he : currentEmotion.label.en}
            </span>
          </div>
        ) : (
          <span className="text-3xl opacity-50">🤔</span>
        )}
      </div>

      {/* Slider track */}
      <div
        ref={sliderRef}
        className="relative h-12 cursor-pointer select-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
      >
        {/* Background gradient - always green to red from left to right */}
        <div className="absolute inset-0 rounded-full overflow-hidden flex">
          <div className="flex-1 bg-green-500 transition-opacity duration-150" style={{ opacity: rating === 1 ? 1 : 0.6 }} onClick={() => handleClick(1)} />
          <div className="flex-1 bg-lime-500 transition-opacity duration-150" style={{ opacity: rating === 2 ? 1 : 0.6 }} onClick={() => handleClick(2)} />
          <div className="flex-1 bg-yellow-500 transition-opacity duration-150" style={{ opacity: rating === 3 ? 1 : 0.6 }} onClick={() => handleClick(3)} />
          <div className="flex-1 bg-orange-500 transition-opacity duration-150" style={{ opacity: rating === 4 ? 1 : 0.6 }} onClick={() => handleClick(4)} />
          <div className="flex-1 bg-red-500 transition-opacity duration-150" style={{ opacity: rating === 5 ? 1 : 0.6 }} onClick={() => handleClick(5)} />
        </div>

        {/* Thumb */}
        {rating && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg border-2 border-white flex items-center justify-center transition-all duration-150 pointer-events-none"
            style={{
              left: `calc(${thumbPosition}% - 20px)`,
            }}
          >
            <span className="text-xl">{currentEmotion?.emoji}</span>
          </div>
        )}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{isRTL ? "מצוין" : "Great"}</span>
        <span>{isRTL ? "קשה" : "Hard"}</span>
      </div>
    </div>
  );
};