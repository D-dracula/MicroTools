/**
 * Calculate reading time from article content
 * 
 * Requirements: 5.4
 * - Reading time = ceil(wordCount / 200) minutes
 * - Average reading speed: 200 words per minute
 */

/**
 * Count words in text content
 * 
 * @param text - The text to count words in
 * @returns Number of words
 */
function countWords(text: string): number {
  // Remove HTML tags if present
  const plainText = text.replace(/<[^>]*>/g, ' ');
  
  // Split by whitespace and filter empty strings
  const words = plainText
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  return words.length;
}

/**
 * Calculate reading time in minutes
 * 
 * @param content - The article content (can include HTML)
 * @param wordsPerMinute - Average reading speed (default: 200)
 * @returns Reading time in minutes (minimum 1)
 * 
 * @example
 * calculateReadingTime("Lorem ipsum...") // 5 (for ~1000 words)
 */
export function calculateReadingTime(
  content: string,
  wordsPerMinute: number = 200
): number {
  const wordCount = countWords(content);
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  // Minimum 1 minute
  return Math.max(1, minutes);
}

/**
 * Get word count from content
 * 
 * @param content - The article content
 * @returns Number of words
 */
export function getWordCount(content: string): number {
  return countWords(content);
}
