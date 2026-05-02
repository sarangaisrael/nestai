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
  // Group: Navbar
  { key: 'nav_logo',      label: 'לוגו (טקסט)',                      group: '🗂️ כותרות ניווט' },
  { key: 'nav_cta1_text', label: 'כפתור 1 (קישור למטפלים)',           group: '🗂️ כותרות ניווט' },
  { key: 'nav_cta2_text', label: 'כפתור 2 (התחל בחינם)',              group: '🗂️ כותרות ניווט' },

  // Group: Hero
  { key: 'hero_line1',    label: 'שורה ראשית 1 (שחור)',               group: '🦸 Hero' },
  { key: 'hero_line2',    label: 'שורה ראשית 2 (ירוק)',               group: '🦸 Hero' },
  { key: 'hero_subtitle', label: 'טקסט משנה',                         group: '🦸 Hero', multiline: true },
  { key: 'hero_cta1',     label: 'כפתור ראשי',                        group: '🦸 Hero' },
  { key: 'hero_cta2',     label: 'כפתור משני',                        group: '🦸 Hero' },
  { key: 'hero_badge1',   label: 'תג 1',                              group: '🦸 Hero' },
  { key: 'hero_badge2',   label: 'תג 2',                              group: '🦸 Hero' },
  { key: 'hero_badge3',   label: 'תג 3',                              group: '🦸 Hero' },

  // Group: Slide 1
  { key: 'slide1_title',    label: 'כותרת',                           group: '🎞️ שקופית 1 — מטופלים' },
  { key: 'slide1_subtitle', label: 'תת-כותרת',                        group: '🎞️ שקופית 1 — מטופלים', multiline: true },
  { key: 'slide1_bullet1',  label: 'נקודה 1',                         group: '🎞️ שקופית 1 — מטופלים' },
  { key: 'slide1_bullet2',  label: 'נקודה 2',                         group: '🎞️ שקופית 1 — מטופלים' },
  { key: 'slide1_bullet3',  label: 'נקודה 3',                         group: '🎞️ שקופית 1 — מטופלים' },

  // Group: Slide 2
  { key: 'slide2_title',    label: 'כותרת',                           group: '🎞️ שקופית 2 — מטפלים' },
  { key: 'slide2_subtitle', label: 'תת-כותרת',                        group: '🎞️ שקופית 2 — מטפלים', multiline: true },
  { key: 'slide2_bullet1',  label: 'נקודה 1',                         group: '🎞️ שקופית 2 — מטפלים' },
  { key: 'slide2_bullet2',  label: 'נקודה 2',                         group: '🎞️ שקופית 2 — מטפלים' },
  { key: 'slide2_bullet3',  label: 'נקודה 3',                         group: '🎞️ שקופית 2 — מטפלים' },

  // Group: Slide 3
  { key: 'slide3_title',    label: 'כותרת',                           group: '🎞️ שקופית 3 — רציפות' },
  { key: 'slide3_subtitle', label: 'תת-כותרת',                        group: '🎞️ שקופית 3 — רציפות', multiline: true },
  { key: 'slide3_bullet1',  label: 'נקודה 1',                         group: '🎞️ שקופית 3 — רציפות' },
  { key: 'slide3_bullet2',  label: 'נקודה 2',                         group: '🎞️ שקופית 3 — רציפות' },
  { key: 'slide3_bullet3',  label: 'נקודה 3',                         group: '🎞️ שקופית 3 — רציפות' },

  // Group: Tools
  { key: 'tools_title',    label: 'כותרת הסקשן',                      group: '🛠️ כלים' },
  { key: 'tools_subtitle', label: 'תת-כותרת הסקשן',                   group: '🛠️ כלים', multiline: true },
  { key: 'tool1_icon',  label: 'כלי 1 — אמוג׳י',                      group: '🛠️ כלים' },
  { key: 'tool1_title', label: 'כלי 1 — כותרת',                       group: '🛠️ כלים' },
  { key: 'tool1_text',  label: 'כלי 1 — טקסט',                        group: '🛠️ כלים', multiline: true },
  { key: 'tool2_icon',  label: 'כלי 2 — אמוג׳י',                      group: '🛠️ כלים' },
  { key: 'tool2_title', label: 'כלי 2 — כותרת',                       group: '🛠️ כלים' },
  { key: 'tool2_text',  label: 'כלי 2 — טקסט',                        group: '🛠️ כלים', multiline: true },
  { key: 'tool3_icon',  label: 'כלי 3 — אמוג׳י',                      group: '🛠️ כלים' },
  { key: 'tool3_title', label: 'כלי 3 — כותרת',                       group: '🛠️ כלים' },
  { key: 'tool3_text',  label: 'כלי 3 — טקסט',                        group: '🛠️ כלים', multiline: true },

  // Group: Audience Cards
  { key: 'card1_title', label: 'כרטיס מטפל — כותרת',                 group: '🃏 כרטיסי קהל' },
  { key: 'card1_body',  label: 'כרטיס מטפל — גוף',                   group: '🃏 כרטיסי קהל', multiline: true },
  { key: 'card1_cta',   label: 'כרטיס מטפל — כפתור',                 group: '🃏 כרטיסי קהל' },
  { key: 'card2_title', label: 'כרטיס מטופל — כותרת',                group: '🃏 כרטיסי קהל' },
  { key: 'card2_body',  label: 'כרטיס מטופל — גוף',                  group: '🃏 כרטיסי קהל', multiline: true },
  { key: 'card2_cta',   label: 'כרטיס מטופל — כפתור',                group: '🃏 כרטיסי קהל' },

  // Group: Footer
  { key: 'footer_text', label: 'טקסט פוטר',                          group: '🦶 פוטר', multiline: true },
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
