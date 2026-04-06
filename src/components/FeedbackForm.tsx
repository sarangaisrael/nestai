import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";

interface FeedbackFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeedbackForm = ({ open, onOpenChange }: FeedbackFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { isRTL, dir } = useLanguage();

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from("user_feedback" as any).insert({
        user_id: session.user.id,
        rating,
        comment: comment.trim() || null,
      } as any);

      if (error) throw error;

      toast({
        title: isRTL ? "תודה על המשוב! 💙" : "Thanks for your feedback! 💙",
      });
      setRating(0);
      setComment("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast({
        title: isRTL ? "שגיאה בשליחה" : "Error submitting",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRTL ? "שלח/י משוב" : "Give Feedback"}
          </DialogTitle>
          <DialogDescription>
            {isRTL ? "נשמח לשמוע מה את/ה חושב/ת על NestAI" : "We'd love to hear what you think about NestAI"}
          </DialogDescription>
        </DialogHeader>

        {/* Star rating */}
        <div className="flex justify-center gap-1 py-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Comment */}
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={isRTL ? "הערות (אופציונלי)..." : "Comments (optional)..."}
          className="min-h-[100px] resize-none rounded-xl"
          maxLength={2000}
        />

        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || saving}
          className="w-full rounded-xl"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            isRTL ? "שלח משוב" : "Submit Feedback"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackForm;
