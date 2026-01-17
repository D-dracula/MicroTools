# Design Document: Micro-Tools Website

## Overview

موقع أدوات مصغرة للتجارة الإلكترونية مبني باستخدام Next.js 14 (App Router) مع Backend احترافي. يتضمن:
- **Frontend**: Next.js 14 + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js (Email/Password + Google OAuth)
- **Internationalization**: next-intl (Arabic RTL + English LTR)

### Key Design Decisions

1. **Next.js API Routes** - Full-stack في مشروع واحد، سهولة النشر
2. **Prisma ORM** - Type-safe database queries، migrations سهلة
3. **NextAuth.js** - حل مصادقة متكامل مع Next.js
4. **PostgreSQL** - قاعدة بيانات موثوقة وقابلة للتوسع
5. **Zod** - التحقق من صحة البيانات في الـ API

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 14 App Router                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Pages (Server Components + Client Components)           │   │
│  │  - Landing Page                                          │   │
│  │  - Tool Pages                                            │   │
│  │  - Auth Pages (Login/Register)                           │   │
│  │  - Dashboard (History)                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  API Layer (Next.js API Routes)                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/auth/*     - NextAuth.js endpoints                 │   │
│  │  /api/calculations - CRUD for calculation history        │   │
│  │  /api/analytics  - Usage tracking                        │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                     │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │  Prisma ORM     │→ │  PostgreSQL     │                      │
│  │  (Type-safe)    │  │  Database       │                      │
│  └─────────────────┘  └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Directory Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # Locale layout (RTL/LTR)
│   │   ├── page.tsx                # Landing page
│   │   ├── auth/
│   │   │   ├── login/page.tsx      # Login page
│   │   │   └── register/page.tsx   # Register page
│   │   ├── dashboard/
│   │   │   └── page.tsx            # User dashboard (history)
│   │   └── tools/
│   │       └── [slug]/page.tsx     # Dynamic tool page
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth
│   │   ├── calculations/
│   │   │   ├── route.ts            # GET all, POST new
│   │   │   └── [id]/route.ts       # GET one, DELETE
│   │   └── analytics/route.ts      # Usage tracking
│   ├── layout.tsx                  # Root layout
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn/ui
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── locale-switcher.tsx
│   │   ├── theme-switcher.tsx
│   │   └── user-menu.tsx           # Auth dropdown
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   └── tools/
│       └── profit-margin-calculator.tsx
├── lib/
│   ├── prisma.ts                   # Prisma client
│   ├── auth.ts                     # NextAuth config
│   ├── validations/                # Zod schemas
│   │   ├── auth.ts
│   │   └── calculations.ts
│   └── utils.ts
├── i18n/
│   ├── routing.ts
│   └── request.ts
├── messages/
│   ├── ar.json
│   └── en.json
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── migrations/
└── middleware.ts
```

### Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?   // null for OAuth users
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts      Account[]
  sessions      Session[]
  calculations  Calculation[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Calculation {
  id        String   @id @default(cuid())
  userId    String
  toolSlug  String   // e.g., "profit-margin-calculator"
  inputs    Json     // { costPrice: 100, sellingPrice: 150 }
  outputs   Json     // { profit: 50, margin: 33.33, markup: 50 }
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([toolSlug])
}

model ToolUsage {
  id        String   @id @default(cuid())
  toolSlug  String
  userType  String   // "guest" | "authenticated"
  createdAt DateTime @default(now())
  
  @@index([toolSlug])
  @@index([createdAt])
}

model CustomAd {
  id          String    @id @default(cuid())
  placement   String    // "landing-hero", "tool-sidebar", "tool-bottom"
  priority    Int       @default(0)
  isActive    Boolean   @default(true)
  
  // Content (bilingual)
  titleAr     String
  titleEn     String
  descriptionAr String?
  descriptionEn String?
  imageUrl    String
  linkUrl     String
  
  // Scheduling
  startDate   DateTime?
  endDate     DateTime?
  
  // Analytics
  impressions Int       @default(0)
  clicks      Int       @default(0)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([placement])
  @@index([isActive])
}
```


### Core Interfaces

```typescript
// ============ Authentication Types ============
interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface Session {
  user: User;
  expires: string;
}

// ============ Calculation Types ============
interface ProfitCalculationInputs {
  costPrice: number;
  sellingPrice: number;
}

interface ProfitCalculationOutputs {
  profit: number;
  profitMargin: number;  // percentage
  markup: number;        // percentage
  isLoss: boolean;
}

interface Calculation {
  id: string;
  userId: string;
  toolSlug: string;
  inputs: ProfitCalculationInputs;
  outputs: ProfitCalculationOutputs;
  createdAt: Date;
}

// ============ API Response Types ============
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============ Tool Types ============
interface Tool {
  slug: string;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}

// ============ Analytics Types ============
interface ToolUsageStats {
  toolSlug: string;
  totalUsage: number;
  guestUsage: number;
  authenticatedUsage: number;
}

// ============ Locale Types ============
type Locale = 'ar' | 'en';

interface LocaleConfig {
  locale: Locale;
  direction: 'rtl' | 'ltr';
}

// ============ Advertising Types ============
type AdPlacement = 'landing-hero' | 'tool-sidebar' | 'tool-bottom';

interface CustomAd {
  id: string;
  placement: AdPlacement;
  priority: number;
  isActive: boolean;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl: string;
  linkUrl: string;
  startDate?: Date;
  endDate?: Date;
  impressions: number;
  clicks: number;
}

interface AdSlotProps {
  placement: AdPlacement;
  locale: Locale;
  fallbackToAdSense?: boolean;
}
```

### API Endpoints Specification

#### Authentication (NextAuth.js)
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/register` - Custom registration endpoint

#### Calculations
```typescript
// GET /api/calculations
// Query params: page, pageSize, toolSlug
// Response: PaginatedResponse<Calculation>

// POST /api/calculations
// Body: { toolSlug: string, inputs: object, outputs: object }
// Response: ApiResponse<Calculation>

// GET /api/calculations/[id]
// Response: ApiResponse<Calculation>

// DELETE /api/calculations/[id]
// Response: ApiResponse<{ deleted: boolean }>
```

#### Analytics
```typescript
// POST /api/analytics/track
// Body: { toolSlug: string, userType: 'guest' | 'authenticated' }
// Response: ApiResponse<{ tracked: boolean }>

// GET /api/analytics/stats (Admin only)
// Response: ApiResponse<ToolUsageStats[]>
```

#### Advertising
```typescript
// GET /api/ads?placement=landing-hero
// Response: ApiResponse<CustomAd | null>

// POST /api/ads (Admin only)
// Body: CustomAd (without id, impressions, clicks)
// Response: ApiResponse<CustomAd>

// PUT /api/ads/[id] (Admin only)
// Body: Partial<CustomAd>
// Response: ApiResponse<CustomAd>

// DELETE /api/ads/[id] (Admin only)
// Response: ApiResponse<{ deleted: boolean }>

// POST /api/ads/[id]/impression
// Response: ApiResponse<{ recorded: boolean }>

// POST /api/ads/[id]/click
// Response: ApiResponse<{ recorded: boolean }>
```

### Validation Schemas (Zod)

```typescript
// Auth validation
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  name: z.string().min(2).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Calculation validation
const profitCalculationSchema = z.object({
  toolSlug: z.literal('profit-margin-calculator'),
  inputs: z.object({
    costPrice: z.number().positive(),
    sellingPrice: z.number().positive(),
  }),
  outputs: z.object({
    profit: z.number(),
    profitMargin: z.number(),
    markup: z.number(),
    isLoss: z.boolean(),
  }),
});
```

## Data Models

### Translation Structure

```json
// messages/ar.json
{
  "common": {
    "siteName": "أدوات التجارة",
    "siteDescription": "أدوات مجانية لأصحاب المتاجر الإلكترونية",
    "backToHome": "العودة للرئيسية",
    "save": "حفظ",
    "delete": "حذف",
    "loading": "جاري التحميل..."
  },
  "auth": {
    "login": "تسجيل الدخول",
    "register": "إنشاء حساب",
    "logout": "تسجيل الخروج",
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور",
    "name": "الاسم",
    "loginWithGoogle": "تسجيل الدخول بـ Google",
    "noAccount": "ليس لديك حساب؟",
    "hasAccount": "لديك حساب بالفعل؟",
    "invalidCredentials": "بيانات الدخول غير صحيحة",
    "passwordRequirements": "8 أحرف على الأقل، حرف كبير، حرف صغير، ورقم"
  },
  "dashboard": {
    "title": "لوحة التحكم",
    "history": "سجل الحسابات",
    "noCalculations": "لا توجد حسابات محفوظة",
    "savedOn": "تم الحفظ في"
  },
  "landing": {
    "heroTitle": "أدوات ذكية للتجارة الإلكترونية",
    "heroDescription": "مجموعة من الأدوات المجانية لمساعدتك في إدارة متجرك",
    "toolsTitle": "الأدوات المتاحة"
  },
  "tools": {
    "profitMarginCalculator": {
      "title": "حاسبة هامش الربح",
      "description": "احسب هامش الربح ونسبة الربح بسهولة",
      "costPrice": "سعر التكلفة",
      "sellingPrice": "سعر البيع",
      "profit": "الربح",
      "profitMargin": "هامش الربح",
      "markup": "نسبة الزيادة",
      "loss": "خسارة",
      "enterValidNumbers": "أدخل أرقاماً صحيحة",
      "saveCalculation": "حفظ الحساب",
      "loginToSave": "سجل دخولك لحفظ الحسابات"
    }
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Profit Calculation Mathematical Correctness

*For any* valid cost price (c > 0) and selling price (s > 0), the calculator SHALL produce:
- profit = s - c
- profitMargin = ((s - c) / s) × 100
- markup = ((s - c) / c) × 100
- isLoss = (s < c)

**Validates: Requirements 6.3, 6.4, 6.5, 6.6**

### Property 2: Input Validation Rejects Invalid Values

*For any* input value that is:
- Not a number (NaN, strings, undefined)
- Zero or negative
- Empty string

The Profit_Margin_Calculator SHALL reject the input and not perform calculations.

**Validates: Requirements 6.7**

### Property 3: Tool Accessibility Without Authentication

*For any* tool page and any user (guest or authenticated), the tool SHALL be fully functional without requiring login. Authentication status SHALL NOT affect tool functionality.

**Validates: Requirements 5.4, 5.5, 7.9**

### Property 4: Calculation History User Isolation

*For any* saved calculation, it SHALL only be visible to and deletable by the user who created it. No user SHALL be able to access another user's calculations.

**Validates: Requirements 8.5, 8.6**

### Property 5: API Request Validation

*For any* API request to protected endpoints:
- Without valid authentication → 401 Unauthorized
- With invalid request body → 400 Bad Request
- With valid request → Appropriate success response

**Validates: Requirements 9.2, 9.3, 9.7**

### Property 6: API Response Structure Consistency

*For any* API response, the structure SHALL match:
```typescript
{ success: boolean, data?: T, error?: string }
```
Where `success: true` implies `data` is present, and `success: false` implies `error` is present.

**Validates: Requirements 9.4, 9.5**

### Property 7: Password Security

*For any* user password, the stored value in the database SHALL:
- Not equal the original password
- Be a valid bcrypt hash
- Be verifiable against the original password using bcrypt.compare()

**Validates: Requirements 7.8**

### Property 8: Translation Completeness

*For any* translation key used in the application, both Arabic (ar) and English (en) locale files SHALL contain a valid non-empty string value.

**Validates: Requirements 2.1**

### Property 9: Calculation Storage Integrity

*For any* calculation saved to the database, it SHALL contain:
- Valid toolSlug matching an existing tool
- inputs object with all required fields for that tool
- outputs object with all calculated values
- Valid userId referencing an existing user
- createdAt timestamp

**Validates: Requirements 8.3**

### Property 10: Custom Ad Scheduling

*For any* Custom_Ad with startDate and/or endDate:
- If current date < startDate → Ad SHALL NOT be displayed
- If current date > endDate → Ad SHALL NOT be displayed
- If startDate <= current date <= endDate → Ad SHALL be displayed (if active)

**Validates: Requirements 15.6**

### Property 11: Ad Priority Resolution

*For any* Ad_Slot with multiple eligible ads (Custom_Ad and AdSense):
- Custom_Ad with highest priority SHALL be displayed first
- If no active Custom_Ad exists → AdSense SHALL be displayed as fallback

**Validates: Requirements 15.4**

## Error Handling

### Client-Side Errors
- Invalid input: Display inline validation message
- Network failure: Show toast notification with retry option
- Session expired: Redirect to login with return URL

### API Errors
| Status Code | Scenario | Response |
|-------------|----------|----------|
| 400 | Invalid request body | `{ success: false, error: "Validation error details" }` |
| 401 | Unauthenticated | `{ success: false, error: "Authentication required" }` |
| 403 | Unauthorized | `{ success: false, error: "Access denied" }` |
| 404 | Resource not found | `{ success: false, error: "Resource not found" }` |
| 429 | Rate limited | `{ success: false, error: "Too many requests" }` |
| 500 | Server error | `{ success: false, error: "Internal server error" }` |

## Testing Strategy

### Unit Tests
- Calculator logic functions (profit, margin, markup calculations)
- Validation functions (input validation, auth validation)
- Utility functions

### Property-Based Tests (using fast-check)
- **Property 1**: Generate random positive numbers, verify calculation formulas
- **Property 2**: Generate invalid inputs, verify rejection
- **Property 5**: Generate various request scenarios, verify responses
- **Property 6**: Generate API responses, verify structure
- **Property 7**: Generate passwords, verify hashing

### Integration Tests
- API endpoint tests with database
- Authentication flow tests
- Calculation CRUD operations

### E2E Tests (Playwright)
- Tool usage flow (guest user)
- Registration and login flow
- Save calculation flow (authenticated user)
- Locale switching
- Theme switching

### Test Configuration
- Property tests: Minimum 100 iterations per property
- Each property test tagged with: `Feature: micro-tools-website, Property N: [description]`
