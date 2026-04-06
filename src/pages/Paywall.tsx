import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Check, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/dashboard/BottomTabBar';

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function Paywall() {
  const navigate = useNavigate();
  const [paypalLoading, setPaypalLoading] = useState(true);
  const [paypalConfig, setPaypalConfig] = useState<{ client_id: string } | null>(null);
  const donationBtnRef = useRef<HTMLDivElement>(null);
  const buttonRendered = useRef(false);

  // Fetch PayPal config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('paypal-get-client-id');
        if (error) throw error;
        setPaypalConfig({ client_id: data.client_id });
      } catch (err) {
        console.error('Failed to get PayPal config:', err);
        toast.error('שגיאה בטעינת מערכת התשלום');
        setPaypalLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Load PayPal SDK (donation mode - no vault, no subscription intent)
  useEffect(() => {
    if (!paypalConfig?.client_id) return;
    const existingScript = document.querySelector('script[data-paypal-sdk]');
    if (existingScript) existingScript.remove();

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalConfig.client_id}&currency=ILS`;
    script.setAttribute('data-paypal-sdk', 'true');
    script.async = true;
    script.onload = () => setPaypalLoading(false);
    script.onerror = () => {
      toast.error('שגיאה בטעינת PayPal');
      setPaypalLoading(false);
    };
    document.head.appendChild(script);
    return () => {
      const s = document.querySelector('script[data-paypal-sdk]');
      if (s) s.remove();
    };
  }, [paypalConfig]);

  // Render PayPal donation button
  const renderPaypalButton = useCallback(() => {
    if (buttonRendered.current || paypalLoading || !window.paypal || !donationBtnRef.current) return;
    buttonRendered.current = true;

    window.paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'donate', height: 50 },
      createOrder: (_data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: { value: '20.00', currency_code: 'ILS' },
            description: 'תמיכה ב-NestAI',
          }],
        });
      },
      onApprove: async (_data: any, actions: any) => {
        try {
          await actions.order.capture();
          toast.success('🙏 תודה רבה על התמיכה!', {
            duration: 5000,
            style: { fontSize: '16px', padding: '16px' },
          });
        } catch (err) {
          console.error('Payment capture error:', err);
          toast.error('שגיאה בעיבוד התשלום. נסה שוב.');
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err);
        toast.error('שגיאה בתשלום. נסה שוב.');
      },
      onCancel: () => toast.info('התשלום בוטל'),
    }).render(donationBtnRef.current);
  }, [paypalLoading]);

  useEffect(() => {
    renderPaypalButton();
  }, [renderPaypalButton]);

  const benefits = [
    'עזרה בתחזוקה ופיתוח האפליקציה',
    'שמירה על שרתים ואבטחת מידע',
    'פיתוח פיצ\'רים חדשים',
    'תמיכה בקהילה',
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" dir="rtl">
      <AppHeader />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-20 pb-24">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 gap-2">
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Button>
        </motion.div>

        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Heart className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">תמיכה במוצר</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            NestAI נבנה מתוך אהבה ורצון לעזור. אם המוצר עוזר לך, תוכל/י לתמוך בנו ולעזור לנו להמשיך לפתח.
          </p>
        </motion.div>

        <motion.ul
          className="space-y-3 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {benefits.map((b, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Check className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm text-foreground">{b}</span>
            </li>
          ))}
        </motion.ul>

        {/* Donation amount & PayPal button */}
        <motion.div
          className="rounded-2xl border border-border p-6 bg-card space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="text-center">
            <span className="text-3xl font-bold text-foreground">₪20</span>
            <p className="text-sm text-muted-foreground mt-1">תרומה חד-פעמית</p>
          </div>

          <div className="min-h-[55px]">
            {paypalLoading ? (
              <div className="flex items-center justify-center py-3 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">טוען מערכת תשלום...</span>
              </div>
            ) : (
              <div ref={donationBtnRef} />
            )}
          </div>
        </motion.div>

        <motion.div
          className="text-center mt-8 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>תשלום מאובטח דרך PayPal</span>
          </div>
        </motion.div>
      </div>
      <BottomTabBar />
    </div>
  );
}
