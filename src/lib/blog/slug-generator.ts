/**
 * Generate SEO-friendly slugs from article titles
 * 
 * Requirements: 5.5
 * - Lowercase
 * - Only alphanumeric characters and hyphens
 * - URL-safe
 */

/**
 * Generate a URL-safe slug from a title
 * 
 * @param title - The article title
 * @returns A URL-safe slug (lowercase, alphanumeric + hyphens only)
 * 
 * @example
 * generateSlug("How to Increase Sales in 2024") // "how-to-increase-sales-in-2024"
 * generateSlug("E-commerce Tips & Tricks!") // "e-commerce-tips-tricks"
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Replace special characters with spaces
    .replace(/[^\w\s-]/g, ' ')
    // Replace multiple spaces/hyphens with single hyphen
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug by appending a number if needed
 * 
 * @param title - The article title
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 * 
 * @example
 * generateUniqueSlug("My Article", ["my-article"]) // "my-article-2"
 */
export function generateUniqueSlug(
  title: string,
  existingSlugs: string[]
): string {
  const baseSlug = generateSlug(title);
  
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
}

/**
 * Generate a unique slug by checking existence asynchronously
 * 
 * @param baseSlug - The base slug to make unique
 * @param checkExists - Async function that returns true if slug exists
 * @returns A unique slug
 * 
 * @example
 * await generateUniqueSlugAsync("my-article", async (slug) => {
 *   const exists = await db.checkSlugExists(slug);
 *   return exists;
 * })
 */
export async function generateUniqueSlugAsync(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  // Check if base slug is available
  const baseExists = await checkExists(baseSlug);
  if (!baseExists) {
    return baseSlug;
  }
  
  // Try with incrementing numbers
  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (await checkExists(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
}
