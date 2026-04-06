import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowUp, ArrowDown, Trash2, Plus, Eye, EyeOff,
  GripVertical, Loader2, Save, Pencil, X,
} from "lucide-react";

interface LandingBlock {
  id: string;
  block_type: string;
  sort_order: number;
  visible: boolean;
  config: Record<string, any>;
}

const BLOCK_TYPE_LABELS: Record<string, string> = {
  hero: "🏠 Hero — כותרת ראשית",
  why: "❓ למה צריך את זה",
  features: "✨ פיצ׳רים",
  media: "📰 תקשורת / כתבות",
  cta: "🚀 קריאה לפעולה (CTA)",
  custom: "📝 בלוק מותאם אישית",
  problem_solution: "⚡ בעיה ופתרון",
};

const BLOCK_TYPES_FOR_ADD = [
  { value: "custom", label: "📝 בלוק טקסט מותאם אישית" },
  { value: "why", label: "❓ בלוק ״למה צריך את זה״" },
  { value: "features", label: "✨ בלוק פיצ׳רים" },
  { value: "media", label: "📰 בלוק תקשורת" },
  { value: "cta", label: "🚀 בלוק קריאה לפעולה" },
  { value: "problem_solution", label: "⚡ בלוק בעיה ופתרון" },
];

const LandingBlockManager = () => {
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<LandingBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<Record<string, any>>({});
  const [showAddNew, setShowAddNew] = useState(false);
  const [newBlockType, setNewBlockType] = useState("custom");
  const [newConfig, setNewConfig] = useState<Record<string, any>>({ title: "", body: "", badge: "" });

  const loadBlocks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("landing_blocks")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setBlocks((data || []).map((b: any) => ({ ...b, config: b.config || {} })));
    } catch (e) {
      console.error("loadBlocks", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBlocks(); }, [loadBlocks]);

  const handleMove = async (blockId: string, direction: "up" | "down") => {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= blocks.length) return;

    setSaving(blockId);
    try {
      const a = blocks[idx];
      const b = blocks[swapIdx];
      await Promise.all([
        supabase.from("landing_blocks").update({ sort_order: b.sort_order }).eq("id", a.id),
        supabase.from("landing_blocks").update({ sort_order: a.sort_order }).eq("id", b.id),
      ]);
      await loadBlocks();
      toast({ title: "✓ סדר עודכן" });
    } catch {
      toast({ title: "שגיאה", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const handleToggleVisible = async (block: LandingBlock) => {
    try {
      const { error } = await supabase
        .from("landing_blocks")
        .update({ visible: !block.visible })
        .eq("id", block.id);
      if (error) throw error;
      setBlocks((prev) => prev.map((b) => b.id === block.id ? { ...b, visible: !b.visible } : b));
      toast({ title: block.visible ? "✓ הבלוק הוסתר" : "✓ הבלוק מוצג" });
    } catch {
      toast({ title: "שגיאה", variant: "destructive" });
    }
  };

  const handleDelete = async (blockId: string) => {
    try {
      const { error } = await supabase.from("landing_blocks").delete().eq("id", blockId);
      if (error) throw error;
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      toast({ title: "✓ הבלוק נמחק" });
    } catch {
      toast({ title: "שגיאה", variant: "destructive" });
    }
  };

  const handleSaveConfig = async (blockId: string) => {
    setSaving(blockId);
    try {
      const { error } = await supabase
        .from("landing_blocks")
        .update({ config: editConfig })
        .eq("id", blockId);
      if (error) throw error;
      setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, config: editConfig } : b));
      setEditingId(null);
      toast({ title: "✓ נשמר" });
    } catch {
      toast({ title: "שגיאה", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const handleAddBlock = async () => {
    try {
      const maxOrder = blocks.length > 0 ? Math.max(...blocks.map((b) => b.sort_order)) : 0;
      let config: Record<string, any> = {};
      if (newBlockType === "custom") config = newConfig;
      if (newBlockType === "problem_solution") config = newConfig;
      const { error } = await supabase.from("landing_blocks").insert({
        block_type: newBlockType,
        sort_order: maxOrder + 1,
        visible: true,
        config,
      });
      if (error) throw error;
      toast({ title: "✓ בלוק נוסף" });
      setShowAddNew(false);
      setNewConfig({ title: "", body: "", badge: "" });
      setNewBlockType("custom");
      await loadBlocks();
    } catch {
      toast({ title: "שגיאה", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">ניהול בלוקים — עמוד הנחיתה</h3>
          <p className="text-xs text-muted-foreground mt-1">
            הזז בלוקים למעלה/למטה, הסתר/הצג, מחק או הוסף בלוקים חדשים.
          </p>
        </div>
      </div>

      {blocks.map((block, idx) => (
        <Card
          key={block.id}
          className={`p-4 transition-all ${!block.visible ? "opacity-50 border-dashed" : "border-border"} ${editingId === block.id ? "border-primary/50 shadow-md" : ""}`}
        >
          {editingId === block.id ? (
            // Edit mode for custom blocks
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{BLOCK_TYPE_LABELS[block.block_type] || block.block_type}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
              </div>
              {block.block_type === "custom" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">תגית (Badge)</label>
                    <Input
                      value={editConfig.badge || ""}
                      onChange={(e) => setEditConfig((p) => ({ ...p, badge: e.target.value }))}
                      placeholder="אופציונלי"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">כותרת</label>
                    <Input
                      value={editConfig.title || ""}
                      onChange={(e) => setEditConfig((p) => ({ ...p, title: e.target.value }))}
                      placeholder="כותרת הבלוק"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">תוכן</label>
                    <Textarea
                      value={editConfig.body || ""}
                      onChange={(e) => setEditConfig((p) => ({ ...p, body: e.target.value }))}
                      placeholder="טקסט חופשי..."
                      className="min-h-[120px] text-sm leading-relaxed"
                    />
                  </div>
                </>
              )}
              {block.block_type === "problem_solution" && (
                <>
                  <p className="text-xs font-bold text-destructive">🔴 צד שמאל — האתגר</p>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">כותרת האתגר</label>
                    <Input
                      value={editConfig.problem_title || ""}
                      onChange={(e) => setEditConfig((p) => ({ ...p, problem_title: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">תוכן האתגר</label>
                    <Textarea
                      value={editConfig.problem_body || ""}
                      onChange={(e) => setEditConfig((p) => ({ ...p, problem_body: e.target.value }))}
                      className="min-h-[100px] text-sm leading-relaxed"
                    />
                  </div>
                  <p className="text-xs font-bold text-primary">🟢 צד ימין — הפתרון</p>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">כותרת הפתרון</label>
                    <Input
                      value={editConfig.solution_title || ""}
                      onChange={(e) => setEditConfig((p) => ({ ...p, solution_title: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">תוכן הפתרון</label>
                    <Textarea
                      value={editConfig.solution_body || ""}
                      onChange={(e) => setEditConfig((p) => ({ ...p, solution_body: e.target.value }))}
                      className="min-h-[100px] text-sm leading-relaxed"
                    />
                  </div>
                </>
              )}
              <Button size="sm" onClick={() => handleSaveConfig(block.id)} disabled={saving === block.id}>
                {saving === block.id ? <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" /> : <Save className="h-3.5 w-3.5 ml-1" />}
                שמור
              </Button>
            </div>
          ) : (
            // View mode
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1 shrink-0">
                <Button
                  variant="ghost" size="icon" className="h-6 w-6"
                  disabled={idx === 0 || saving === block.id}
                  onClick={() => handleMove(block.id, "up")}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-6 w-6"
                  disabled={idx === blocks.length - 1 || saving === block.id}
                  onClick={() => handleMove(block.id, "down")}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </div>

              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {BLOCK_TYPE_LABELS[block.block_type] || block.block_type}
                  </span>
                  {!block.visible && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">מוסתר</span>
                  )}
                </div>
                {block.block_type === "custom" && block.config?.title && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {block.config.title}
                  </p>
                )}
                {block.block_type === "problem_solution" && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {block.config?.problem_title} / {block.config?.solution_title}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {(block.block_type === "custom" || block.block_type === "problem_solution") && (
                  <Button
                    variant="outline" size="sm" className="h-8 gap-1 text-xs"
                    onClick={() => { setEditingId(block.id); setEditConfig({ ...block.config }); }}
                  >
                    <Pencil className="h-3 w-3" />ערוך
                  </Button>
                )}
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => handleToggleVisible(block)}
                  title={block.visible ? "הסתר" : "הצג"}
                >
                  {block.visible ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>מחיקת בלוק</AlertDialogTitle>
                      <AlertDialogDescription>
                        האם למחוק את הבלוק "{BLOCK_TYPE_LABELS[block.block_type] || block.block_type}"? פעולה זו לא ניתנת לביטול.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(block.id)} className="bg-destructive text-destructive-foreground">
                        מחק
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </Card>
      ))}

      {/* Add new block */}
      {showAddNew ? (
        <Card className="p-5 border-2 border-primary/30 bg-primary/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">הוסף בלוק חדש</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAddNew(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">סוג בלוק</label>
            <select
              value={newBlockType}
              onChange={(e) => setNewBlockType(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {BLOCK_TYPES_FOR_ADD.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {newBlockType === "custom" && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">תגית (Badge) — אופציונלי</label>
                <Input
                  value={newConfig.badge || ""}
                  onChange={(e) => setNewConfig((p) => ({ ...p, badge: e.target.value }))}
                  placeholder="למשל: חדש!"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">כותרת</label>
                <Input
                  value={newConfig.title || ""}
                  onChange={(e) => setNewConfig((p) => ({ ...p, title: e.target.value }))}
                  placeholder="כותרת הבלוק"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">תוכן</label>
                <Textarea
                  value={newConfig.body || ""}
                  onChange={(e) => setNewConfig((p) => ({ ...p, body: e.target.value }))}
                  placeholder="טקסט חופשי..."
                  className="min-h-[100px] text-sm leading-relaxed"
                />
              </div>
            </>
          )}

          {newBlockType === "problem_solution" && (
            <>
              <p className="text-xs font-bold text-destructive">🔴 האתגר</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">כותרת האתגר</label>
                <Input
                  value={newConfig.problem_title || ""}
                  onChange={(e) => setNewConfig((p) => ({ ...p, problem_title: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">תוכן האתגר</label>
                <Textarea
                  value={newConfig.problem_body || ""}
                  onChange={(e) => setNewConfig((p) => ({ ...p, problem_body: e.target.value }))}
                  className="min-h-[80px] text-sm leading-relaxed"
                />
              </div>
              <p className="text-xs font-bold text-primary">🟢 הפתרון</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">כותרת הפתרון</label>
                <Input
                  value={newConfig.solution_title || ""}
                  onChange={(e) => setNewConfig((p) => ({ ...p, solution_title: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">תוכן הפתרון</label>
                <Textarea
                  value={newConfig.solution_body || ""}
                  onChange={(e) => setNewConfig((p) => ({ ...p, solution_body: e.target.value }))}
                  className="min-h-[80px] text-sm leading-relaxed"
                />
              </div>
            </>
          )}

          <Button size="sm" onClick={handleAddBlock}>
            <Plus className="h-3.5 w-3.5 ml-1" />הוסף בלוק
          </Button>
        </Card>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowAddNew(true)} className="gap-1.5 w-full">
          <Plus className="h-4 w-4" />הוסף בלוק חדש
        </Button>
      )}
    </div>
  );
};

export default LandingBlockManager;
