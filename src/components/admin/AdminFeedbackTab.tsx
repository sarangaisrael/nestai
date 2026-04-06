import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { format } from "date-fns";

interface FeedbackRow {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  email?: string;
}

const AdminFeedbackTab = () => {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("user_feedback" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100) as any;

      if (error) throw error;

      // Get emails for user IDs
      const userIds = [...new Set((data || []).map((f: any) => f.user_id))] as string[];
      let emailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: emails } = await supabase.rpc("get_admin_user_emails", {
          user_ids: userIds,
        });
        (emails || []).forEach((e: any) => {
          emailMap[e.user_id] = e.email;
        });
      }

      setFeedback(
        (data || []).map((f: any) => ({
          ...f,
          email: emailMap[f.user_id] || "—",
        }))
      );
    } catch (e) {
      console.error("Error loading feedback:", e);
    } finally {
      setLoading(false);
    }
  };

  const avgRating =
    feedback.length > 0
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
      : "—";

  if (loading) {
    return <p className="text-sm text-muted-foreground">טוען משובים...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Card className="p-4 flex items-center gap-3">
          <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
          <div>
            <p className="text-2xl font-bold text-foreground">{avgRating}</p>
            <p className="text-xs text-muted-foreground">ממוצע מ-{feedback.length} משובים</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex gap-1">
            {[5, 4, 3, 2, 1].map((r) => {
              const count = feedback.filter((f) => f.rating === r).length;
              return (
                <div key={r} className="flex flex-col items-center gap-1">
                  <div
                    className="w-6 bg-primary/20 rounded-t"
                    style={{
                      height: `${Math.max(4, (count / Math.max(feedback.length, 1)) * 60)}px`,
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">{r}⭐</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {feedback.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין משובים עדיין</p>
      ) : (
        <div className="space-y-3">
          {feedback.map((f) => (
            <Card key={f.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= f.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/20"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{f.email}</span>
                  </div>
                  {f.comment && (
                    <p className="text-sm text-foreground">{f.comment}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(f.created_at), "dd/MM/yyyy")}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackTab;
