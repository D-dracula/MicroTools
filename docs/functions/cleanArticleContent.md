# Function Documentation: `cleanArticleContent`

## Description
The `cleanArticleContent` function is a utility designed to sanitize and clean AI-generated article content. It removes common artifacts, meta-talk, and word count markers that AI models often include in their output, ensuring a professional and polished final article.

## Implementation Details

### Function Signature
```typescript
function cleanArticleContent(text: string): string
```

### Purpose
To remove non-content text from AI-generated strings, specifically:
- Word count markers (e.g., `(150-200 words)`, `[300 words]`).
- Section markers used as instructions (e.g., `Section 1: `).
- Multiple empty lines often created after removing artifacts.

### Transformation Logic
The function applies the following regular expressions sequentially:

1. **Remove word count markers in parentheses**: `\(\d+(?:-\d+)?\s*words?\)`
2. **Remove word count markers in brackets**: `\[\d+(?:-\d+)?\s*words?\]`
3. **Remove target length markers**: `-\s*Target\s+Length:\s*\d+(?:-\d+)?\s*words?`
4. **Remove section headers**: `^Section\s+\d+:\s*` (multiline, case-insensitive)
5. **Normalize white space**: Replaces triple or more newlines with double newlines and trims leading/trailing space.

## Source Code
```typescript
function cleanArticleContent(text: string): string {
  if (!text) return text;
  
  return text
    // Remove word count markers like (150-200 words), (300 words), [Section 1: 400 words]
    .replace(/\(\d+(?:-\d+)?\s*words?\)/gi, '')
    .replace(/\[\d+(?:-\d+)?\s*words?\]/gi, '')
    .replace(/-\s*Target\s+Length:\s*\d+(?:-\d+)?\s*words?/gi, '')
    // Remove section headers that AI sometimes includes as instructions
    .replace(/^Section\s+\d+:\s*/gmi, '')
    // Remove multiple empty lines created by removals
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
```

## Usage
Used within the `generateArticle` function in `src/lib/blog/article-generator.ts` to clean the title, summary, content, metaTitle, and metaDescription fields before returning the final article object.

---
*Created on: 2026-01-17*
