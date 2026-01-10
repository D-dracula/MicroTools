"use client";

import dynamic from "next/dynamic";
import { ToolWrapper } from "@/components/tools";
import { ToolPageAd } from "@/components/ads";

// Loading skeleton component
function ToolLoadingSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="h-48 bg-muted rounded-xl" />
      <div className="h-32 bg-muted rounded-xl" />
    </div>
  );
}

// Dynamic import for lazy loading (Requirement 14.1, 14.2)
const ProfitMarginCalculator = dynamic(
  () => import("@/components/tools/profit-margin-calculator").then(mod => ({ default: mod.ProfitMarginCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const NetProfitCalculator = dynamic(
  () => import("@/components/tools/net-profit-calculator").then(mod => ({ default: mod.NetProfitCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const PaymentGatewayCalculator = dynamic(
  () => import("@/components/tools/payment-gateway-calculator").then(mod => ({ default: mod.PaymentGatewayCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const ImportDutyEstimator = dynamic(
  () => import("@/components/tools/import-duty-estimator").then(mod => ({ default: mod.ImportDutyEstimator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const PayPalFeeCalculator = dynamic(
  () => import("@/components/tools/paypal-fee-calculator").then(mod => ({ default: mod.PayPalFeeCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const AdBreakEvenCalculator = dynamic(
  () => import("@/components/tools/ad-breakeven-calculator").then(mod => ({ default: mod.AdBreakEvenCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const ShippingComparator = dynamic(
  () => import("@/components/tools/shipping-comparator").then(mod => ({ default: mod.ShippingComparator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const SaudiVATCalculator = dynamic(
  () => import("@/components/tools/saudi-vat-calculator").then(mod => ({ default: mod.SaudiVATCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const FBAStorageCalculator = dynamic(
  () => import("@/components/tools/fba-storage-calculator").then(mod => ({ default: mod.FBAStorageCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const FairPricingCalculator = dynamic(
  () => import("@/components/tools/fair-pricing-calculator").then(mod => ({ default: mod.FairPricingCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const ROICalculator = dynamic(
  () => import("@/components/tools/roi-calculator").then(mod => ({ default: mod.ROICalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const RealNetProfitCalculator = dynamic(
  () => import("@/components/tools/real-net-profit-calculator").then(mod => ({ default: mod.RealNetProfitCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const MarketPriceAnalyzer = dynamic(
  () => import("@/components/tools/market-price-analyzer").then(mod => ({ default: mod.MarketPriceAnalyzer })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const SafetyStockCalculator = dynamic(
  () => import("@/components/tools/safety-stock-calculator").then(mod => ({ default: mod.SafetyStockCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const DiscountImpactSimulator = dynamic(
  () => import("@/components/tools/discount-impact-simulator").then(mod => ({ default: mod.DiscountImpactSimulator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

// Logistics Tools
const SizeConverter = dynamic(
  () => import("@/components/tools/size-converter").then(mod => ({ default: mod.SizeConverter })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const VolumetricCalculator = dynamic(
  () => import("@/components/tools/volumetric-calculator").then(mod => ({ default: mod.VolumetricCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const DimensionConverter = dynamic(
  () => import("@/components/tools/dimension-converter").then(mod => ({ default: mod.DimensionConverter })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const LastMileCalculator = dynamic(
  () => import("@/components/tools/last-mile-calculator").then(mod => ({ default: mod.LastMileCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const WeightConverter = dynamic(
  () => import("@/components/tools/weight-converter").then(mod => ({ default: mod.WeightConverter })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const LeadTimeTracker = dynamic(
  () => import("@/components/tools/lead-time-tracker").then(mod => ({ default: mod.LeadTimeTracker })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const CBMCalculator = dynamic(
  () => import("@/components/tools/cbm-calculator").then(mod => ({ default: mod.CBMCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

// Image Tools
const WebPConverter = dynamic(
  () => import("@/components/tools/webp-converter").then(mod => ({ default: mod.WebPConverter })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const ImageCompressor = dynamic(
  () => import("@/components/tools/image-compressor").then(mod => ({ default: mod.ImageCompressor })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const SocialResizer = dynamic(
  () => import("@/components/tools/social-resizer").then(mod => ({ default: mod.SocialResizer })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const ColorExtractor = dynamic(
  () => import("@/components/tools/color-extractor").then(mod => ({ default: mod.ColorExtractor })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const WatermarkCreator = dynamic(
  () => import("@/components/tools/watermark-creator").then(mod => ({ default: mod.WatermarkCreator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const FaviconGenerator = dynamic(
  () => import("@/components/tools/favicon-generator").then(mod => ({ default: mod.FaviconGenerator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const BulkImageTool = dynamic(
  () => import("@/components/tools/bulk-image-tool").then(mod => ({ default: mod.BulkImageTool })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

// Marketing Tools
const WhatsAppLinkGenerator = dynamic(
  () => import("@/components/tools/whatsapp-link-generator").then(mod => ({ default: mod.WhatsAppLinkGenerator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const UTMBuilder = dynamic(
  () => import("@/components/tools/utm-builder").then(mod => ({ default: mod.UTMBuilder })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const QRCodeGenerator = dynamic(
  () => import("@/components/tools/qr-code-generator").then(mod => ({ default: mod.QRCodeGenerator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const LinkShortener = dynamic(
  () => import("@/components/tools/link-shortener").then(mod => ({ default: mod.LinkShortener })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const ContactLinkGenerator = dynamic(
  () => import("@/components/tools/contact-link-generator").then(mod => ({ default: mod.ContactLinkGenerator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const ConversionRateCalculator = dynamic(
  () => import("@/components/tools/conversion-rate-calculator").then(mod => ({ default: mod.ConversionRateCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const LTVCalculator = dynamic(
  () => import("@/components/tools/ltv-calculator").then(mod => ({ default: mod.LTVCalculator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

// Content Tools
const RefundPolicyGenerator = dynamic(
  () => import("@/components/tools/refund-policy-generator").then(mod => ({ default: mod.RefundPolicyGenerator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const TermsGenerator = dynamic(
  () => import("@/components/tools/terms-generator").then(mod => ({ default: mod.TermsGenerator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const DescriptionCleaner = dynamic(
  () => import("@/components/tools/description-cleaner").then(mod => ({ default: mod.DescriptionCleaner })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const SEOTitleValidator = dynamic(
  () => import("@/components/tools/seo-title-validator").then(mod => ({ default: mod.SEOTitleValidator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const FAQGenerator = dynamic(
  () => import("@/components/tools/faq-generator").then(mod => ({ default: mod.FAQGenerator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const WordCounter = dynamic(
  () => import("@/components/tools/word-counter").then(mod => ({ default: mod.WordCounter })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const ContentIdeaGenerator = dynamic(
  () => import("@/components/tools/content-idea-generator").then(mod => ({ default: mod.ContentIdeaGenerator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const CaseConverter = dynamic(
  () => import("@/components/tools/case-converter").then(mod => ({ default: mod.CaseConverter })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const DuplicateRemover = dynamic(
  () => import("@/components/tools/duplicate-remover").then(mod => ({ default: mod.DuplicateRemover })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const BusinessNameGenerator = dynamic(
  () => import("@/components/tools/business-name-generator").then(mod => ({ default: mod.BusinessNameGenerator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const ColorConverter = dynamic(
  () => import("@/components/tools/color-converter").then(mod => ({ default: mod.ColorConverter })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const PasswordGenerator = dynamic(
  () => import("@/components/tools/password-generator").then(mod => ({ default: mod.PasswordGenerator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const HtmlEntityCodec = dynamic(
  () => import("@/components/tools/html-entity-codec").then(mod => ({ default: mod.HtmlEntityCodec })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const RobotsValidator = dynamic(
  () => import("@/components/tools/robots-validator").then(mod => ({ default: mod.RobotsValidator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const SitemapGenerator = dynamic(
  () => import("@/components/tools/sitemap-generator").then(mod => ({ default: mod.SitemapGenerator })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const ResponseChecker = dynamic(
  () => import("@/components/tools/response-checker").then(mod => ({ default: mod.ResponseChecker })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

// AI Tools
const SmartProfitAudit = dynamic(
  () => import("@/components/tools/smart-profit-audit").then(mod => ({ default: mod.SmartProfitAudit })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const ReviewInsight = dynamic(
  () => import("@/components/tools/review-insight").then(mod => ({ default: mod.ReviewInsight })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const CatalogCleaner = dynamic(
  () => import("@/components/tools/catalog-cleaner").then(mod => ({ default: mod.CatalogCleaner })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const InventoryForecaster = dynamic(
  () => import("@/components/tools/inventory-forecaster").then(mod => ({ default: mod.InventoryForecaster })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

const AdSpendAuditor = dynamic(
  () => import("@/components/tools/ad-spend-auditor").then(mod => ({ default: mod.AdSpendAuditor })),
  { 
    loading: () => <ToolLoadingSkeleton />,
    ssr: false 
  }
);

// Tool component mapping
const toolComponents: Record<string, React.ComponentType> = {
  "profit-margin-calculator": ProfitMarginCalculator,
  "net-profit-calculator": NetProfitCalculator,
  "payment-gateway-calculator": PaymentGatewayCalculator,
  "import-duty-estimator": ImportDutyEstimator,
  "paypal-fee-calculator": PayPalFeeCalculator,
  "ad-breakeven-calculator": AdBreakEvenCalculator,
  "shipping-comparator": ShippingComparator,
  "saudi-vat-calculator": SaudiVATCalculator,
  "fba-storage-calculator": FBAStorageCalculator,
  "fair-pricing-calculator": FairPricingCalculator,
  "roi-calculator": ROICalculator,
  "real-net-profit-calculator": RealNetProfitCalculator,
  "market-price-analyzer": MarketPriceAnalyzer,
  "safety-stock-calculator": SafetyStockCalculator,
  "discount-impact-simulator": DiscountImpactSimulator,
  // Logistics Tools
  "size-converter": SizeConverter,
  "volumetric-calculator": VolumetricCalculator,
  "dimension-converter": DimensionConverter,
  "last-mile-calculator": LastMileCalculator,
  "weight-converter": WeightConverter,
  "lead-time-tracker": LeadTimeTracker,
  "cbm-calculator": CBMCalculator,
  // Image Tools
  "webp-converter": WebPConverter,
  "image-compressor": ImageCompressor,
  "social-resizer": SocialResizer,
  "color-extractor": ColorExtractor,
  "watermark-creator": WatermarkCreator,
  "favicon-generator": FaviconGenerator,
  "bulk-image-tool": BulkImageTool,
  // Marketing Tools
  "whatsapp-link-generator": WhatsAppLinkGenerator,
  "utm-builder": UTMBuilder,
  "qr-code-generator": QRCodeGenerator,
  "link-shortener": LinkShortener,
  "contact-link-generator": ContactLinkGenerator,
  "conversion-rate-calculator": ConversionRateCalculator,
  "ltv-calculator": LTVCalculator,
  // Content Tools
  "refund-policy-generator": RefundPolicyGenerator,
  "terms-generator": TermsGenerator,
  "description-cleaner": DescriptionCleaner,
  "seo-title-validator": SEOTitleValidator,
  "faq-generator": FAQGenerator,
  "word-counter": WordCounter,
  "content-idea-generator": ContentIdeaGenerator,
  "case-converter": CaseConverter,
  "duplicate-remover": DuplicateRemover,
  "business-name-generator": BusinessNameGenerator,
  "color-converter": ColorConverter,
  "password-generator": PasswordGenerator,
  "html-entity-codec": HtmlEntityCodec,
  "robots-validator": RobotsValidator,
  "sitemap-generator": SitemapGenerator,
  "response-checker": ResponseChecker,
  // AI Tools
  "smart-profit-audit": SmartProfitAudit,
  "review-insight": ReviewInsight,
  "catalog-cleaner": CatalogCleaner,
  "inventory-forecaster": InventoryForecaster,
  "ad-spend-auditor": AdSpendAuditor,
};

interface ToolPageContentProps {
  slug: string;
  locale: string;
}

/**
 * Tool Page Content Component
 * Client component that handles dynamic tool loading and ads
 * Requirements: 14.1, 14.2, 16.2
 */
export function ToolPageContent({ slug, locale }: ToolPageContentProps) {
  const ToolComponent = toolComponents[slug];

  if (!ToolComponent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Tool not found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
      {/* Tool Component (Requirement 5.4, 5.5 - fully functional without auth) */}
      <div>
        <ToolWrapper slug={slug}>
          <ToolComponent />
        </ToolWrapper>
        
        {/* Ad Slot - Below Tool on Mobile (Requirement 16.2) */}
        <div className="lg:hidden">
          <ToolPageAd locale={locale} position="bottom" />
        </div>
      </div>

      {/* Sidebar Ad - Desktop Only (Requirement 16.2) */}
      <aside className="hidden lg:block">
        <ToolPageAd locale={locale} position="sidebar" />
      </aside>
    </div>
  );
}

export default ToolPageContent;
