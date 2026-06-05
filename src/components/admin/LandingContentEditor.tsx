import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";

interface FieldDef {
  key: string;
  label: string;
  multiline?: boolean;
  group: string;
}

const FIELD_DEFS: FieldDef[] = [
  // ── Navbar ──────────────────────────────────────────────────────────────────
  { key: 'nav_cta2_text',      label: 'כפתור ניווט (CTA)',                    group: '🗂️ ניווט' },

  // ── Hero ─────────────────────────────────────────────────────────────────────
  { key: 'hero_eyebrow',       label: 'שורת eyebrow (סגול)',                  group: '🦸 Hero' },
  { key: 'hero_eyebrow2',      label: 'שורת eyebrow 2 (אפור)',                group: '🦸 Hero' },
  { key: 'hero_line1',         label: 'כותרת H1 — חלק שחור',                 group: '🦸 Hero' },
  { key: 'hero_line2',         label: 'כותרת H1 — חלק צבעוני (אינדיגו)',     group: '🦸 Hero' },
  { key: 'hero_subtitle',      label: 'פסקת משנה',                            group: '🦸 Hero', multiline: true },
  { key: 'hero_cta1',          label: 'כפתור ראשי',                           group: '🦸 Hero' },
  { key: 'hero_badge1',        label: 'תג אמינות 1',                          group: '🦸 Hero' },
  { key: 'hero_badge2',        label: 'תג אמינות 2',                          group: '🦸 Hero' },
  { key: 'hero_badge3',        label: 'תג אמינות 3',                          group: '🦸 Hero' },

  // ── Steps section ────────────────────────────────────────────────────────────
  { key: 'steps_title',        label: 'כותרת הסקשן',                          group: '👣 3 צעדים' },
  { key: 'steps_subtitle',     label: 'תת-כותרת הסקשן',                       group: '👣 3 צעדים', multiline: true },
  { key: 'step1_title',        label: 'צעד 1 — כותרת',                        group: '👣 3 צעדים' },
  { key: 'step1_body',         label: 'צעד 1 — גוף',                          group: '👣 3 צעדים', multiline: true },
  { key: 'step2_title',        label: 'צעד 2 — כותרת',                        group: '👣 3 צעדים' },
  { key: 'step2_body',         label: 'צעד 2 — גוף',                          group: '👣 3 צעדים', multiline: true },
  { key: 'step3_title',        label: 'צעד 3 — כותרת',                        group: '👣 3 צעדים' },
  { key: 'step3_body',         label: 'צעד 3 — גוף',                          group: '👣 3 צעדים', multiline: true },

  // ── CTA section ──────────────────────────────────────────────────────────────
  { key: 'cta_section_title',  label: 'כותרת',                                group: '📣 סקשן CTA' },
  { key: 'cta_section_sub',    label: 'תת-כותרת',                             group: '📣 סקשן CTA', multiline: true },
  { key: 'cta_section_button', label: 'טקסט כפתור',                           group: '📣 סקשן CTA' },

  // ── Footer ───────────────────────────────────────────────────────────────────
  { key: 'footer_text',        label: 'טקסט פוטר',                            group: '🦶 פוטר', multiline: true },
];

// Get unique groups in order of first appearance
const GROUPS = FIELD_DEFS.reduce<string[]>((acc, field) => {
  if (!acc.includes(field.group)) acc.push(field.group);
  return acc;
}, []);

const LandingContentEditor = () => {
  const { toast } = useToast();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('landing_content')
          .select('*')
          .eq('id', 1)
          .single();

        if (!error && data) {
          const stringified: Record<string, string> = {};
          Object.entries(data).forEach(([k, v]) => {
            stringified[k] = v == null ? '' : String(v);
          });
          setForm(stringified);
        }
      } catch {
        // Leave form empty; defaults will appear as placeholders
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('landing_content')
        .upsert({ id: 1, ...form, updated_at: new Date().toISOString() });

      if (error) throw error;

      toast({
        title: 'נשמר בהצלחה',
        description: 'תכני עמוד הנחיתה עודכנו.',
      });
    } catch (err: any) {
      toast({
        title: 'שגיאה בשמירה',
        description: err?.message ?? 'אנא נסה שוב.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">עמוד נחיתה — עריכת תוכן</h2>
          <p className="text-muted-foreground text-sm mt-1">
            ערוך את כל תכני עמוד הנחיתה הראשי. השינויים יופיעו מיידית לאחר שמירה.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="shrink-0 gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          שמור הכל
        </Button>
      </div>

      {/* Groups */}
      {GROUPS.map(group => {
        const fields = FIELD_DEFS.filter(f => f.group === group);
        return (
          <div key={group} className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">{group}</h3>
            <div className="grid gap-3">
              {fields.map(field => (
                <Card key={field.key} className="p-4 space-y-2">
                  <label
                    htmlFor={field.key}
                    className="block text-sm font-medium text-foreground"
                  >
                    {field.label}
                  </label>
                  {field.multiline ? (
                    <Textarea
                      id={field.key}
                      value={form[field.key] ?? ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      rows={3}
                      className="text-sm resize-y"
                      dir="rtl"
                    />
                  ) : (
                    <Input
                      id={field.key}
                      value={form[field.key] ?? ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      className="text-sm"
                      dir="rtl"
                    />
                  )}
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Bottom save button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          שמור הכל
        </Button>
      </div>
    </div>
  );
};

export default LandingContentEditor;
