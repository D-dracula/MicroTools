/**
 * Refund & Return Policy Generator Logic
 * 
 * Generates legally compliant refund and return policies for e-commerce stores.
 * Supports Saudi Arabian e-commerce regulations.
 * Requirements: 8.1, 8.2, 8.3, 8.5
 */

export type RefundCondition = 
  | 'unused'
  | 'original_packaging'
  | 'with_receipt'
  | 'no_sale_items'
  | 'no_personalized';

export type RefundMethod = 'original' | 'store_credit' | 'both';

export interface RefundPolicyInput {
  storeName: string;
  returnWindow: number;       // Days
  conditions: RefundCondition[];
  refundMethod: RefundMethod;
  productCategories?: string[];
  language: 'ar' | 'en';
}

export interface PolicySection {
  title: string;
  content: string;
}

export interface RefundPolicyResult {
  policy: string;           // Generated policy text
  sections: PolicySection[];
  isComplete: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates refund policy inputs.
 */
export function validatePolicyInputs(input: Partial<RefundPolicyInput>): ValidationResult {
  if (!input.storeName || input.storeName.trim() === '') {
    return { isValid: false, error: 'Store name is required' };
  }

  if (input.returnWindow === undefined || input.returnWindow < 0) {
    return { isValid: false, error: 'Return window must be a non-negative number' };
  }

  if (!input.conditions || input.conditions.length === 0) {
    return { isValid: false, error: 'At least one return condition must be selected' };
  }

  if (!input.refundMethod) {
    return { isValid: false, error: 'Refund method is required' };
  }

  return { isValid: true };
}

/**
 * Gets condition text in the specified language.
 */
function getConditionText(condition: RefundCondition, language: 'ar' | 'en'): string {
  const conditions: Record<RefundCondition, { ar: string; en: string }> = {
    unused: {
      ar: 'يجب أن يكون المنتج غير مستخدم وفي حالته الأصلية',
      en: 'The product must be unused and in its original condition',
    },
    original_packaging: {
      ar: 'يجب إرجاع المنتج في عبوته الأصلية مع جميع الملحقات',
      en: 'The product must be returned in its original packaging with all accessories',
    },
    with_receipt: {
      ar: 'يجب تقديم إيصال الشراء أو إثبات الشراء',
      en: 'A purchase receipt or proof of purchase must be provided',
    },
    no_sale_items: {
      ar: 'لا يمكن إرجاع المنتجات المخفضة أو المباعة في التصفيات',
      en: 'Sale or clearance items cannot be returned',
    },
    no_personalized: {
      ar: 'لا يمكن إرجاع المنتجات المخصصة أو المصنوعة حسب الطلب',
      en: 'Personalized or custom-made products cannot be returned',
    },
  };

  return conditions[condition][language];
}

/**
 * Gets refund method text in the specified language.
 */
function getRefundMethodText(method: RefundMethod, language: 'ar' | 'en'): string {
  const methods: Record<RefundMethod, { ar: string; en: string }> = {
    original: {
      ar: 'سيتم رد المبلغ إلى طريقة الدفع الأصلية خلال 14 يوم عمل',
      en: 'Refunds will be credited to the original payment method within 14 business days',
    },
    store_credit: {
      ar: 'سيتم إصدار رصيد متجر يمكن استخدامه في عمليات الشراء المستقبلية',
      en: 'Store credit will be issued for use on future purchases',
    },
    both: {
      ar: 'يمكنك الاختيار بين استرداد المبلغ إلى طريقة الدفع الأصلية أو الحصول على رصيد متجر',
      en: 'You may choose between a refund to the original payment method or store credit',
    },
  };

  return methods[method][language];
}


/**
 * Generates the introduction section.
 */
function generateIntroSection(storeName: string, returnWindow: number, language: 'ar' | 'en'): PolicySection {
  if (language === 'ar') {
    return {
      title: 'مقدمة',
      content: `نحن في ${storeName} نسعى لرضاكم التام. إذا لم تكن راضياً عن مشترياتك، يمكنك إرجاع المنتجات خلال ${returnWindow} يوماً من تاريخ الاستلام وفقاً للشروط والأحكام التالية.`,
    };
  }
  return {
    title: 'Introduction',
    content: `At ${storeName}, we strive for your complete satisfaction. If you are not satisfied with your purchase, you may return products within ${returnWindow} days of receipt according to the following terms and conditions.`,
  };
}

/**
 * Generates the return conditions section.
 */
function generateConditionsSection(conditions: RefundCondition[], language: 'ar' | 'en'): PolicySection {
  const conditionTexts = conditions.map(c => `• ${getConditionText(c, language)}`).join('\n');
  
  if (language === 'ar') {
    return {
      title: 'شروط الإرجاع',
      content: `لقبول طلب الإرجاع، يجب استيفاء الشروط التالية:\n\n${conditionTexts}`,
    };
  }
  return {
    title: 'Return Conditions',
    content: `For a return request to be accepted, the following conditions must be met:\n\n${conditionTexts}`,
  };
}

/**
 * Generates the refund method section.
 */
function generateRefundMethodSection(method: RefundMethod, language: 'ar' | 'en'): PolicySection {
  if (language === 'ar') {
    return {
      title: 'طريقة الاسترداد',
      content: getRefundMethodText(method, language),
    };
  }
  return {
    title: 'Refund Method',
    content: getRefundMethodText(method, language),
  };
}

/**
 * Generates the return process section.
 */
function generateProcessSection(storeName: string, language: 'ar' | 'en'): PolicySection {
  if (language === 'ar') {
    return {
      title: 'إجراءات الإرجاع',
      content: `لإرجاع منتج، يرجى اتباع الخطوات التالية:

1. تواصل مع خدمة العملاء في ${storeName} لطلب الإرجاع
2. احصل على رقم طلب الإرجاع (RMA)
3. قم بتغليف المنتج بشكل آمن في عبوته الأصلية
4. أرفق إيصال الشراء ورقم طلب الإرجاع
5. أرسل الطرد إلى العنوان المحدد من قبل خدمة العملاء

سيتم فحص المنتج عند استلامه ومعالجة طلب الاسترداد خلال 5-7 أيام عمل.`,
    };
  }
  return {
    title: 'Return Process',
    content: `To return a product, please follow these steps:

1. Contact ${storeName} customer service to request a return
2. Obtain a Return Merchandise Authorization (RMA) number
3. Securely package the product in its original packaging
4. Include the purchase receipt and RMA number
5. Ship the package to the address provided by customer service

The product will be inspected upon receipt and the refund will be processed within 5-7 business days.`,
  };
}

/**
 * Generates the Saudi e-commerce compliance section.
 */
function generateComplianceSection(language: 'ar' | 'en'): PolicySection {
  if (language === 'ar') {
    return {
      title: 'الامتثال لنظام التجارة الإلكترونية السعودي',
      content: `تلتزم هذه السياسة بنظام التجارة الإلكترونية الصادر عن وزارة التجارة في المملكة العربية السعودية، والذي يكفل للمستهلك الحق في:

• إلغاء الطلب قبل الشحن دون أي رسوم
• استرداد المبلغ كاملاً في حالة عدم مطابقة المنتج للوصف
• الحصول على فاتورة ضريبية واضحة
• حماية البيانات الشخصية وفقاً لنظام حماية البيانات

للاستفسارات أو الشكاوى، يمكنكم التواصل مع وزارة التجارة عبر الرقم الموحد 1900.`,
    };
  }
  return {
    title: 'Saudi E-Commerce Compliance',
    content: `This policy complies with the E-Commerce Law issued by the Ministry of Commerce in the Kingdom of Saudi Arabia, which guarantees consumers the right to:

• Cancel orders before shipping without any fees
• Receive a full refund if the product does not match the description
• Obtain a clear tax invoice
• Personal data protection in accordance with data protection regulations

For inquiries or complaints, you may contact the Ministry of Commerce at 1900.`,
  };
}

/**
 * Generates product category exceptions section if categories are provided.
 */
function generateCategorySection(categories: string[], language: 'ar' | 'en'): PolicySection | null {
  if (!categories || categories.length === 0) return null;

  const categoryList = categories.map(c => `• ${c}`).join('\n');

  if (language === 'ar') {
    return {
      title: 'استثناءات فئات المنتجات',
      content: `قد تختلف شروط الإرجاع للفئات التالية:\n\n${categoryList}\n\nيرجى مراجعة صفحة المنتج للاطلاع على شروط الإرجاع الخاصة بكل فئة.`,
    };
  }
  return {
    title: 'Product Category Exceptions',
    content: `Return conditions may vary for the following categories:\n\n${categoryList}\n\nPlease review the product page for category-specific return terms.`,
  };
}

/**
 * Generates the contact section.
 */
function generateContactSection(storeName: string, language: 'ar' | 'en'): PolicySection {
  if (language === 'ar') {
    return {
      title: 'تواصل معنا',
      content: `إذا كان لديك أي استفسارات حول سياسة الإرجاع والاسترداد، يرجى التواصل مع فريق خدمة العملاء في ${storeName}. نحن هنا لمساعدتك.`,
    };
  }
  return {
    title: 'Contact Us',
    content: `If you have any questions about our return and refund policy, please contact the ${storeName} customer service team. We are here to help.`,
  };
}

/**
 * Generates a complete refund policy document.
 * Requirements: 8.1, 8.2, 8.3, 8.5
 */
export function generateRefundPolicy(input: RefundPolicyInput): RefundPolicyResult {
  const validation = validatePolicyInputs(input);
  
  if (!validation.isValid) {
    return {
      policy: '',
      sections: [],
      isComplete: false,
    };
  }

  const { storeName, returnWindow, conditions, refundMethod, productCategories, language } = input;

  const sections: PolicySection[] = [
    generateIntroSection(storeName, returnWindow, language),
    generateConditionsSection(conditions, language),
    generateRefundMethodSection(refundMethod, language),
    generateProcessSection(storeName, language),
    generateComplianceSection(language),
  ];

  // Add category section if categories are provided
  const categorySection = generateCategorySection(productCategories || [], language);
  if (categorySection) {
    sections.splice(4, 0, categorySection); // Insert before compliance section
  }

  sections.push(generateContactSection(storeName, language));

  // Generate full policy text
  const title = language === 'ar' 
    ? `سياسة الاستبدال والاسترجاع - ${storeName}`
    : `Return and Refund Policy - ${storeName}`;

  const policy = `${title}\n${'='.repeat(title.length)}\n\n` +
    sections.map(s => `${s.title}\n${'-'.repeat(s.title.length)}\n${s.content}`).join('\n\n');

  return {
    policy,
    sections,
    isComplete: true,
  };
}

/**
 * Gets available condition options with labels.
 */
export function getConditionOptions(language: 'ar' | 'en'): Array<{ value: RefundCondition; label: string }> {
  const options: Array<{ value: RefundCondition; label: { ar: string; en: string } }> = [
    { value: 'unused', label: { ar: 'المنتج غير مستخدم', en: 'Product unused' } },
    { value: 'original_packaging', label: { ar: 'التغليف الأصلي', en: 'Original packaging' } },
    { value: 'with_receipt', label: { ar: 'مع إيصال الشراء', en: 'With receipt' } },
    { value: 'no_sale_items', label: { ar: 'استثناء التخفيضات', en: 'Exclude sale items' } },
    { value: 'no_personalized', label: { ar: 'استثناء المنتجات المخصصة', en: 'Exclude personalized items' } },
  ];

  return options.map(o => ({ value: o.value, label: o.label[language] }));
}

/**
 * Gets available refund method options with labels.
 */
export function getRefundMethodOptions(language: 'ar' | 'en'): Array<{ value: RefundMethod; label: string }> {
  const options: Array<{ value: RefundMethod; label: { ar: string; en: string } }> = [
    { value: 'original', label: { ar: 'استرداد لطريقة الدفع الأصلية', en: 'Refund to original payment' } },
    { value: 'store_credit', label: { ar: 'رصيد متجر', en: 'Store credit' } },
    { value: 'both', label: { ar: 'كلاهما (اختيار العميل)', en: 'Both (customer choice)' } },
  ];

  return options.map(o => ({ value: o.value, label: o.label[language] }));
}
