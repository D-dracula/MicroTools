import {
  Calculator,
  Image,
  Type,
  ArrowLeftRight,
  TrendingDown,
  CreditCard,
  Globe,
  DollarSign,
  Target,
  Truck,
  Percent,
  Package,
  Tag,
  TrendingUp,
  Ruler,
  Scale,
  Box,
  MapPin,
  Weight,
  Clock,
  Container,
  FileImage,
  Minimize2,
  Share2,
  Palette,
  Stamp,
  AppWindow,
  RotateCw,
  LucideIcon,
  // Marketing Tools Icons
  MessageCircle,
  Link2,
  QrCode,
  Scissors,
  Phone,
  Users,
  // Content Tools Icons
  FileText,
  ScrollText,
  Eraser,
  Search,
  HelpCircle,
  Lightbulb,
  CaseSensitive,
  ListX,
  Sparkles,
  KeyRound,
  Code,
  Bot,
  FileCode,
  Activity,
} from "lucide-react";

export type ToolCategory = "financial" | "logistics" | "images" | "text" | "conversion" | "marketing" | "content" | "ai";

export interface Tool {
  slug: string;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  category: ToolCategory;
  categoryKey: string;
}

export const categories: { key: ToolCategory; labelKey: string }[] = [
  { key: "financial", labelKey: "categories.financial" },
  { key: "logistics", labelKey: "categories.logistics" },
  { key: "images", labelKey: "categories.images" },
  { key: "text", labelKey: "categories.text" },
  { key: "conversion", labelKey: "categories.conversion" },
  { key: "marketing", labelKey: "categories.marketing" },
  { key: "content", labelKey: "categories.content" },
  { key: "ai", labelKey: "categories.ai" },
];

export const tools: Tool[] = [
  // Financial Tools
  {
    slug: "profit-margin-calculator",
    icon: Calculator,
    titleKey: "tools.profitMarginCalculator.title",
    descriptionKey: "tools.profitMarginCalculator.description",
    category: "financial",
    categoryKey: "categories.financial",
  },
  {
    slug: "net-profit-calculator",
    icon: TrendingDown,
    titleKey: "tools.netProfitCalculator.title",
    descriptionKey: "tools.netProfitCalculator.description",
    category: "financial",
    categoryKey: "categories.financial",
  },
  {
    slug: "payment-gateway-calculator",
    icon: CreditCard,
    titleKey: "tools.paymentGatewayCalculator.title",
    descriptionKey: "tools.paymentGatewayCalculator.description",
    category: "financial",
    categoryKey: "categories.financial",
  },
  {
    slug: "import-duty-estimator",
    icon: Globe,
    titleKey: "tools.importDutyEstimator.title",
    descriptionKey: "tools.importDutyEstimator.description",
    category: "financial",
    categoryKey: "categories.financial",
  },
  {
    slug: "paypal-fee-calculator",
    icon: DollarSign,
    titleKey: "tools.paypalFeeCalculator.title",
    descriptionKey: "tools.paypalFeeCalculator.description",
    category: "financial",
    categoryKey: "categories.financial",
  },
  {
    slug: "ad-breakeven-calculator",
    icon: Target,
    titleKey: "tools.adBreakEvenCalculator.title",
    descriptionKey: "tools.adBreakEvenCalculator.description",
    category: "financial",
    categoryKey: "categories.financial",
  },
  {
    slug: "shipping-comparator",
    icon: Truck,
    titleKey: "tools.shippingComparator.title",
    descriptionKey: "tools.shippingComparator.description",
    category: "financial",
    categoryKey: "categories.financial",
  },
  {
    slug: "saudi-vat-calculator",
    icon: Percent,
    titleKey: "tools.saudiVATCalculator.title",
    descriptionKey: "tools.saudiVATCalculator.description",
    category: "financial",
    categoryKey: "categories.financial",
  },
  {
    slug: "fba-storage-calculator",
    icon: Package,
    titleKey: "tools.fbaStorageCalculator.title",
    descriptionKey: "tools.fbaStorageCalculator.description",
    category: "financial",
    categoryKey: "categories.financial",
  },
  {
    slug: "fair-pricing-calculator",
    icon: Tag,
    titleKey: "tools.fairPricingCalculator.title",
    descriptionKey: "tools.fairPricingCalculator.description",
    category: "financial",
    categoryKey: "categories.financial",
  },
  {
    slug: "roi-calculator",
    icon: TrendingUp,
    titleKey: "tools.roiCalculator.title",
    descriptionKey: "tools.roiCalculator.description",
    category: "financial",
    categoryKey: "categories.financial",
  },
  {
    slug: "real-net-profit-calculator",
    icon: Calculator,
    titleKey: "tools.realNetProfitCalculator.title",
    descriptionKey: "tools.realNetProfitCalculator.description",
    category: "financial",
    categoryKey: "categories.financial",
  },
  {
    slug: "market-price-analyzer",
    icon: Target,
    titleKey: "tools.marketPriceAnalyzer.title",
    descriptionKey: "tools.marketPriceAnalyzer.description",
    category: "financial",
    categoryKey: "categories.financial",
  },
  {
    slug: "safety-stock-calculator",
    icon: Package,
    titleKey: "tools.safetyStockCalculator.title",
    descriptionKey: "tools.safetyStockCalculator.description",
    category: "financial",
    categoryKey: "categories.financial",
  },
  {
    slug: "discount-impact-simulator",
    icon: Percent,
    titleKey: "tools.discountImpactSimulator.title",
    descriptionKey: "tools.discountImpactSimulator.description",
    category: "financial",
    categoryKey: "categories.financial",
  },

  // Logistics Tools - Requirement 1-7
  {
    slug: "size-converter",
    icon: Ruler,
    titleKey: "tools.sizeConverter.title",
    descriptionKey: "tools.sizeConverter.description",
    category: "logistics",
    categoryKey: "categories.logistics",
  },
  {
    slug: "volumetric-calculator",
    icon: Scale,
    titleKey: "tools.volumetricCalculator.title",
    descriptionKey: "tools.volumetricCalculator.description",
    category: "logistics",
    categoryKey: "categories.logistics",
  },
  {
    slug: "dimension-converter",
    icon: Box,
    titleKey: "tools.dimensionConverter.title",
    descriptionKey: "tools.dimensionConverter.description",
    category: "logistics",
    categoryKey: "categories.logistics",
  },
  {
    slug: "last-mile-calculator",
    icon: MapPin,
    titleKey: "tools.lastMileCalculator.title",
    descriptionKey: "tools.lastMileCalculator.description",
    category: "logistics",
    categoryKey: "categories.logistics",
  },
  {
    slug: "weight-converter",
    icon: Weight,
    titleKey: "tools.weightConverter.title",
    descriptionKey: "tools.weightConverter.description",
    category: "logistics",
    categoryKey: "categories.logistics",
  },
  {
    slug: "lead-time-tracker",
    icon: Clock,
    titleKey: "tools.leadTimeTracker.title",
    descriptionKey: "tools.leadTimeTracker.description",
    category: "logistics",
    categoryKey: "categories.logistics",
  },
  {
    slug: "cbm-calculator",
    icon: Container,
    titleKey: "tools.cbmCalculator.title",
    descriptionKey: "tools.cbmCalculator.description",
    category: "logistics",
    categoryKey: "categories.logistics",
  },

  // Image Tools - Requirement 8-14
  {
    slug: "webp-converter",
    icon: FileImage,
    titleKey: "tools.webpConverter.title",
    descriptionKey: "tools.webpConverter.description",
    category: "images",
    categoryKey: "categories.images",
  },
  {
    slug: "image-compressor",
    icon: Minimize2,
    titleKey: "tools.imageCompressor.title",
    descriptionKey: "tools.imageCompressor.description",
    category: "images",
    categoryKey: "categories.images",
  },
  {
    slug: "social-resizer",
    icon: Share2,
    titleKey: "tools.socialResizer.title",
    descriptionKey: "tools.socialResizer.description",
    category: "images",
    categoryKey: "categories.images",
  },
  {
    slug: "color-extractor",
    icon: Palette,
    titleKey: "tools.colorExtractor.title",
    descriptionKey: "tools.colorExtractor.description",
    category: "images",
    categoryKey: "categories.images",
  },
  {
    slug: "watermark-creator",
    icon: Stamp,
    titleKey: "tools.watermarkCreator.title",
    descriptionKey: "tools.watermarkCreator.description",
    category: "images",
    categoryKey: "categories.images",
  },
  {
    slug: "favicon-generator",
    icon: AppWindow,
    titleKey: "tools.faviconGenerator.title",
    descriptionKey: "tools.faviconGenerator.description",
    category: "images",
    categoryKey: "categories.images",
  },
  {
    slug: "bulk-image-tool",
    icon: RotateCw,
    titleKey: "tools.bulkImageTool.title",
    descriptionKey: "tools.bulkImageTool.description",
    category: "images",
    categoryKey: "categories.images",
  },

  // Marketing Tools
  {
    slug: "whatsapp-link-generator",
    icon: MessageCircle,
    titleKey: "tools.whatsappLinkGenerator.title",
    descriptionKey: "tools.whatsappLinkGenerator.description",
    category: "marketing",
    categoryKey: "categories.marketing",
  },
  {
    slug: "utm-builder",
    icon: Link2,
    titleKey: "tools.utmBuilder.title",
    descriptionKey: "tools.utmBuilder.description",
    category: "marketing",
    categoryKey: "categories.marketing",
  },
  {
    slug: "qr-code-generator",
    icon: QrCode,
    titleKey: "tools.qrCodeGenerator.title",
    descriptionKey: "tools.qrCodeGenerator.description",
    category: "marketing",
    categoryKey: "categories.marketing",
  },
  {
    slug: "link-shortener",
    icon: Scissors,
    titleKey: "tools.linkShortener.title",
    descriptionKey: "tools.linkShortener.description",
    category: "marketing",
    categoryKey: "categories.marketing",
  },
  {
    slug: "contact-link-generator",
    icon: Phone,
    titleKey: "tools.contactLinkGenerator.title",
    descriptionKey: "tools.contactLinkGenerator.description",
    category: "marketing",
    categoryKey: "categories.marketing",
  },
  {
    slug: "conversion-rate-calculator",
    icon: TrendingUp,
    titleKey: "tools.conversionRateCalculator.title",
    descriptionKey: "tools.conversionRateCalculator.description",
    category: "marketing",
    categoryKey: "categories.marketing",
  },
  {
    slug: "ltv-calculator",
    icon: Users,
    titleKey: "tools.ltvCalculator.title",
    descriptionKey: "tools.ltvCalculator.description",
    category: "marketing",
    categoryKey: "categories.marketing",
  },

  // Content Tools
  {
    slug: "refund-policy-generator",
    icon: FileText,
    titleKey: "tools.refundPolicyGenerator.title",
    descriptionKey: "tools.refundPolicyGenerator.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "terms-generator",
    icon: ScrollText,
    titleKey: "tools.termsGenerator.title",
    descriptionKey: "tools.termsGenerator.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "description-cleaner",
    icon: Eraser,
    titleKey: "tools.descriptionCleaner.title",
    descriptionKey: "tools.descriptionCleaner.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "seo-title-validator",
    icon: Search,
    titleKey: "tools.seoTitleValidator.title",
    descriptionKey: "tools.seoTitleValidator.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "faq-generator",
    icon: HelpCircle,
    titleKey: "tools.faqGenerator.title",
    descriptionKey: "tools.faqGenerator.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "word-counter",
    icon: Type,
    titleKey: "tools.wordCounter.title",
    descriptionKey: "tools.wordCounter.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "content-idea-generator",
    icon: Lightbulb,
    titleKey: "tools.contentIdeaGenerator.title",
    descriptionKey: "tools.contentIdeaGenerator.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "case-converter",
    icon: CaseSensitive,
    titleKey: "tools.caseConverter.title",
    descriptionKey: "tools.caseConverter.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "duplicate-remover",
    icon: ListX,
    titleKey: "tools.duplicateRemover.title",
    descriptionKey: "tools.duplicateRemover.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "business-name-generator",
    icon: Sparkles,
    titleKey: "tools.businessNameGenerator.title",
    descriptionKey: "tools.businessNameGenerator.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "color-converter",
    icon: Palette,
    titleKey: "tools.colorConverter.title",
    descriptionKey: "tools.colorConverter.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "password-generator",
    icon: KeyRound,
    titleKey: "tools.passwordGenerator.title",
    descriptionKey: "tools.passwordGenerator.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "html-entity-codec",
    icon: Code,
    titleKey: "tools.htmlEntityCodec.title",
    descriptionKey: "tools.htmlEntityCodec.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "robots-validator",
    icon: Bot,
    titleKey: "tools.robotsValidator.title",
    descriptionKey: "tools.robotsValidator.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "sitemap-generator",
    icon: FileCode,
    titleKey: "tools.sitemapGenerator.title",
    descriptionKey: "tools.sitemapGenerator.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "response-checker",
    icon: Activity,
    titleKey: "tools.responseChecker.title",
    descriptionKey: "tools.responseChecker.description",
    category: "content",
    categoryKey: "categories.content",
  },

  // AI Tools
  {
    slug: "smart-profit-audit",
    icon: Calculator,
    titleKey: "tools.smartProfitAudit.title",
    descriptionKey: "tools.smartProfitAudit.description",
    category: "ai",
    categoryKey: "categories.ai",
  },
  {
    slug: "review-insight",
    icon: MessageCircle,
    titleKey: "tools.reviewInsight.title",
    descriptionKey: "tools.reviewInsight.description",
    category: "ai",
    categoryKey: "categories.ai",
  },
  {
    slug: "inventory-forecaster",
    icon: Package,
    titleKey: "tools.inventoryForecaster.title",
    descriptionKey: "tools.inventoryForecaster.description",
    category: "ai",
    categoryKey: "categories.ai",
  },
  {
    slug: "catalog-cleaner",
    icon: Eraser,
    titleKey: "tools.catalogCleaner.title",
    descriptionKey: "tools.catalogCleaner.description",
    category: "ai",
    categoryKey: "categories.ai",
  },
  {
    slug: "ad-spend-auditor",
    icon: Target,
    titleKey: "tools.adSpendAuditor.title",
    descriptionKey: "tools.adSpendAuditor.description",
    category: "ai",
    categoryKey: "categories.ai",
  },
];

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return tools.filter((tool) => tool.category === category);
}

export function searchTools(query: string, locale: string = "en"): Tool[] {
  if (!query.trim()) return tools;

  const normalizedQuery = query.toLowerCase().trim();

  return tools.filter((tool) => {
    // Search by slug
    if (tool.slug.toLowerCase().includes(normalizedQuery)) return true;

    // Search by category
    if (tool.category.toLowerCase().includes(normalizedQuery)) return true;

    return false;
  });
}
