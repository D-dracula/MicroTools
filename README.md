# 🛠️ Micro-Tools - Business Utility Platform

A comprehensive collection of business utility tools for e-commerce sellers, marketers, and small business owners. Built with Next.js 16, TypeScript, and modern web technologies.

## 🌟 Features

### 📊 Financial Tools
- **Profit Margin Calculator** - Calculate profit margins and markup percentages
- **ROI Calculator** - Return on investment calculations
- **Break-even Calculator** - Find your break-even point
- **Smart Profit Audit** (AI) - Analyze sales data for profit insights

### 📈 Marketing Tools
- **UTM Builder** - Create trackable campaign URLs
- **QR Code Generator** - Generate custom QR codes
- **Ad Spend Auditor** (AI) - Optimize advertising campaigns

### 📦 Logistics Tools
- **CBM Calculator** - Calculate cubic meter for shipping
- **Dimension Converter** - Convert between measurement units
- **Inventory Forecaster** (AI) - Predict inventory needs

### 🖼️ Image Tools
- **Image Compressor** - Reduce image file sizes
- **Image Converter** - Convert between formats
- **Watermark Tool** - Add watermarks to images
- **Favicon Generator** - Create favicons from images

### 📝 Content Tools
- **Word Counter** - Count words, characters, and paragraphs
- **SEO Validator** - Check content for SEO optimization
- **Policy Generator** - Generate privacy policies and terms
- **Review Insight** (AI) - Analyze customer reviews
- **Catalog Cleaner** (AI) - Clean and optimize product catalogs

## 🚀 Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Internationalization**: next-intl (Arabic & English)
- **AI Integration**: OpenRouter API
- **Testing**: Jest with fast-check (property-based testing)
- **Animations**: Framer Motion

## 🌍 Internationalization

Full support for:
- 🇺🇸 English (en)
- 🇸🇦 Arabic (ar) with RTL layout

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/micro-tools.git
cd micro-tools
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database URL and other settings
```

4. **Set up the database**
```bash
npx prisma generate
npx prisma db push
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Configure environment variables:
  - `DATABASE_URL` - Your PostgreSQL connection string
  - `NEXTAUTH_SECRET` - Random secret for NextAuth.js
  - `NEXTAUTH_URL` - Your production URL

3. **Set up database**
- Use Vercel Postgres or external PostgreSQL service
- Run migrations: `npx prisma db push`

### Environment Variables for Production

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"
```

## 📁 Project Structure

```
micro-tools/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   └── [locale]/     # Localized pages
│   ├── components/
│   │   ├── tools/        # Tool components
│   │   │   └── shared/   # Shared AI tool components
│   │   ├── ui/           # Reusable UI components
│   │   ├── layout/       # Layout components
│   │   └── providers/    # Context providers
│   ├── lib/
│   │   ├── calculators/  # Business logic for tools
│   │   └── ai-tools/     # AI-powered tool logic
│   ├── i18n/             # Internationalization config
│   └── types/            # TypeScript type definitions
├── messages/             # Translation files (en.json, ar.json)
├── test-data/            # Test CSV files for AI tools
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint
```

## 🤖 AI Tools

The platform includes AI-powered tools that use OpenRouter API:

- **Smart Profit Audit** - Analyze sales data for profit insights
- **Ad Spend Auditor** - Optimize advertising campaigns  
- **Inventory Forecaster** - Predict inventory needs
- **Review Insight** - Analyze customer reviews
- **Catalog Cleaner** - Clean and optimize product catalogs

To use AI tools, set the `OPENROUTER_API_KEY` environment variable.

## 📊 Analytics & Tracking

- Tool usage analytics
- User behavior tracking
- Performance monitoring
- SEO optimization

## 🔒 Security

- NextAuth.js authentication
- CSRF protection
- Input validation with Zod
- Secure API endpoints
- Environment variable protection

## 🌐 SEO Features

- Server-side rendering (SSR)
- Meta tags optimization
- Structured data
- Sitemap generation
- Multi-language SEO

## 📱 Mobile Responsive

Fully responsive design that works on:
- Desktop computers
- Tablets
- Mobile phones
- All screen sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code examples

## 🚀 Live Demo

Visit the live application: [https://your-domain.vercel.app](https://your-domain.vercel.app)

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.