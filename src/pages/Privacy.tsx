import { ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const Privacy = () => {
  const navigate = useNavigate();
  const { t, dir, isRTL } = useLanguage();

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-muted-foreground"
          >
            <ArrowIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.common.back}
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
          {t.privacy.title}
        </h1>

        <div className="space-y-6 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {t.privacy.whatDataSaved}
            </h2>
            <p className="text-sm">
              {t.privacy.whatDataSavedAnswer}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {t.privacy.whoHasAccess}
            </h2>
            <p className="text-sm">
              {t.privacy.whoHasAccessAnswer}
            </p>
          </section>


          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {t.privacy.howDataUsed}
            </h2>
            <p className="text-sm">
              {t.privacy.howDataUsedAnswer}
            </p>
          </section>

          {/* New sections */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {t.privacy.dataUsageAndThirdParties}
            </h2>
            <p className="text-sm">
              {t.privacy.dataUsageAndThirdPartiesAnswer}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {t.privacy.dataLocationAndStorage}
            </h2>
            <p className="text-sm">
              {t.privacy.dataLocationAndStorageAnswer}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {t.privacy.securityAndLiability}
            </h2>
            <p className="text-sm">
              {t.privacy.securityAndLiabilityAnswer}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {t.privacy.manageYourData}
            </h2>
            <p className="text-sm">
              {t.privacy.manageYourDataAnswer}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {t.privacy.aboutAI}
            </h2>
            <p className="text-sm">
              {t.privacy.aboutAIAnswer}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {t.privacy.analytics}
            </h2>
            <p className="text-sm">
              {t.privacy.analyticsAnswer}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {t.privacy.security}
            </h2>
            <p className="text-sm">
              {t.privacy.securityAnswer}
            </p>
          </section>

          <section className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              {t.privacy.questions}
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-4 border-t border-border text-center text-xs text-muted-foreground">
          {t.footer.copyright}
        </footer>
      </div>
    </div>
  );
};

export default Privacy;