/**
 * Deduplication Tests
 * 
 * اختبارات نظام منع التكرار
 */

import { describe, it, expect } from '@jest/globals';
import {
  checkTopicDuplication,
  filterDuplicateTopics,
} from '../core/deduplication';
import { extractKeywords } from '../utils/similarity';
import type { ExistingArticleInfo, ExaSearchResult } from '../types';

describe('Deduplication System', () => {
  describe('checkTopicDuplication', () => {
    const existingArticles: ExistingArticleInfo[] = [
      {
        title: 'E-commerce Marketing Strategies for 2025',
        keywords: extractKeywords('E-commerce Marketing Strategies for 2025'),
        urls: ['https://example.com/marketing-2025'],
      },
      {
        title: 'Dropshipping Success Guide',
        keywords: extractKeywords('Dropshipping Success Guide'),
        urls: ['https://example.com/dropshipping'],
      },
    ];

    it('should detect exact URL match as duplicate', () => {
      const topic = {
        title: 'Different Title',
        url: 'https://example.com/marketing-2025',
      };

      const result = checkTopicDuplication(topic, existingArticles);

      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBe(1.0);
    });

    it('should detect similar titles as duplicate', () => {
      const topic = {
        title: 'E-commerce Marketing Strategies 2025',
        url: 'https://example.com/new-url',
      };

      const result = checkTopicDuplication(topic, existingArticles);

      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBeGreaterThan(0.35);
    });

    it('should not detect different topics as duplicate', () => {
      const topic = {
        title: 'Amazon FBA Optimization Tips',
        url: 'https://example.com/fba',
      };

      const result = checkTopicDuplication(topic, existingArticles);

      expect(result.isDuplicate).toBe(false);
      expect(result.similarity).toBeLessThan(0.35);
    });
  });

  describe('filterDuplicateTopics', () => {
    const existingArticles: ExistingArticleInfo[] = [
      {
        title: 'E-commerce Marketing Strategies',
        keywords: extractKeywords('E-commerce Marketing Strategies'),
        urls: [],
      },
    ];

    const searchResults: ExaSearchResult[] = [
      {
        title: 'E-commerce Marketing Strategies 2025',
        url: 'https://example.com/1',
        text: 'Content about marketing',
        publishedDate: '2025-01-01',
        score: 0.9,
      },
      {
        title: 'Amazon FBA Tips',
        url: 'https://example.com/2',
        text: 'Content about FBA',
        publishedDate: '2025-01-01',
        score: 0.8,
      },
    ];

    it('should filter out duplicate topics', () => {
      const result = filterDuplicateTopics(searchResults, existingArticles);

      expect(result.filtered.length).toBe(1);
      expect(result.filtered[0].title).toBe('Amazon FBA Tips');
      expect(result.skipped.length).toBe(1);
    });

    it('should return all topics if no duplicates', () => {
      const result = filterDuplicateTopics(searchResults, []);

      expect(result.filtered.length).toBe(2);
      expect(result.skipped.length).toBe(0);
    });
  });
});
