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
  toggle?: boolean;   // renders a boolean toggle instead of text input
  group: string;
}

// Column name mapping reference (semantic → actual DB column):
//   hero eyebrow line 1  → hero_cta2       (repurposed)
//   hero eyebrow line 2  → nav_cta1_text   (repurposed)
//   steps section title  → tools_title     (repurposed)
//   steps section sub    → tools_subtitle  (repurposed)
//   step 1 title/body    → slide1_title / slide1_subtitle
//   step 2 title/body    → slide2_title / slide2_subtitle
//   step 3 title/body    → slide3_title / slide3_subtitle
//   CTA block title      → card1_title     (repurposed)
//   CTA block subtitle   → card1_body      (repurposed)
//   CTA block button     → card1_cta       (repurposed)

const FIELD_DEFS: FieldDef[] = [
  // ── Navbar ──────────────────────────────────────────────────────────────────
  { key: 'nav_cta2_text',   label: 'כפתור ניווט (CTA)',                      group: '🗂️ ניווט' },

  // ── Hero ─────────────────────────────────────────────────────────────────────
  { key: 'hero_cta2',       label: 'Eyebrow — שורה 1 (סגול)',                group: '🦸 Hero' },
  { key: 'nav_cta1_text',   label: 'Eyebrow — שורה 2 (אפור)',                group: '🦸 Hero' },
  { key: 'hero_line1',      label: 'כותרת H1 — חלק שחור',                   group: '🦸 Hero' },
  { key: 'hero_line2',      label: 'כותרת H1 — חלק צבעוני (אינדיגו)',       group: '🦸 Hero' },
  { key: 'hero_subtitle',   label: 'פסקת משנה',                              group: '🦸 Hero', multiline: true },
  { key: 'hero_cta1',       label: 'כפתור ראשי (Hero)',                      group: '🦸 Hero' },
  { key: 'hero_badge1',     label: 'תג אמינות 1',                            group: '🦸 Hero' },
  { key: 'hero_badge2',     label: 'תג אמינות 2',                            group: '🦸 Hero' },
  { key: 'hero_badge3',     label: 'תג אמינות 3',                            group: '🦸 Hero' },

  // ── Steps section (stored in tools_* and slide*_title/subtitle columns) ─────
  { key: 'tools_title',     label: 'כותרת הסקשן',                            group: '👣 3 צעדים' },
  { key: 'tools_subtitle',  label: 'תת-כותרת הסקשן',                         group: '👣 3 צעדים', multiline: true },
  { key: 'slide1_title',    label: 'צעד 1 — כותרת',                          group: '👣 3 צעדים' },
  { key: 'slide1_subtitle', label: 'צעד 1 — גוף',                            group: '👣 3 צעדים', multiline: true },
  { key: 'slide2_title',    label: 'צעד 2 — כותרת',                          group: '👣 3 צעדים' },
  { key: 'slide2_subtitle', label: 'צעד 2 — גוף',                            group: '👣 3 צעדים', multiline: true },
  { key: 'slide3_title',    label: 'צעד 3 — כותרת',                          group: '👣 3 צעדים' },
  { key: 'slide3_subtitle', label: 'צעד 3 — גוף',                            group: '👣 3 צעדים', multiline: true },

  // ── CTA section (stored in card1_* columns) ──────────────────────────────────
  { key: 'card1_title',     label: 'כותרת',                                   group: '📣 סקשן CTA' },
  { key: 'card1_body',      label: 'תת-כותרת',                                group: '📣 סקשן CTA', multiline: true },
  { key: 'card1_cta',       label: 'טקסט כפתור',                              group: '📣 סקשן CTA' },

  // ── Footer ───────────────────────────────────────────────────────────────────
  { key: 'footer_text',           label: 'טקסט פוטר',           group: '🦶 פוטר', multiline: true },

  // ── Testimonials ─────────────────────────────────────────────────────────────
  { key: 'show_testimonials',     label: 'הצג סקשן המלצות',     group: '⭐ המלצות', toggle: true },
  { key: 'testimonial_1_quote',   label: 'המלצה 1 — ציטוט',     group: '⭐ המלצות', multiline: true },
  { key: 'testimonial_1_name',    label: 'המלצה 1 — שם',         group: '⭐ המלצות' },
  { key: 'testimonial_1_role',    label: 'המלצה 1 — תפקיד',      group: '⭐ המלצות' },
  { key: 'testimonial_2_quote',   label: 'המלצה 2 — ציטוט',     group: '⭐ המלצות', multiline: true },
  { key: 'testimonial_2_name',    label: 'המלצה 2 — שם',         group: '⭐ המלצות' },
  { key: 'testimonial_2_role',    label: 'המלצה 2 — תפקיד',      group: '⭐ המלצות' },
  { key: 'testimonial_3_quote',   label: 'המלצה 3 — ציטוט',     group: '⭐ המלצות', multiline: true },
  { key: 'testimonial_3_name',    label: 'המלצה 3 — שם',         group: '⭐ המלצות' },
  { key: 'testimonial_3_role',    label: 'המלצה 3 — תפקיד',      group: '⭐ המלצות' },
  { key: 'testimonial_4_quote',   label: 'המלצה 4 — ציטוט',     group: '⭐ המלצות', multiline: true },
  { key: 'testimonial_4_name',    label: 'המלצה 4 — שם',         group: '⭐ המלצות' },
  { key: 'testimonial_4_role',    label: 'המלצה 4 — תפקיד',      group: '⭐ המלצות' },
];

// Get unique groups in order of first appearance
const GROUPS = FIELD_DEFS.reduce<string[]>((acc, field) => {
  if (!acc.includes(field.group)) acc.push(field.group);
  return acc;
}, []);

const LandingContentEditor = () => {
  const { toast } = useToast();
  const [form, setForm] = useState<Record<string, string>>({});
  const [showTestimonials, setShowTestimonials] = useState(false);
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
          const d = data as Record<string, unknown>;
          // Handle boolean toggle separately
          setShowTestimonials(d.show_testimonials === true);
          // Stringify all other fields for the text form
          const stringified: Record<string, string> = {};
          Object.entries(d).forEach(([k, v]) => {
            if (k !== 'show_testimonials') {
              stringified[k] = v == null ? '' : String(v);
            }
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
        .upsert({
          id: 1,
          ...form,
          show_testimonials: showTestimonials,
          updated_at: new Date().toISOString(),
        });

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
                  {field.toggle ? (
                    /* Boolean toggle */
                    <button
                      type="button"
                      onClick={() => setShowTestimonials(v => !v)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        showTestimonials ? 'bg-primary' : 'bg-muted'
                      }`}
                      aria-checked={showTestimonials}
                      role="switch"
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                        showTestimonials ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  ) : field.multiline ? (
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
