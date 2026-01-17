import { HomeHero } from "@/components/home/HomeHero";
import { PromotionBanners } from "@/components/home/PromotionBanners";
import { GuidedTiles } from "@/components/home/GuidedTiles";
import { EditorialBand } from "@/components/home/EditorialBand";
import { ReviewsMarquee } from "@/components/home/ReviewsMarquee";
import { FadeIn } from "@/components/ui/FadeIn";
import { AdPlacements } from "@/components/ads/AdPlacements";

export default function HomePage() {
  return (
    <div className="pb-16">
      <HomeHero />

      <FadeIn>
        <div className="mt-12">
          <PromotionBanners />
        </div>
      </FadeIn>

      <FadeIn>
        <div className="mt-14">
          <GuidedTiles />
        </div>
      </FadeIn>

      <FadeIn>
        <div className="mt-14">
          <AdPlacements title="Publicités" />
        </div>
      </FadeIn>

      <FadeIn>
        <div className="mt-16">
          <EditorialBand />
        </div>
      </FadeIn>

      <FadeIn>
        <div className="mt-20 border-t border-border-soft pt-10">
          <ReviewsMarquee />
        </div>
      </FadeIn>
    </div>
  );
}
