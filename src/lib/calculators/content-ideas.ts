/**
 * Content Idea Generator Logic
 * 
 * Generates content ideas and templates for e-commerce stores.
 * Organizes ideas by content type and platform.
 * Requirements: 14.1, 14.2, 14.3, 14.5
 */

export type StoreCategory = 
  | 'fashion'
  | 'electronics'
  | 'beauty'
  | 'food'
  | 'home'
  | 'sports'
  | 'kids'
  | 'general';

export type ContentType = 
  | 'product_announcement'
  | 'promotion'
  | 'seasonal'
  | 'engagement'
  | 'educational';

export type Platform = 'instagram' | 'twitter' | 'tiktok' | 'snapchat' | 'general';

export interface ContentIdea {
  id: string;
  title: { ar: string; en: string };
  template: { ar: string; en: string };
  type: ContentType;
  platform: Platform;
  tips: { ar: string[]; en: string[] };
}

export interface LocalizedContentIdea {
  id: string;
  title: string;
  template: string;
  type: ContentType;
  platform: Platform;
  tips: string[];
}

export interface LocalizedContentIdeasResult {
  ideas: LocalizedContentIdea[];
  byType: Record<ContentType, LocalizedContentIdea[]>;
  byPlatform: Record<Platform, LocalizedContentIdea[]>;
}


/** Content type labels for UI display */
export const CONTENT_TYPE_LABELS: Record<ContentType, { ar: string; en: string }> = {
  product_announcement: { ar: 'إعلان منتج', en: 'Product Announcement' },
  promotion: { ar: 'عروض وتخفيضات', en: 'Promotions' },
  seasonal: { ar: 'محتوى موسمي', en: 'Seasonal Content' },
  engagement: { ar: 'تفاعل مع الجمهور', en: 'Engagement' },
  educational: { ar: 'محتوى تعليمي', en: 'Educational' },
};

/** Platform labels for UI display */
export const PLATFORM_LABELS: Record<Platform, { ar: string; en: string }> = {
  instagram: { ar: 'انستقرام', en: 'Instagram' },
  twitter: { ar: 'تويتر/إكس', en: 'Twitter/X' },
  tiktok: { ar: 'تيك توك', en: 'TikTok' },
  snapchat: { ar: 'سناب شات', en: 'Snapchat' },
  general: { ar: 'عام', en: 'General' },
};

/** Store category labels for UI display */
export const STORE_CATEGORY_LABELS: Record<StoreCategory, { ar: string; en: string }> = {
  fashion: { ar: 'أزياء وملابس', en: 'Fashion & Clothing' },
  electronics: { ar: 'إلكترونيات', en: 'Electronics' },
  beauty: { ar: 'تجميل وعناية', en: 'Beauty & Care' },
  food: { ar: 'أغذية ومشروبات', en: 'Food & Beverages' },
  home: { ar: 'منزل وديكور', en: 'Home & Decor' },
  sports: { ar: 'رياضة ولياقة', en: 'Sports & Fitness' },
  kids: { ar: 'أطفال وألعاب', en: 'Kids & Toys' },
  general: { ar: 'متجر عام', en: 'General Store' },
};


/** Content templates database - Requirements: 14.1, 14.2, 14.3 */
const CONTENT_TEMPLATES: Record<StoreCategory, ContentIdea[]> = {
  fashion: [
    {
      id: 'fashion-new-arrival',
      title: { ar: 'وصول منتج جديد', en: 'New Arrival Announcement' },
      template: {
        ar: '✨ وصل حديثاً!\n\n[اسم المنتج] الجديد متوفر الآن\n\n🔹 [ميزة 1]\n🔹 [ميزة 2]\n🔹 [ميزة 3]\n\n💰 السعر: [السعر] ريال\n\n🛒 اطلب الآن - الكمية محدودة!\n\n#موضة #أزياء #جديد',
        en: '✨ Just Arrived!\n\nThe new [Product Name] is now available\n\n🔹 [Feature 1]\n🔹 [Feature 2]\n🔹 [Feature 3]\n\n💰 Price: [Price] SAR\n\n🛒 Order now - Limited quantity!\n\n#Fashion #NewArrival #Style',
      },
      type: 'product_announcement',
      platform: 'instagram',
      tips: { ar: ['استخدم صور عالية الجودة', 'أضف فيديو قصير للمنتج'], en: ['Use high-quality images', 'Add a short product video'] },
    },
    {
      id: 'fashion-sale',
      title: { ar: 'تخفيضات موسمية', en: 'Seasonal Sale' },
      template: {
        ar: '🔥 تخفيضات [الموسم]!\n\nخصم يصل إلى [النسبة]% على جميع المنتجات\n\n⏰ العرض ساري حتى [التاريخ]\n\n✅ شحن مجاني للطلبات فوق [المبلغ] ريال\n\n🛍️ تسوق الآن!\n\n#تخفيضات #عروض #موضة',
        en: '🔥 [Season] Sale!\n\nUp to [Percentage]% off on all items\n\n⏰ Offer valid until [Date]\n\n✅ Free shipping on orders over [Amount] SAR\n\n🛍️ Shop now!\n\n#Sale #Fashion #Deals',
      },
      type: 'promotion',
      platform: 'general',
      tips: { ar: ['حدد مدة العرض بوضوح', 'أبرز أفضل المنتجات المخفضة'], en: ['Clearly state offer duration', 'Highlight best discounted items'] },
    },
    {
      id: 'fashion-styling-tips',
      title: { ar: 'نصائح تنسيق', en: 'Styling Tips' },
      template: {
        ar: '👗 كيف تنسقين [المنتج]؟\n\n1️⃣ [طريقة 1]\n2️⃣ [طريقة 2]\n3️⃣ [طريقة 3]\n\n💡 نصيحة إضافية: [نصيحة]\n\nشاركينا تنسيقك في التعليقات! 👇\n\n#تنسيق #موضة #ستايل',
        en: '👗 How to style [Product]?\n\n1️⃣ [Way 1]\n2️⃣ [Way 2]\n3️⃣ [Way 3]\n\n💡 Extra tip: [Tip]\n\nShare your style in the comments! 👇\n\n#Styling #Fashion #OOTD',
      },
      type: 'educational',
      platform: 'instagram',
      tips: { ar: ['استخدم صور قبل وبعد', 'أنشئ ريلز قصير'], en: ['Use before/after images', 'Create a short reel'] },
    },
    {
      id: 'fashion-poll',
      title: { ar: 'استطلاع رأي', en: 'Style Poll' },
      template: {
        ar: '🤔 أي لوك تفضلين؟\n\nA: [الخيار الأول]\nB: [الخيار الثاني]\n\nصوتي في التعليقات! 👇\n\n#استطلاع #موضة',
        en: '🤔 Which look do you prefer?\n\nA: [Option 1]\nB: [Option 2]\n\nVote in the comments! 👇\n\n#Poll #Fashion',
      },
      type: 'engagement',
      platform: 'instagram',
      tips: { ar: ['استخدم ستيكر الاستطلاع في الستوري', 'شارك النتائج لاحقاً'], en: ['Use poll sticker in stories', 'Share results later'] },
    },
    {
      id: 'fashion-eid',
      title: { ar: 'تهنئة العيد', en: 'Eid Greeting' },
      template: {
        ar: '🌙 عيد مبارك!\n\nكل عام وأنتم بخير\n\n✨ استعدوا للعيد مع تشكيلتنا الجديدة\n\n🎁 خصم [النسبة]% بكود: [الكود]\n\n#عيد_مبارك #موضة_العيد',
        en: '🌙 Eid Mubarak!\n\nWishing you a blessed Eid\n\n✨ Get ready for Eid with our new collection\n\n🎁 [Percentage]% off with code: [CODE]\n\n#EidMubarak #EidFashion',
      },
      type: 'seasonal',
      platform: 'general',
      tips: { ar: ['انشر قبل العيد بأسبوع', 'أبرز ملابس العيد'], en: ['Post a week before Eid', 'Highlight Eid outfits'] },
    },
  ],
  electronics: [
    {
      id: 'electronics-new-product',
      title: { ar: 'منتج تقني جديد', en: 'New Tech Product' },
      template: {
        ar: '📱 جديد في المتجر!\n\n[اسم المنتج]\n\n⚡ المواصفات:\n• [مواصفة 1]\n• [مواصفة 2]\n• [مواصفة 3]\n\n💰 السعر: [السعر] ريال\n📦 ضمان [المدة]\n\n#تقنية #إلكترونيات #جديد',
        en: '📱 New in Store!\n\n[Product Name]\n\n⚡ Specs:\n• [Spec 1]\n• [Spec 2]\n• [Spec 3]\n\n💰 Price: [Price] SAR\n📦 [Duration] Warranty\n\n#Tech #Electronics #New',
      },
      type: 'product_announcement',
      platform: 'twitter',
      tips: { ar: ['أضف فيديو unboxing', 'قارن بالمنافسين'], en: ['Add unboxing video', 'Compare with competitors'] },
    },
    {
      id: 'electronics-comparison',
      title: { ar: 'مقارنة منتجات', en: 'Product Comparison' },
      template: {
        ar: '⚔️ مقارنة: [المنتج 1] vs [المنتج 2]\n\n📊 المواصفات:\n[جدول مقارنة]\n\n✅ الأفضل لـ [الاستخدام 1]: [المنتج]\n✅ الأفضل لـ [الاستخدام 2]: [المنتج]\n\nأيهما تختار؟ 🤔\n\n#مقارنة #تقنية',
        en: '⚔️ Comparison: [Product 1] vs [Product 2]\n\n📊 Specs:\n[Comparison table]\n\n✅ Best for [Use 1]: [Product]\n✅ Best for [Use 2]: [Product]\n\nWhich would you choose? 🤔\n\n#Comparison #Tech',
      },
      type: 'educational',
      platform: 'tiktok',
      tips: { ar: ['استخدم جدول مقارنة واضح', 'كن محايداً'], en: ['Use clear comparison table', 'Be neutral'] },
    },
    {
      id: 'electronics-flash-sale',
      title: { ar: 'عرض سريع', en: 'Flash Sale' },
      template: {
        ar: '⚡ عرض سريع - 24 ساعة فقط!\n\n[المنتج] بخصم [النسبة]%\n\n💰 السعر الأصلي: [السعر]\n🔥 السعر الآن: [السعر الجديد]\n\n⏰ ينتهي العرض: [الوقت]\n\n#عرض_سريع #تخفيضات',
        en: '⚡ Flash Sale - 24 Hours Only!\n\n[Product] at [Percentage]% off\n\n💰 Original: [Price]\n🔥 Now: [New Price]\n\n⏰ Ends: [Time]\n\n#FlashSale #Deals',
      },
      type: 'promotion',
      platform: 'snapchat',
      tips: { ar: ['استخدم عداد تنازلي', 'أرسل تذكير قبل انتهاء العرض'], en: ['Use countdown timer', 'Send reminder before end'] },
    },
  ],
  beauty: [
    {
      id: 'beauty-new-product',
      title: { ar: 'منتج تجميل جديد', en: 'New Beauty Product' },
      template: {
        ar: '💄 وصل حديثاً!\n\n[اسم المنتج] من [الماركة]\n\n✨ المميزات:\n• [ميزة 1]\n• [ميزة 2]\n• [ميزة 3]\n\n🌿 مكونات طبيعية\n💰 السعر: [السعر] ريال\n\n#جمال #عناية #مكياج',
        en: '💄 Just Arrived!\n\n[Product Name] by [Brand]\n\n✨ Features:\n• [Feature 1]\n• [Feature 2]\n• [Feature 3]\n\n🌿 Natural ingredients\n💰 Price: [Price] SAR\n\n#Beauty #Skincare #Makeup',
      },
      type: 'product_announcement',
      platform: 'instagram',
      tips: { ar: ['أضف سواتش للألوان', 'اعرض النتيجة قبل وبعد'], en: ['Add color swatches', 'Show before/after results'] },
    },
    {
      id: 'beauty-routine',
      title: { ar: 'روتين العناية', en: 'Skincare Routine' },
      template: {
        ar: '🧴 روتين العناية [الصباحي/المسائي]\n\n1️⃣ [الخطوة 1]: [المنتج]\n2️⃣ [الخطوة 2]: [المنتج]\n3️⃣ [الخطوة 3]: [المنتج]\n\n💡 نصيحة: [نصيحة]\n\nما روتينك؟ شاركينا! 👇\n\n#روتين_العناية #بشرة',
        en: '🧴 [Morning/Evening] Skincare Routine\n\n1️⃣ [Step 1]: [Product]\n2️⃣ [Step 2]: [Product]\n3️⃣ [Step 3]: [Product]\n\n💡 Tip: [Tip]\n\nWhat\'s your routine? Share! 👇\n\n#SkincareRoutine #Skincare',
      },
      type: 'educational',
      platform: 'tiktok',
      tips: { ar: ['صوري الروتين كاملاً', 'اشرحي فائدة كل منتج'], en: ['Film the full routine', 'Explain each product benefit'] },
    },
    {
      id: 'beauty-giveaway',
      title: { ar: 'مسابقة وهدايا', en: 'Giveaway' },
      template: {
        ar: '🎁 مسابقة!\n\nاربحي [الجائزة]!\n\n📝 طريقة المشاركة:\n1. تابعي حسابنا\n2. لايك لهذا المنشور\n3. منشن صديقتين\n\n⏰ الإعلان عن الفائزة: [التاريخ]\n\n#مسابقة #هدايا #جمال',
        en: '🎁 Giveaway!\n\nWin [Prize]!\n\n📝 How to enter:\n1. Follow our account\n2. Like this post\n3. Tag 2 friends\n\n⏰ Winner announced: [Date]\n\n#Giveaway #Beauty #Contest',
      },
      type: 'engagement',
      platform: 'instagram',
      tips: { ar: ['حددي شروط واضحة', 'اختاري جائزة جذابة'], en: ['Set clear rules', 'Choose attractive prize'] },
    },
  ],
  food: [
    {
      id: 'food-new-item',
      title: { ar: 'صنف جديد', en: 'New Menu Item' },
      template: {
        ar: '🍽️ جديد في القائمة!\n\n[اسم الصنف]\n\n🌟 المكونات:\n• [مكون 1]\n• [مكون 2]\n• [مكون 3]\n\n💰 السعر: [السعر] ريال\n📍 متوفر في [الفرع/أونلاين]\n\n#طعام #جديد #لذيذ',
        en: '🍽️ New on the Menu!\n\n[Item Name]\n\n🌟 Ingredients:\n• [Ingredient 1]\n• [Ingredient 2]\n• [Ingredient 3]\n\n💰 Price: [Price] SAR\n📍 Available at [Branch/Online]\n\n#Food #New #Delicious',
      },
      type: 'product_announcement',
      platform: 'instagram',
      tips: { ar: ['صور الطعام بإضاءة طبيعية', 'أضف فيديو للتحضير'], en: ['Photograph food in natural light', 'Add preparation video'] },
    },
    {
      id: 'food-recipe',
      title: { ar: 'وصفة سهلة', en: 'Easy Recipe' },
      template: {
        ar: '👨‍🍳 وصفة [اسم الوصفة]\n\n📝 المقادير:\n• [مقدار 1]\n• [مقدار 2]\n• [مقدار 3]\n\n👇 الطريقة:\n1. [خطوة 1]\n2. [خطوة 2]\n3. [خطوة 3]\n\n⏱️ وقت التحضير: [الوقت]\n\nجربوها وشاركونا! 📸\n\n#وصفات #طبخ',
        en: '👨‍🍳 [Recipe Name] Recipe\n\n📝 Ingredients:\n• [Ingredient 1]\n• [Ingredient 2]\n• [Ingredient 3]\n\n👇 Instructions:\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\n⏱️ Prep time: [Time]\n\nTry it and share! 📸\n\n#Recipe #Cooking',
      },
      type: 'educational',
      platform: 'tiktok',
      tips: { ar: ['صور كل خطوة', 'اجعل الفيديو سريع وممتع'], en: ['Film each step', 'Make video fast and fun'] },
    },
    {
      id: 'food-ramadan',
      title: { ar: 'عروض رمضان', en: 'Ramadan Offers' },
      template: {
        ar: '🌙 عروض رمضان!\n\n🍽️ وجبة الإفطار الكاملة\n\n✨ تشمل:\n• [صنف 1]\n• [صنف 2]\n• [صنف 3]\n• [مشروب]\n\n💰 السعر: [السعر] ريال فقط!\n\n📞 للطلب: [الرقم]\n\n#رمضان #إفطار #عروض',
        en: '🌙 Ramadan Offers!\n\n🍽️ Complete Iftar Meal\n\n✨ Includes:\n• [Item 1]\n• [Item 2]\n• [Item 3]\n• [Drink]\n\n💰 Price: Only [Price] SAR!\n\n📞 Order: [Number]\n\n#Ramadan #Iftar #Offers',
      },
      type: 'seasonal',
      platform: 'general',
      tips: { ar: ['ابدأ الترويج قبل رمضان', 'قدم خيارات عائلية'], en: ['Start promotion before Ramadan', 'Offer family options'] },
    },
  ],
  home: [
    {
      id: 'home-new-collection',
      title: { ar: 'تشكيلة جديدة', en: 'New Collection' },
      template: {
        ar: '🏠 تشكيلة [الموسم] الجديدة!\n\n✨ أضف لمسة جمال لمنزلك\n\n🛋️ يشمل:\n• [منتج 1]\n• [منتج 2]\n• [منتج 3]\n\n💰 أسعار تبدأ من [السعر] ريال\n🚚 توصيل مجاني\n\n#ديكور #منزل #تصميم_داخلي',
        en: '🏠 New [Season] Collection!\n\n✨ Add beauty to your home\n\n🛋️ Includes:\n• [Product 1]\n• [Product 2]\n• [Product 3]\n\n💰 Prices start from [Price] SAR\n🚚 Free delivery\n\n#Decor #Home #InteriorDesign',
      },
      type: 'product_announcement',
      platform: 'instagram',
      tips: { ar: ['صور المنتجات في بيئة منزلية', 'أظهر طرق التنسيق'], en: ['Photograph products in home setting', 'Show styling options'] },
    },
    {
      id: 'home-styling-tips',
      title: { ar: 'نصائح ديكور', en: 'Decor Tips' },
      template: {
        ar: '💡 5 نصائح لـ [الغرفة] مثالية\n\n1️⃣ [نصيحة 1]\n2️⃣ [نصيحة 2]\n3️⃣ [نصيحة 3]\n4️⃣ [نصيحة 4]\n5️⃣ [نصيحة 5]\n\n📌 احفظ هذا المنشور للرجوع إليه!\n\n#ديكور #نصائح #تصميم',
        en: '💡 5 Tips for the Perfect [Room]\n\n1️⃣ [Tip 1]\n2️⃣ [Tip 2]\n3️⃣ [Tip 3]\n4️⃣ [Tip 4]\n5️⃣ [Tip 5]\n\n📌 Save this post for later!\n\n#Decor #Tips #Design',
      },
      type: 'educational',
      platform: 'instagram',
      tips: { ar: ['استخدم صور قبل وبعد', 'أنشئ كاروسيل'], en: ['Use before/after photos', 'Create a carousel'] },
    },
    {
      id: 'home-clearance',
      title: { ar: 'تصفية مخزون', en: 'Clearance Sale' },
      template: {
        ar: '🏷️ تصفية!\n\nخصومات تصل إلى [النسبة]%\n\n🔥 منتجات مختارة:\n• [منتج 1] - [السعر الجديد] ريال\n• [منتج 2] - [السعر الجديد] ريال\n\n⚠️ الكميات محدودة!\n\n#تصفية #خصومات #ديكور',
        en: '🏷️ Clearance!\n\nUp to [Percentage]% off\n\n🔥 Selected items:\n• [Product 1] - [New Price] SAR\n• [Product 2] - [New Price] SAR\n\n⚠️ Limited quantities!\n\n#Clearance #Sale #Decor',
      },
      type: 'promotion',
      platform: 'general',
      tips: { ar: ['أبرز أفضل العروض', 'حدث المخزون باستمرار'], en: ['Highlight best deals', 'Update stock regularly'] },
    },
  ],
  sports: [
    {
      id: 'sports-new-gear',
      title: { ar: 'معدات رياضية جديدة', en: 'New Sports Gear' },
      template: {
        ar: '💪 جديد للرياضيين!\n\n[اسم المنتج]\n\n⚡ المميزات:\n• [ميزة 1]\n• [ميزة 2]\n• [ميزة 3]\n\n🏃 مثالي لـ: [نوع الرياضة]\n💰 السعر: [السعر] ريال\n\n#رياضة #لياقة #تمارين',
        en: '💪 New for Athletes!\n\n[Product Name]\n\n⚡ Features:\n• [Feature 1]\n• [Feature 2]\n• [Feature 3]\n\n🏃 Perfect for: [Sport Type]\n💰 Price: [Price] SAR\n\n#Sports #Fitness #Workout',
      },
      type: 'product_announcement',
      platform: 'instagram',
      tips: { ar: ['أظهر المنتج أثناء الاستخدام', 'اذكر المقاسات المتوفرة'], en: ['Show product in use', 'Mention available sizes'] },
    },
    {
      id: 'sports-workout',
      title: { ar: 'تمرين اليوم', en: 'Workout of the Day' },
      template: {
        ar: '🏋️ تمرين اليوم: [نوع التمرين]\n\n💪 التمارين:\n1. [تمرين 1] - [التكرارات]\n2. [تمرين 2] - [التكرارات]\n3. [تمرين 3] - [التكرارات]\n\n⏱️ المدة: [الوقت] دقيقة\n🔥 السعرات: ~[العدد]\n\nجربه وأخبرنا! 💬\n\n#تمارين #لياقة #صحة',
        en: '🏋️ Workout of the Day: [Workout Type]\n\n💪 Exercises:\n1. [Exercise 1] - [Reps]\n2. [Exercise 2] - [Reps]\n3. [Exercise 3] - [Reps]\n\n⏱️ Duration: [Time] min\n🔥 Calories: ~[Number]\n\nTry it and let us know! 💬\n\n#Workout #Fitness #Health',
      },
      type: 'educational',
      platform: 'tiktok',
      tips: { ar: ['صور كل تمرين بوضوح', 'أضف موسيقى حماسية'], en: ['Film each exercise clearly', 'Add energetic music'] },
    },
    {
      id: 'sports-challenge',
      title: { ar: 'تحدي رياضي', en: 'Fitness Challenge' },
      template: {
        ar: '🎯 تحدي [اسم التحدي]!\n\n📅 المدة: [عدد] أيام\n\n✅ القواعد:\n1. [قاعدة 1]\n2. [قاعدة 2]\n3. [قاعدة 3]\n\n🏆 الجائزة: [الجائزة]\n\nشارك بـ #[هاشتاق_التحدي]\n\n#تحدي #رياضة #لياقة',
        en: '🎯 [Challenge Name] Challenge!\n\n📅 Duration: [Number] days\n\n✅ Rules:\n1. [Rule 1]\n2. [Rule 2]\n3. [Rule 3]\n\n🏆 Prize: [Prize]\n\nJoin with #[ChallengeHashtag]\n\n#Challenge #Sports #Fitness',
      },
      type: 'engagement',
      platform: 'tiktok',
      tips: { ar: ['اجعل التحدي قابل للتحقيق', 'شارك تقدم المشاركين'], en: ['Make challenge achievable', 'Share participant progress'] },
    },
  ],
  kids: [
    {
      id: 'kids-new-toys',
      title: { ar: 'ألعاب جديدة', en: 'New Toys' },
      template: {
        ar: '🧸 وصلت ألعاب جديدة!\n\n[اسم اللعبة]\n\n✨ المميزات:\n• [ميزة 1]\n• [ميزة 2]\n• آمنة للأطفال\n\n👶 العمر المناسب: [العمر]+\n💰 السعر: [السعر] ريال\n\n#ألعاب_أطفال #هدايا #أطفال',
        en: '🧸 New Toys Arrived!\n\n[Toy Name]\n\n✨ Features:\n• [Feature 1]\n• [Feature 2]\n• Child-safe\n\n👶 Suitable age: [Age]+\n💰 Price: [Price] SAR\n\n#KidsToys #Gifts #Children',
      },
      type: 'product_announcement',
      platform: 'instagram',
      tips: { ar: ['أظهر الأطفال يلعبون بها', 'اذكر معايير السلامة'], en: ['Show kids playing with it', 'Mention safety standards'] },
    },
    {
      id: 'kids-back-to-school',
      title: { ar: 'العودة للمدارس', en: 'Back to School' },
      template: {
        ar: '📚 استعدوا للمدارس!\n\n🎒 تشكيلة العودة للمدارس:\n• حقائب مدرسية\n• أدوات مكتبية\n• ملابس مدرسية\n\n💰 عروض خاصة تصل إلى [النسبة]%\n\n🛒 تسوقوا الآن!\n\n#العودة_للمدارس #مدارس #أطفال',
        en: '📚 Get Ready for School!\n\n🎒 Back to School Collection:\n• School bags\n• Stationery\n• School uniforms\n\n💰 Special offers up to [Percentage]%\n\n🛒 Shop now!\n\n#BackToSchool #School #Kids',
      },
      type: 'seasonal',
      platform: 'general',
      tips: { ar: ['ابدأ قبل المدارس بشهر', 'قدم باقات كاملة'], en: ['Start a month before school', 'Offer complete bundles'] },
    },
    {
      id: 'kids-activity',
      title: { ar: 'نشاط للأطفال', en: 'Kids Activity' },
      template: {
        ar: '🎨 نشاط اليوم للأطفال!\n\n[اسم النشاط]\n\n📝 المطلوب:\n• [أداة 1]\n• [أداة 2]\n• [أداة 3]\n\n👇 الخطوات:\n1. [خطوة 1]\n2. [خطوة 2]\n3. [خطوة 3]\n\nشاركونا صور أطفالكم! 📸\n\n#أنشطة_أطفال #تعليم #إبداع',
        en: '🎨 Today\'s Kids Activity!\n\n[Activity Name]\n\n📝 You\'ll need:\n• [Item 1]\n• [Item 2]\n• [Item 3]\n\n👇 Steps:\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\nShare your kids\' photos! 📸\n\n#KidsActivities #Learning #Creative',
      },
      type: 'engagement',
      platform: 'instagram',
      tips: { ar: ['اختر أنشطة سهلة وآمنة', 'أضف فيديو توضيحي'], en: ['Choose easy and safe activities', 'Add tutorial video'] },
    },
  ],
  general: [
    {
      id: 'general-new-product',
      title: { ar: 'منتج جديد', en: 'New Product' },
      template: {
        ar: '🆕 جديد في المتجر!\n\n[اسم المنتج]\n\n✨ المميزات:\n• [ميزة 1]\n• [ميزة 2]\n• [ميزة 3]\n\n💰 السعر: [السعر] ريال\n🚚 شحن سريع\n\n🛒 اطلب الآن!\n\n#جديد #تسوق #منتجات',
        en: '🆕 New in Store!\n\n[Product Name]\n\n✨ Features:\n• [Feature 1]\n• [Feature 2]\n• [Feature 3]\n\n💰 Price: [Price] SAR\n🚚 Fast shipping\n\n🛒 Order now!\n\n#New #Shopping #Products',
      },
      type: 'product_announcement',
      platform: 'general',
      tips: { ar: ['استخدم صور احترافية', 'اذكر المميزات الفريدة'], en: ['Use professional photos', 'Mention unique features'] },
    },
    {
      id: 'general-sale',
      title: { ar: 'عرض خاص', en: 'Special Offer' },
      template: {
        ar: '🎉 عرض خاص!\n\nخصم [النسبة]% على [المنتجات]\n\n⏰ العرض ساري حتى [التاريخ]\n\n✅ استخدم كود: [الكود]\n\n🛍️ لا تفوت الفرصة!\n\n#عروض #خصومات #تسوق',
        en: '🎉 Special Offer!\n\n[Percentage]% off on [Products]\n\n⏰ Valid until [Date]\n\n✅ Use code: [CODE]\n\n🛍️ Don\'t miss out!\n\n#Offers #Discounts #Shopping',
      },
      type: 'promotion',
      platform: 'general',
      tips: { ar: ['حدد مدة العرض', 'اجعل الكود سهل التذكر'], en: ['Set offer duration', 'Make code easy to remember'] },
    },
    {
      id: 'general-thank-you',
      title: { ar: 'شكر العملاء', en: 'Customer Appreciation' },
      template: {
        ar: '💝 شكراً لكم!\n\nوصلنا [العدد] طلب هذا الشهر!\n\n🙏 نشكركم على ثقتكم\n\n🎁 هدية خاصة: خصم [النسبة]% على طلبكم القادم\nالكود: [الكود]\n\n#شكراً #عملاؤنا #تقدير',
        en: '💝 Thank You!\n\nWe reached [Number] orders this month!\n\n🙏 Thank you for your trust\n\n🎁 Special gift: [Percentage]% off your next order\nCode: [CODE]\n\n#ThankYou #Customers #Appreciation',
      },
      type: 'engagement',
      platform: 'instagram',
      tips: { ar: ['شارك إنجازات حقيقية', 'قدم مكافأة حقيقية'], en: ['Share real achievements', 'Offer real reward'] },
    },
    {
      id: 'general-behind-scenes',
      title: { ar: 'خلف الكواليس', en: 'Behind the Scenes' },
      template: {
        ar: '👀 خلف الكواليس!\n\n[وصف ما يحدث]\n\n🏭 هكذا نجهز طلباتكم:\n1. [خطوة 1]\n2. [خطوة 2]\n3. [خطوة 3]\n\n💪 فريقنا يعمل بجد لخدمتكم!\n\n#خلف_الكواليس #فريقنا #عملنا',
        en: '👀 Behind the Scenes!\n\n[Description of what\'s happening]\n\n🏭 How we prepare your orders:\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\n💪 Our team works hard to serve you!\n\n#BehindTheScenes #OurTeam #OurWork',
      },
      type: 'educational',
      platform: 'tiktok',
      tips: { ar: ['أظهر الفريق الحقيقي', 'كن صادقاً وعفوياً'], en: ['Show the real team', 'Be authentic and spontaneous'] },
    },
    {
      id: 'general-national-day',
      title: { ar: 'اليوم الوطني', en: 'National Day' },
      template: {
        ar: '🇸🇦 اليوم الوطني السعودي!\n\nكل عام والوطن بخير 💚\n\n🎉 بهذه المناسبة:\nخصم [النسبة]% على جميع المنتجات\n\n⏰ العرض ليوم واحد فقط!\n\n#اليوم_الوطني #السعودية #وطني',
        en: '🇸🇦 Saudi National Day!\n\nHappy National Day 💚\n\n🎉 On this occasion:\n[Percentage]% off all products\n\n⏰ One day only!\n\n#NationalDay #SaudiArabia #Celebration',
      },
      type: 'seasonal',
      platform: 'general',
      tips: { ar: ['استخدم الألوان الوطنية', 'شارك قبل اليوم بأسبوع'], en: ['Use national colors', 'Share a week before'] },
    },
  ],
};


/**
 * Gets content ideas for a specific store category.
 * Requirements: 14.1, 14.5
 */
export function getContentIdeas(category: StoreCategory, language: 'ar' | 'en'): LocalizedContentIdeasResult {
  const templates = CONTENT_TEMPLATES[category] || CONTENT_TEMPLATES.general;
  
  const localizedIdeas: LocalizedContentIdea[] = templates.map(idea => ({
    id: idea.id,
    title: idea.title[language],
    template: idea.template[language],
    type: idea.type,
    platform: idea.platform,
    tips: idea.tips[language],
  }));

  const byType: Record<ContentType, LocalizedContentIdea[]> = {
    product_announcement: [],
    promotion: [],
    seasonal: [],
    engagement: [],
    educational: [],
  };

  const byPlatform: Record<Platform, LocalizedContentIdea[]> = {
    instagram: [],
    twitter: [],
    tiktok: [],
    snapchat: [],
    general: [],
  };

  for (const idea of localizedIdeas) {
    byType[idea.type].push(idea);
    byPlatform[idea.platform].push(idea);
  }

  return { ideas: localizedIdeas, byType, byPlatform };
}

/** Gets all available store categories with labels. */
export function getStoreCategories(language: 'ar' | 'en'): Array<{ value: StoreCategory; label: string }> {
  return Object.entries(STORE_CATEGORY_LABELS).map(([value, labels]) => ({
    value: value as StoreCategory,
    label: labels[language],
  }));
}

/** Gets content type label for display. */
export function getContentTypeLabel(type: ContentType, language: 'ar' | 'en'): string {
  return CONTENT_TYPE_LABELS[type][language];
}

/** Gets platform label for display. */
export function getPlatformLabel(platform: Platform, language: 'ar' | 'en'): string {
  return PLATFORM_LABELS[platform][language];
}

/** Gets all content types with labels. */
export function getContentTypes(language: 'ar' | 'en'): Array<{ value: ContentType; label: string }> {
  return Object.entries(CONTENT_TYPE_LABELS).map(([value, labels]) => ({
    value: value as ContentType,
    label: labels[language],
  }));
}

/** Gets all platforms with labels. */
export function getPlatforms(language: 'ar' | 'en'): Array<{ value: Platform; label: string }> {
  return Object.entries(PLATFORM_LABELS).map(([value, labels]) => ({
    value: value as Platform,
    label: labels[language],
  }));
}
