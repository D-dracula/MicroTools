/**
 * Topic Selection Tests
 * 
 * اختبارات نظام اختيار المواضيع
 */

import { describe, it, expect } from '@jest/globals';
import { selectBestTopic, processExaResults } from '../core/topic-selection';
import type { ExaSearchResult } from '../types';

describe('Topic Selection System', () => {
  describe('processExaResults', () => {
    it('should filter out results with insufficient content', () => {
      const results: ExaSearchResult[] = [
        {
          title: 'Valid Article',
          url: 'https://example.com/1',
          text: 'This is a long enough text with more than 100 characters to be considered valid content for processing.',
          publishedDate: '2025-01-01',
          score: 0.9,
        },
        {
          title: 'Invalid Article',
          url: 'https://example.com/2',
          text: 'Short',
          publishedDate: '2025-01-01',
          score: 0.8,
        },
      ];

      const processed = processExaResults(results);

      expect(processed.length).toBe(1);
      expect(processed[0].title).toBe('Valid Article');
    });
  });

  describe('selectBestTopic', () => {
    const results: ExaSearchResult[] = [
      {
        title: 'Recent Article',
        url: 'https://example.com/1',
        text: 'Content about e-commerce marketing strategies',
        publishedDate: new Date().toISOString(),
        score: 0.7,
      },
      {
        title: 'Old Article',
        url: 'https://example.com/2',
        text: 'Content about dropshipping',
        publishedDate: '2024-01-01',
        score: 0.9,
      },
    ];

    it('should select topic with highest combined score', () => {
      const selected = selectBestTopic(results);

      expect(selected).not.toBeNull();
      expect(selected?.title).toBe('Recent Article');
      // Recent article should win due to recency score
    });

    it('should return null for empty results', () => {
      const selected = selectBestTopic([]);

      expect(selected).toBeNull();
    });

    it('should classify category correctly', () => {
      const selected = selectBestTopic(results);

      expect(selected).not.toBeNull();
      expect(selected?.suggestedCategory).toBe('marketing');
    });
  });
});
