import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface PremiumPaywallProps {
  featureType?: 'weekly' | 'monthly';
}

export function PremiumPaywall({ featureType }: PremiumPaywallProps) {
  const { language } = useLanguage();
  const isRTL = language === 'he';
  const navigate = useNavigate();

  const t = isRTL ? {
    title: 'תמיכה במוצר',
    desc: 'אם NestAI עוזר לך, תוכל/י לתמוך בפיתוח המוצר',
    cta: 'תמיכה במוצר',
  } : {
    title: 'Support the Product',
    desc: 'If NestAI helps you, you can support its development',
    cta: 'Support the Product',
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-2 border-primary/20 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center shadow-md">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t.title}</CardTitle>
          <p className="text-base text-muted-foreground">{t.desc}</p>
        </CardHeader>

        <CardFooter>
          <Button
            className="w-full h-12 text-lg font-semibold gap-2"
            onClick={() => navigate('/app/paywall')}
          >
            <Heart className="h-5 w-5" />
            {t.cta}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
