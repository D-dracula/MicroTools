/**
 * Terms of Service Generator Logic
 * 
 * Generates terms of service documents for e-commerce stores.
 * Includes standard e-commerce clauses with Arabic support.
 * Requirements: 9.1, 9.2, 9.3, 9.5
 */

export type TermsClause = 
  | 'payment'
  | 'delivery'
  | 'liability'
  | 'intellectual_property'
  | 'privacy'
  | 'disputes'
  | 'modifications';

export interface TermsInput {
  storeName: string;
  storeUrl: string;
  contactEmail: string;
  clauses: TermsClause[];
  customTerms?: string;
  language: 'ar' | 'en';
}

export interface TermsSection {
  title: string;
  content: string;
}

export interface TermsResult {
  document: string;
  sections: TermsSection[];
  isComplete: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates terms input.
 */
export function validateTermsInputs(input: Partial<TermsInput>): ValidationResult {
  if (!input.storeName || input.storeName.trim() === '') {
    return { isValid: false, error: 'Store name is required' };
  }

  if (!input.storeUrl || input.storeUrl.trim() === '') {
    return { isValid: false, error: 'Store URL is required' };
  }

  if (!input.contactEmail || input.contactEmail.trim() === '') {
    return { isValid: false, error: 'Contact email is required' };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.contactEmail)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (!input.clauses || input.clauses.length === 0) {
    return { isValid: false, error: 'At least one clause must be selected' };
  }

  return { isValid: true };
}

/**
 * Gets clause content in the specified language.
 */
function getClauseContent(clause: TermsClause, storeName: string, storeUrl: string, contactEmail: string, language: 'ar' | 'en'): TermsSection {
  const clauses: Record<TermsClause, { ar: TermsSection; en: TermsSection }> = {
    payment: {
      ar: {
        title: 'الدفع والأسعار',
        content: `جميع الأسعار المعروضة على ${storeName} (${storeUrl}) بالريال السعودي وتشمل ضريبة القيمة المضافة ما لم يُذكر خلاف ذلك.

نقبل طرق الدفع التالية:
• البطاقات الائتمانية (فيزا، ماستركارد، مدى)
• Apple Pay و Google Pay
• الدفع عند الاستلام (في مناطق محددة)

يتم تأكيد الطلب فقط بعد إتمام عملية الدفع بنجاح. نحتفظ بالحق في إلغاء أي طلب في حالة فشل التحقق من الدفع.`,
      },
      en: {
        title: 'Payment and Pricing',
        content: `All prices displayed on ${storeName} (${storeUrl}) are in Saudi Riyals and include VAT unless otherwise stated.

We accept the following payment methods:
• Credit cards (Visa, Mastercard, Mada)
• Apple Pay and Google Pay
• Cash on Delivery (in selected areas)

Orders are confirmed only after successful payment completion. We reserve the right to cancel any order if payment verification fails.`,
      },
    },
    delivery: {
      ar: {
        title: 'التوصيل والشحن',
        content: `نوفر خدمة التوصيل إلى جميع مناطق المملكة العربية السعودية.

• مدة التوصيل: 2-5 أيام عمل للمدن الرئيسية، 5-10 أيام عمل للمناطق النائية
• رسوم الشحن: تُحسب عند إتمام الطلب بناءً على الموقع ووزن الشحنة
• التوصيل المجاني: متاح للطلبات التي تتجاوز قيمة معينة (راجع صفحة الشحن)

سيتم إرسال رقم تتبع الشحنة عبر البريد الإلكتروني والرسائل النصية فور شحن الطلب.`,
      },
      en: {
        title: 'Delivery and Shipping',
        content: `We provide delivery services to all regions of Saudi Arabia.

• Delivery time: 2-5 business days for major cities, 5-10 business days for remote areas
• Shipping fees: Calculated at checkout based on location and shipment weight
• Free shipping: Available for orders exceeding a certain value (see shipping page)

A tracking number will be sent via email and SMS once the order is shipped.`,
      },
    },
    liability: {
      ar: {
        title: 'حدود المسؤولية',
        content: `${storeName} غير مسؤول عن:
• أي أضرار غير مباشرة أو عرضية أو تبعية ناتجة عن استخدام منتجاتنا
• التأخير في التوصيل بسبب ظروف خارجة عن إرادتنا (الكوارث الطبيعية، الإضرابات، إلخ)
• الاستخدام غير الصحيح للمنتجات خلافاً للتعليمات المرفقة

مسؤوليتنا القصوى في جميع الحالات لا تتجاوز قيمة المنتج المشترى.`,
      },
      en: {
        title: 'Limitation of Liability',
        content: `${storeName} is not responsible for:
• Any indirect, incidental, or consequential damages resulting from the use of our products
• Delivery delays due to circumstances beyond our control (natural disasters, strikes, etc.)
• Improper use of products contrary to the accompanying instructions

Our maximum liability in all cases does not exceed the value of the purchased product.`,
      },
    },
    intellectual_property: {
      ar: {
        title: 'الملكية الفكرية',
        content: `جميع المحتويات المعروضة على ${storeUrl} بما في ذلك على سبيل المثال لا الحصر:
• الشعارات والعلامات التجارية
• الصور والرسومات
• النصوص والأوصاف
• تصميم الموقع

هي ملكية حصرية لـ ${storeName} ومحمية بموجب قوانين الملكية الفكرية في المملكة العربية السعودية والاتفاقيات الدولية.

يُحظر نسخ أو إعادة إنتاج أو توزيع أي محتوى دون إذن كتابي مسبق.`,
      },
      en: {
        title: 'Intellectual Property',
        content: `All content displayed on ${storeUrl} including but not limited to:
• Logos and trademarks
• Images and graphics
• Text and descriptions
• Website design

Are the exclusive property of ${storeName} and are protected under intellectual property laws in Saudi Arabia and international agreements.

Copying, reproducing, or distributing any content without prior written permission is prohibited.`,
      },
    },
    privacy: {
      ar: {
        title: 'الخصوصية وحماية البيانات',
        content: `نلتزم بحماية خصوصية عملائنا وفقاً لنظام حماية البيانات الشخصية في المملكة العربية السعودية.

البيانات التي نجمعها:
• معلومات الاتصال (الاسم، البريد الإلكتروني، رقم الهاتف)
• عنوان التوصيل
• معلومات الدفع (مشفرة ومحمية)
• سجل الطلبات

استخدام البيانات:
• معالجة الطلبات والتوصيل
• التواصل بخصوص الطلبات
• تحسين خدماتنا
• إرسال العروض الترويجية (بموافقتك)

للاستفسار عن بياناتك أو طلب حذفها، تواصل معنا على: ${contactEmail}`,
      },
      en: {
        title: 'Privacy and Data Protection',
        content: `We are committed to protecting our customers' privacy in accordance with the Personal Data Protection Law in Saudi Arabia.

Data we collect:
• Contact information (name, email, phone number)
• Delivery address
• Payment information (encrypted and protected)
• Order history

Data usage:
• Processing orders and delivery
• Communication regarding orders
• Improving our services
• Sending promotional offers (with your consent)

To inquire about your data or request deletion, contact us at: ${contactEmail}`,
      },
    },
    disputes: {
      ar: {
        title: 'حل النزاعات',
        content: `في حالة وجود أي نزاع أو خلاف:

1. التواصل المباشر: نشجعك على التواصل معنا أولاً عبر ${contactEmail} لحل أي مشكلة ودياً
2. الوساطة: في حالة عدم التوصل لحل، يمكن اللجوء إلى وساطة طرف ثالث محايد
3. التحكيم: يخضع أي نزاع لا يمكن حله ودياً للتحكيم وفقاً لأنظمة المملكة العربية السعودية

القانون الواجب التطبيق:
تخضع هذه الاتفاقية لأنظمة المملكة العربية السعودية، وتختص المحاكم السعودية بالنظر في أي نزاع ينشأ عنها.`,
      },
      en: {
        title: 'Dispute Resolution',
        content: `In case of any dispute or disagreement:

1. Direct communication: We encourage you to contact us first at ${contactEmail} to resolve any issue amicably
2. Mediation: If no resolution is reached, a neutral third-party mediation may be sought
3. Arbitration: Any dispute that cannot be resolved amicably shall be subject to arbitration under Saudi Arabian regulations

Governing Law:
This agreement is governed by the laws of the Kingdom of Saudi Arabia, and Saudi courts have jurisdiction over any disputes arising from it.`,
      },
    },
    modifications: {
      ar: {
        title: 'تعديل الشروط والأحكام',
        content: `نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت.

• سيتم نشر أي تعديلات على هذه الصفحة
• التعديلات الجوهرية سيتم إخطارك بها عبر البريد الإلكتروني
• استمرارك في استخدام الموقع بعد التعديل يعني موافقتك على الشروط الجديدة

تاريخ آخر تحديث: ${new Date().toLocaleDateString('ar-SA')}

للاستفسارات حول هذه الشروط، تواصل معنا على: ${contactEmail}`,
      },
      en: {
        title: 'Modifications to Terms',
        content: `We reserve the right to modify these terms and conditions at any time.

• Any modifications will be posted on this page
• Material changes will be notified to you via email
• Your continued use of the website after modification constitutes acceptance of the new terms

Last updated: ${new Date().toLocaleDateString('en-US')}

For inquiries about these terms, contact us at: ${contactEmail}`,
      },
    },
  };

  return clauses[clause][language];
}

/**
 * Generates the introduction section.
 */
function generateTermsIntro(storeName: string, storeUrl: string, language: 'ar' | 'en'): TermsSection {
  if (language === 'ar') {
    return {
      title: 'مقدمة',
      content: `مرحباً بك في ${storeName} (${storeUrl}).

باستخدامك لموقعنا أو إجراء عملية شراء، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام خدماتنا.

إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام الموقع أو خدماتنا.`,
    };
  }
  return {
    title: 'Introduction',
    content: `Welcome to ${storeName} (${storeUrl}).

By using our website or making a purchase, you agree to be bound by these terms and conditions. Please read them carefully before using our services.

If you do not agree to any of these terms, please do not use the website or our services.`,
  };
}

/**
 * Generates custom terms section if provided.
 */
function generateCustomTermsSection(customTerms: string, language: 'ar' | 'en'): TermsSection | null {
  if (!customTerms || customTerms.trim() === '') return null;

  return {
    title: language === 'ar' ? 'شروط إضافية' : 'Additional Terms',
    content: customTerms.trim(),
  };
}

/**
 * Generates a complete terms of service document.
 * Requirements: 9.1, 9.2, 9.3, 9.5
 */
export function generateTermsOfService(input: TermsInput): TermsResult {
  const validation = validateTermsInputs(input);
  
  if (!validation.isValid) {
    return {
      document: '',
      sections: [],
      isComplete: false,
    };
  }

  const { storeName, storeUrl, contactEmail, clauses, customTerms, language } = input;

  const sections: TermsSection[] = [
    generateTermsIntro(storeName, storeUrl, language),
  ];

  // Add selected clause sections
  clauses.forEach(clause => {
    sections.push(getClauseContent(clause, storeName, storeUrl, contactEmail, language));
  });

  // Add custom terms if provided
  const customSection = generateCustomTermsSection(customTerms || '', language);
  if (customSection) {
    sections.push(customSection);
  }

  // Generate full document text
  const title = language === 'ar' 
    ? `اتفاقية الاستخدام - ${storeName}`
    : `Terms of Service - ${storeName}`;

  const document = `${title}\n${'='.repeat(title.length)}\n\n` +
    sections.map(s => `${s.title}\n${'-'.repeat(s.title.length)}\n${s.content}`).join('\n\n');

  return {
    document,
    sections,
    isComplete: true,
  };
}

/**
 * Gets available clause options with labels.
 */
export function getClauseOptions(language: 'ar' | 'en'): Array<{ value: TermsClause; label: string; description: string }> {
  const options: Array<{ value: TermsClause; label: { ar: string; en: string }; description: { ar: string; en: string } }> = [
    { 
      value: 'payment', 
      label: { ar: 'الدفع والأسعار', en: 'Payment & Pricing' },
      description: { ar: 'طرق الدفع والأسعار والضرائب', en: 'Payment methods, pricing, and taxes' },
    },
    { 
      value: 'delivery', 
      label: { ar: 'التوصيل والشحن', en: 'Delivery & Shipping' },
      description: { ar: 'مدة التوصيل ورسوم الشحن', en: 'Delivery times and shipping fees' },
    },
    { 
      value: 'liability', 
      label: { ar: 'حدود المسؤولية', en: 'Liability' },
      description: { ar: 'حدود مسؤولية المتجر', en: 'Store liability limitations' },
    },
    { 
      value: 'intellectual_property', 
      label: { ar: 'الملكية الفكرية', en: 'Intellectual Property' },
      description: { ar: 'حقوق المحتوى والعلامات التجارية', en: 'Content and trademark rights' },
    },
    { 
      value: 'privacy', 
      label: { ar: 'الخصوصية', en: 'Privacy' },
      description: { ar: 'جمع واستخدام البيانات', en: 'Data collection and usage' },
    },
    { 
      value: 'disputes', 
      label: { ar: 'حل النزاعات', en: 'Disputes' },
      description: { ar: 'آلية حل الخلافات', en: 'Dispute resolution mechanism' },
    },
    { 
      value: 'modifications', 
      label: { ar: 'تعديل الشروط', en: 'Modifications' },
      description: { ar: 'حق تعديل الشروط والأحكام', en: 'Right to modify terms' },
    },
  ];

  return options.map(o => ({ 
    value: o.value, 
    label: o.label[language],
    description: o.description[language],
  }));
}
