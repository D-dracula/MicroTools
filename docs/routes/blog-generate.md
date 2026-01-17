# API Route: Article Generation

## Endpoint
`POST /api/blog/generate`

## Description
This endpoint is responsible for generating a full-length, SEO-optimized e-commerce article using AI. It coordinates topic search (via Exa), AI content generation (via OpenRouter), and storage (via Supabase).

## Authentication
- **Requirement**: Admin access only.
- **Method**: Checked via `getServerSession` and verified against `ADMIN_EMAILS`.

## Request Body
```json
{
  "category": "marketing", // Optional: ArticleCategory
  "topic": "Latest trends in e-commerce", // Optional: Custom topic string
  "exaResults": [...] // Optional: Pre-fetched search results
}
```

## Response
### Success (200 OK)
```json
{
  "success": true,
  "article": {
    "id": "...",
    "title": "...",
    "content": "...",
    "category": "...",
    "slug": "...",
    "thumbnailUrl": "...",
    "readingTime": 15,
    "isPublished": true,
    "createdAt": "..."
  }
}
```

### Error (400/403/500)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED | UNAUTHORIZED | NO_TOPICS_FOUND | ...",
    "message": "Detailed error message"
  }
}
```

## Internal Logic
1. **Admin Verification**: Validates the user email.
2. **Topic Selection**: If no `exaResults` are provided, it performs a search. It then selects the best unique topic using deduplication logic.
3. **AI Generation**: Calls the AI Agent to generate content based on the selected topic.
4. **Cleanup**: Sanitizes the output using `cleanArticleContent`.
5. **Storage**: Saves the generated article to the database and returns it.

---
*Created on: 2026-01-17*
