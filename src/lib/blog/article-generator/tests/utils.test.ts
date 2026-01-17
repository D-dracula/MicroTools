/**
 * Utilities Tests
 * 
 * اختبارات الوظائف المساعدة
 */

import { describe, it, expect } from '@jest/globals';
import {
  extractKeywords,
  calculateJaccardSimilarity,
  calculateNgramSimilarity,
  calculateRecencyScore,
  cleanArticleContent,
  cleanTitle,
  validateContentLength,
} from '../utils';

describe('Similarity Utilities', () => {
  describe('extractKeywords', () => {
    it('should extract keywords and remove stop words', () => {
      const text = 'The best e-commerce marketing strategies for online sellers';
      const keywords = extractKeywords(text);

      expect(keywords).toContain('ecommerce');
      expect(keywords).toContain('marketing');
      expect(keywords).toContain('strategies');
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('for');
    });
  });

  describe('calculateJaccardSimilarity', () => {
    it('should calculate correct similarity for identical sets', () => {
      const keywords1 = ['ecommerce', 'marketing', 'strategies'];
      const keywords2 = ['ecommerce', 'marketing', 'strategies'];

      const similarity = calculateJaccardSimilarity(keywords1, keywords2);

      expect(similarity).toBe(1.0);
    });

    it('should calculate correct similarity for different sets', () => {
      const keywords1 = ['ecommerce', 'marketing'];
      const keywords2 = ['dropshipping', 'logistics'];

      const similarity = calculateJaccardSimilarity(keywords1, keywords2);

      expect(similarity).toBe(0);
    });

    it('should calculate correct similarity for partially overlapping sets', () => {
      const keywords1 = ['ecommerce', 'marketing', 'strategies'];
      const keywords2 = ['ecommerce', 'dropshipping', 'strategies'];

      const similarity = calculateJaccardSimilarity(keywords1, keywords2);

      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });
  });

  describe('calculateNgramSimilarity', () => {
    it('should calculate high similarity for similar phrases', () => {
      const text1 = 'E-commerce marketing strategies';
      const text2 = 'E-commerce marketing tactics';

      const similarity = calculateNgramSimilarity(text1, text2);

      expect(similarity).toBeGreaterThan(0.5);
    });
  });
});

describe('Scoring Utilities', () => {
  describe('calculateRecencyScore', () => {
    it('should return 1.0 for today', () => {
      const today = new Date().toISOString();
      const score = calculateRecencyScore(today);

      expect(score).toBe(1.0);
    });

    it('should return lower score for older dates', () => {
      const oldDate = '2024-01-01';
      const score = calculateRecencyScore(oldDate);

      expect(score).toBeLessThan(0.5);
    });

    it('should return 0.5 for invalid dates', () => {
      const score = calculateRecencyScore('invalid-date');

      expect(score).toBe(0.5);
    });
  });
});

describe('Content Cleaner Utilities', () => {
  describe('cleanArticleContent', () => {
    it('should remove word count markers', () => {
      const text = 'Introduction (150-200 words)\n\nContent here';
      const cleaned = cleanArticleContent(text);

      expect(cleaned).not.toContain('(150-200 words)');
      expect(cleaned).toContain('Introduction');
    });

    it('should remove section headers', () => {
      const text = 'Section 1: Introduction\n\nContent here';
      const cleaned = cleanArticleContent(text);

      expect(cleaned).not.toContain('Section 1:');
      expect(cleaned).toContain('Introduction');
    });
  });

  describe('cleanTitle', () => {
    it('should remove quotes and extra spaces', () => {
      const title = '  "E-commerce  Marketing"  ';
      const cleaned = cleanTitle(title);

      expect(cleaned).toBe('E-commerce Marketing');
    });
  });
});

describe('Validation Utilities', () => {
  describe('validateContentLength', () => {
    it('should return true for content with enough words', () => {
      const content = 'This is a test content with more than ten words in it.';
      const isValid = validateContentLength(content, 10);

      expect(isValid).toBe(true);
    });

    it('should return false for content with insufficient words', () => {
      const content = 'Short content';
      const isValid = validateContentLength(content, 10);

      expect(isValid).toBe(false);
    });
  });
});
