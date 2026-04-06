import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteContent } from "@/contexts/SiteContentContext";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import makoArticle from "@/assets/mako-article.png";

const MediaSection = () => {
  const { t } = useLanguage();
  const { get } = useSiteContent();

  return (
    <section className="py-24 px-6 bg-primary/[0.03]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {get("media_badge", t.landing.mediaSection)}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            {get("media_headline", t.landing.mediaHeadline)}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image Column */}
          <div className="order-2 md:order-1">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30">
              <img
                src={makoArticle}
                alt="כתבה על NestAI באתר mako"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>

          {/* Text Column */}
          <div className="order-1 md:order-2 space-y-6">
            <p className="text-lg text-foreground/70 leading-relaxed">
              {get("media_subheadline", t.landing.mediaSubheadline)}
            </p>

            <blockquote className="border-e-4 border-primary pe-6 py-4 bg-card rounded-xl rounded-e-none">
              <p className="text-foreground/80 leading-relaxed italic">
                "{get("media_quote", t.landing.mediaQuote)}"
              </p>
            </blockquote>

            <a
              href="https://www.mako.co.il/nexter-news/Article-a19b0da777b6c91027.htm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="rounded-full gap-2 mt-4">
                {get("media_button", t.landing.mediaButton)}
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MediaSection;
