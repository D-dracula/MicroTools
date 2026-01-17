---
inclusion: always
priority: critical
---

# 🚨 CRITICAL: Context7 Documentation-First Policy

## ⚠️ MANDATORY REQUIREMENT - NO EXCEPTIONS

**Before writing ANY code that involves external libraries, frameworks, APIs, or SDKs, you MUST:**

1. **FIRST** - Use `resolve-library-id` from Context7 MCP server to find the correct library ID
2. **THEN** - Use `query-docs` to fetch up-to-date documentation
3. **ONLY AFTER** - Write code based on the retrieved documentation

## 🔴 This Rule Applies To:

- ✅ Any new feature implementation
- ✅ Bug fixes involving external libraries
- ✅ API integrations (Supabase, Stripe, OpenRouter, etc.)
- ✅ Framework-specific code (Next.js, React, etc.)
- ✅ Database operations and migrations
- ✅ Authentication implementations
- ✅ Third-party SDK usage
- ✅ Package configuration changes

## 📋 Required Workflow

### Step 1: Identify the Library
```
Use: resolve-library-id
Parameters:
  - libraryName: "library-name" (e.g., "supabase", "nextjs", "stripe")
  - query: "what you're trying to accomplish"
```

### Step 2: Query Documentation
```
Use: query-docs
Parameters:
  - libraryId: "/org/project" (from Step 1)
  - query: "specific feature or API you need"
```

### Step 3: Write Code
Only after receiving documentation, write code that:
- Follows the official API patterns
- Uses correct method signatures
- Implements proper error handling
- Follows best practices from docs

## 🚫 VIOLATIONS - What NOT To Do

❌ **NEVER** write code from memory without checking docs
❌ **NEVER** assume API signatures are correct
❌ **NEVER** skip documentation lookup for "simple" tasks
❌ **NEVER** use outdated patterns without verification
❌ **NEVER** guess at configuration options

## 📊 Examples

### ✅ CORRECT Approach:
```
1. User asks: "Add Stripe payment integration"
2. Agent: resolve-library-id(libraryName: "stripe", query: "payment integration checkout")
3. Agent: query-docs(libraryId: "/stripe/stripe-node", query: "create checkout session")
4. Agent: Write code based on documentation
```

### ❌ INCORRECT Approach:
```
1. User asks: "Add Stripe payment integration"
2. Agent: Immediately writes code from memory
   → May use deprecated APIs
   → May have incorrect signatures
   → May miss security best practices
```

## 🎯 Benefits of This Policy

1. **Accuracy**: Code matches current API versions
2. **Security**: Follows latest security recommendations
3. **Reliability**: Reduces bugs from outdated patterns
4. **Efficiency**: Avoids debugging incorrect implementations
5. **Maintainability**: Code follows official conventions

## 📚 Common Libraries to Query

| Library | Use Case |
|---------|----------|
| `supabase` | Database, Auth, Storage |
| `nextjs` | App Router, API Routes, Middleware |
| `react` | Hooks, Components, Patterns |
| `stripe` | Payments, Subscriptions |
| `next-auth` | Authentication |
| `prisma` | Database ORM |
| `tailwindcss` | Styling |
| `zod` | Validation |

## ⚡ Quick Reference

```typescript
// Before ANY external library code:
// 1. resolve-library-id → Get library ID
// 2. query-docs → Get current documentation
// 3. Write code → Based on docs only
```

## 🔒 Enforcement

This policy is **NON-NEGOTIABLE**. Every code generation involving external dependencies must be preceded by Context7 documentation lookup. This ensures:

- Code quality and correctness
- Up-to-date API usage
- Security compliance
- Best practice adherence

---

**Remember: Documentation First, Code Second. Always.**
