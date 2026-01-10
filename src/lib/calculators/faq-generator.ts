/**
 * FAQ Generator Logic
 * 
 * Generates FAQ content with JSON-LD schema markup for rich snippets.
 * Includes pre-built templates for common e-commerce topics.
 * Requirements: 12.1, 12.2, 12.3, 12.5
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQInput {
  questions: FAQItem[];
  language: 'ar' | 'en';
}

export interface FAQResult {
  formattedText: string;
  schemaMarkup: string;     // JSON-LD
  isValidSchema: boolean;
}

export interface FAQTemplate {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  questions: { ar: FAQItem[]; en: FAQItem[] };
}

/**
 * Pre-built FAQ templates for common e-commerce topics.
 * Requirements: 12.3
 */
export const FAQ_TEMPLATES: FAQTemplate[] = [
  {
    id: 'shipping',
    name: { ar: 'الشحن والتوصيل', en: 'Shipping & Delivery' },
    description: { ar: 'أسئلة شائعة حول الشحن والتوصيل', en: 'Common questions about shipping and delivery' },
    questions: {
      ar: [
        { question: 'ما هي مدة التوصيل؟', answer: 'تتراوح مدة التوصيل من 2-5 أيام عمل للمدن الرئيسية، و5-10 أيام عمل للمناطق النائية.' },
        { question: 'هل يمكنني تتبع طلبي؟', answer: 'نعم، سيتم إرسال رقم تتبع الشحنة عبر البريد الإلكتروني والرسائل النصية فور شحن الطلب.' },
        { question: 'ما هي رسوم الشحن؟', answer: 'تُحسب رسوم الشحن عند إتمام الطلب بناءً على الموقع ووزن الشحنة. التوصيل مجاني للطلبات فوق 200 ريال.' },
      ],
      en: [
        { question: 'What is the delivery time?', answer: 'Delivery takes 2-5 business days for major cities, and 5-10 business days for remote areas.' },
        { question: 'Can I track my order?', answer: 'Yes, a tracking number will be sent via email and SMS once your order is shipped.' },
        { question: 'What are the shipping fees?', answer: 'Shipping fees are calculated at checkout based on location and weight. Free shipping for orders over 200 SAR.' },
      ],
    },
  },
  {
    id: 'returns',
    name: { ar: 'الإرجاع والاستبدال', en: 'Returns & Exchanges' },
    description: { ar: 'أسئلة شائعة حول سياسة الإرجاع', en: 'Common questions about return policy' },
    questions: {
      ar: [
        { question: 'ما هي سياسة الإرجاع؟', answer: 'يمكنك إرجاع المنتجات خلال 14 يوماً من تاريخ الاستلام بشرط أن تكون في حالتها الأصلية.' },
        { question: 'كيف يمكنني إرجاع منتج؟', answer: 'تواصل مع خدمة العملاء للحصول على رقم طلب الإرجاع، ثم أرسل المنتج إلى العنوان المحدد.' },
        { question: 'متى سأستلم المبلغ المسترد؟', answer: 'سيتم رد المبلغ خلال 14 يوم عمل من استلام المنتج المرتجع وفحصه.' },
      ],
      en: [
        { question: 'What is your return policy?', answer: 'You can return products within 14 days of receipt, provided they are in their original condition.' },
        { question: 'How do I return a product?', answer: 'Contact customer service to get a return authorization number, then ship the product to the specified address.' },
        { question: 'When will I receive my refund?', answer: 'Refunds are processed within 14 business days after receiving and inspecting the returned product.' },
      ],
    },
  },
  {
    id: 'payment',
    name: { ar: 'الدفع والفواتير', en: 'Payment & Billing' },
    description: { ar: 'أسئلة شائعة حول طرق الدفع', en: 'Common questions about payment methods' },
    questions: {
      ar: [
        { question: 'ما هي طرق الدفع المتاحة؟', answer: 'نقبل البطاقات الائتمانية (فيزا، ماستركارد، مدى)، Apple Pay، Google Pay، والدفع عند الاستلام.' },
        { question: 'هل الدفع آمن؟', answer: 'نعم، جميع المعاملات مشفرة ومحمية بأحدث تقنيات الأمان. نحن لا نحتفظ ببيانات بطاقتك.' },
        { question: 'هل يمكنني الحصول على فاتورة ضريبية؟', answer: 'نعم، يتم إرسال فاتورة ضريبية تلقائياً إلى بريدك الإلكتروني بعد إتمام الطلب.' },
      ],
      en: [
        { question: 'What payment methods do you accept?', answer: 'We accept credit cards (Visa, Mastercard, Mada), Apple Pay, Google Pay, and Cash on Delivery.' },
        { question: 'Is payment secure?', answer: 'Yes, all transactions are encrypted and protected with the latest security technology. We do not store your card details.' },
        { question: 'Can I get a tax invoice?', answer: 'Yes, a tax invoice is automatically sent to your email after completing your order.' },
      ],
    },
  },
  {
    id: 'products',
    name: { ar: 'المنتجات والمخزون', en: 'Products & Stock' },
    description: { ar: 'أسئلة شائعة حول المنتجات', en: 'Common questions about products' },
    questions: {
      ar: [
        { question: 'هل المنتجات أصلية؟', answer: 'نعم، جميع منتجاتنا أصلية 100% ومضمونة. نحن وكلاء معتمدون للعلامات التجارية التي نبيعها.' },
        { question: 'ماذا أفعل إذا كان المنتج غير متوفر؟', answer: 'يمكنك الاشتراك في إشعارات التوفر وسنرسل لك رسالة فور توفر المنتج مرة أخرى.' },
        { question: 'هل يمكنني طلب منتج غير موجود في المتجر؟', answer: 'نعم، تواصل معنا وسنحاول توفير المنتج لك إن أمكن.' },
      ],
      en: [
        { question: 'Are the products authentic?', answer: 'Yes, all our products are 100% authentic and guaranteed. We are authorized dealers for the brands we sell.' },
        { question: 'What if a product is out of stock?', answer: 'You can subscribe to availability notifications and we will send you a message when the product is back in stock.' },
        { question: 'Can I request a product not in the store?', answer: 'Yes, contact us and we will try to source the product for you if possible.' },
      ],
    },
  },
  {
    id: 'account',
    name: { ar: 'الحساب والتسجيل', en: 'Account & Registration' },
    description: { ar: 'أسئلة شائعة حول الحساب', en: 'Common questions about accounts' },
    questions: {
      ar: [
        { question: 'هل يجب علي إنشاء حساب للشراء؟', answer: 'لا، يمكنك الشراء كضيف. لكن إنشاء حساب يتيح لك تتبع طلباتك وحفظ عناوينك.' },
        { question: 'نسيت كلمة المرور، ماذا أفعل؟', answer: 'اضغط على "نسيت كلمة المرور" في صفحة تسجيل الدخول وسنرسل لك رابط إعادة التعيين.' },
        { question: 'كيف يمكنني تحديث بياناتي؟', answer: 'سجل الدخول إلى حسابك واذهب إلى "إعدادات الحساب" لتحديث بياناتك الشخصية.' },
      ],
      en: [
        { question: 'Do I need to create an account to purchase?', answer: 'No, you can checkout as a guest. However, creating an account allows you to track orders and save addresses.' },
        { question: 'I forgot my password, what do I do?', answer: 'Click "Forgot Password" on the login page and we will send you a reset link.' },
        { question: 'How can I update my information?', answer: 'Log in to your account and go to "Account Settings" to update your personal information.' },
      ],
    },
  },
];

/**
 * Validates FAQ input.
 */
export function validateFAQInput(input: Partial<FAQInput>): { isValid: boolean; error?: string } {
  if (!input.questions || input.questions.length === 0) {
    return { isValid: false, error: 'At least one question-answer pair is required' };
  }

  for (let i = 0; i < input.questions.length; i++) {
    const item = input.questions[i];
    if (!item.question || item.question.trim() === '') {
      return { isValid: false, error: `Question ${i + 1} is empty` };
    }
    if (!item.answer || item.answer.trim() === '') {
      return { isValid: false, error: `Answer ${i + 1} is empty` };
    }
  }

  return { isValid: true };
}

/**
 * Generates formatted FAQ text.
 * Requirements: 12.1
 */
export function formatFAQText(questions: FAQItem[], language: 'ar' | 'en'): string {
  const title = language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions';
  const separator = '='.repeat(title.length);
  
  const formattedQuestions = questions.map((item, index) => {
    const qPrefix = language === 'ar' ? 'س' : 'Q';
    const aPrefix = language === 'ar' ? 'ج' : 'A';
    return `${qPrefix}${index + 1}: ${item.question}\n${aPrefix}${index + 1}: ${item.answer}`;
  }).join('\n\n');

  return `${title}\n${separator}\n\n${formattedQuestions}`;
}

/**
 * Generates JSON-LD schema markup for FAQ rich snippets.
 * Requirements: 12.2
 */
export function generateFAQSchema(questions: FAQItem[]): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(item => ({
      "@type": "Question",
      "name": item.question.trim(),
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer.trim(),
      },
    })),
  };

  return JSON.stringify(schema, null, 2);
}

/**
 * Validates JSON-LD schema format.
 * Requirements: 12.5
 */
export function validateSchema(schema: string): boolean {
  try {
    const parsed = JSON.parse(schema);
    
    // Check required fields
    if (parsed["@context"] !== "https://schema.org") return false;
    if (parsed["@type"] !== "FAQPage") return false;
    if (!Array.isArray(parsed.mainEntity)) return false;
    if (parsed.mainEntity.length === 0) return false;

    // Validate each question
    for (const entity of parsed.mainEntity) {
      if (entity["@type"] !== "Question") return false;
      if (!entity.name || typeof entity.name !== 'string') return false;
      if (!entity.acceptedAnswer) return false;
      if (entity.acceptedAnswer["@type"] !== "Answer") return false;
      if (!entity.acceptedAnswer.text || typeof entity.acceptedAnswer.text !== 'string') return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Generates complete FAQ content with formatted text and schema markup.
 * Requirements: 12.1, 12.2, 12.5
 */
export function generateFAQ(input: FAQInput): FAQResult {
  const validation = validateFAQInput(input);
  
  if (!validation.isValid) {
    return {
      formattedText: '',
      schemaMarkup: '',
      isValidSchema: false,
    };
  }

  const { questions, language } = input;
  
  // Clean up questions
  const cleanedQuestions = questions.map(q => ({
    question: q.question.trim(),
    answer: q.answer.trim(),
  }));

  const formattedText = formatFAQText(cleanedQuestions, language);
  const schemaMarkup = generateFAQSchema(cleanedQuestions);
  const isValidSchema = validateSchema(schemaMarkup);

  return {
    formattedText,
    schemaMarkup,
    isValidSchema,
  };
}

/**
 * Gets FAQ templates for a specific language.
 */
export function getFAQTemplates(language: 'ar' | 'en'): Array<{
  id: string;
  name: string;
  description: string;
  questions: FAQItem[];
}> {
  return FAQ_TEMPLATES.map(template => ({
    id: template.id,
    name: template.name[language],
    description: template.description[language],
    questions: template.questions[language],
  }));
}

/**
 * Gets a specific FAQ template by ID.
 */
export function getFAQTemplateById(id: string, language: 'ar' | 'en'): FAQItem[] | null {
  const template = FAQ_TEMPLATES.find(t => t.id === id);
  if (!template) return null;
  return template.questions[language];
}
