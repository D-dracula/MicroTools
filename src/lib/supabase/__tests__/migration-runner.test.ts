/**
 * Migration Runner Tests
 * 
 * Tests for the enhanced migration runner functionality
 */

import { MigrationRunner } from '../migration-runner';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock file system operations
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
  existsSync: jest.fn()
}));

import { readFileSync, readdirSync, existsSync } from 'fs';
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockReaddirSync = readdirSync as jest.MockedFunction<typeof readdirSync>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

describe('MigrationRunner', () => {
  let runner: MigrationRunner;
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      rpc: jest.fn()
    };

    mockCreateClient.mockReturnValue(mockSupabase);

    // Create runner instance
    runner = new MigrationRunner(
      'https://test.supabase.co',
      'test-service-role-key',
      'test-migrations'
    );
  });

  describe('getMigrationFiles', () => {
    it('should return migration files in order', () => {
      // Mock file system
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([
        '20260111000002_second.sql',
        '20260111000001_first.sql',
        '20260111000003_third.sql',
        'not-a-migration.txt'
      ]);

      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes('first')) return 'CREATE TABLE first();';
        if (path.includes('second')) return 'CREATE TABLE second();';
        if (path.includes('third')) return 'CREATE TABLE third();';
        return '';
      });

      const files = runner.getMigrationFiles();

      expect(files).toHaveLength(3);
      expect(files[0].name).toBe('20260111000001_first.sql');
      expect(files[1].name).toBe('20260111000002_second.sql');
      expect(files[2].name).toBe('20260111000003_third.sql');
      
      // Check checksums are calculated
      expect(files[0].checksum).toBeDefined();
      expect(files[0].timestamp).toBe('20260111000001');
    });

    it('should throw error if migrations directory does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      expect(() => runner.getMigrationFiles()).toThrow('Migrations directory not found');
    });
  });

  describe('getMigrationStatus', () => {
    it('should return correct status for migrations', async () => {
      // Mock file system
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['20260111000001_test.sql']);
      mockReadFileSync.mockReturnValue('CREATE TABLE test();');

      // Calculate the actual checksum that would be generated
      const expectedChecksum = runner['calculateChecksum']('CREATE TABLE test();');

      // Mock database response
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [{
              name: '20260111000001_test.sql',
              executed_at: '2026-01-11T10:00:00Z',
              checksum: expectedChecksum,
              execution_time_ms: 100,
              batch_id: 'batch_123'
            }],
            error: null
          })
        })
      });

      const status = await runner.getMigrationStatus();

      expect(status).toHaveLength(1);
      expect(status[0].name).toBe('20260111000001_test.sql');
      expect(status[0].status).toBe('executed');
      expect(status[0].executed_at).toBe('2026-01-11T10:00:00Z');
    });

    it('should detect checksum mismatches', async () => {
      // Mock file system
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['20260111000001_test.sql']);
      mockReadFileSync.mockReturnValue('CREATE TABLE modified();');

      // Mock database response with different checksum
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [{
              name: '20260111000001_test.sql',
              executed_at: '2026-01-11T10:00:00Z',
              checksum: 'old_checksum',
              execution_time_ms: 100
            }],
            error: null
          })
        })
      });

      const status = await runner.getMigrationStatus();

      expect(status[0].status).toBe('failed');
      expect(status[0].error_message).toContain('Checksum mismatch');
    });
  });

  describe('runMigrations', () => {
    it('should run pending migrations successfully', async () => {
      // Mock file system
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['20260111000001_test.sql']);
      mockReadFileSync.mockReturnValue('CREATE TABLE test();');

      // Mock database responses
      mockSupabase.rpc.mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [], // No executed migrations
            error: null
          })
        }),
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      const result = await runner.runMigrations({ verbose: true });

      expect(result.success).toBe(true);
      expect(result.executed).toHaveLength(1);
      expect(result.executed[0]).toBe('20260111000001_test.sql');
      expect(result.failed).toHaveLength(0);
    });

    it('should handle migration failures', async () => {
      // Mock file system
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['20260111000001_test.sql']);
      mockReadFileSync.mockReturnValue('INVALID SQL;');

      // Mock database responses
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: null, error: null }) // Initialize tables
        .mockResolvedValueOnce({ data: null, error: null }) // Initialize tables
        .mockResolvedValueOnce({ data: null, error: { message: 'SQL syntax error' } }); // Execute migration
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [], // No executed migrations
            error: null
          })
        })
      });

      const result = await runner.runMigrations();

      expect(result.success).toBe(false);
      expect(result.executed).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toBe('20260111000001_test.sql');
    });

    it('should skip already executed migrations', async () => {
      // Mock file system
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['20260111000001_test.sql']);
      mockReadFileSync.mockReturnValue('CREATE TABLE test();');

      // Calculate the actual checksum
      const expectedChecksum = runner['calculateChecksum']('CREATE TABLE test();');

      // Mock database responses - migration already executed
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [{
              name: '20260111000001_test.sql',
              executed_at: '2026-01-11T10:00:00Z',
              checksum: expectedChecksum,
              execution_time_ms: 100
            }],
            error: null
          })
        })
      });

      const result = await runner.runMigrations();

      expect(result.success).toBe(true);
      expect(result.executed).toHaveLength(0);
      expect(result.skipped).toHaveLength(0); // Already executed, not skipped
    });
  });

  describe('rollbackMigrations', () => {
    it('should rollback specified number of migrations', async () => {
      // Mock database responses
      const executedMigrations = [
        {
          name: '20260111000002_second.sql',
          executed_at: '2026-01-11T10:01:00Z',
          rollback_sql: 'DROP TABLE second;'
        },
        {
          name: '20260111000001_first.sql',
          executed_at: '2026-01-11T10:00:00Z',
          rollback_sql: 'DROP TABLE first;'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: executedMigrations,
            error: null
          })
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      mockSupabase.rpc.mockResolvedValue({ error: null });

      const result = await runner.rollbackMigrations({ count: 1 });

      expect(result.success).toBe(true);
      expect(result.rolled_back).toHaveLength(1);
      expect(result.rolled_back[0]).toBe('20260111000002_second.sql');
    });

    it('should rollback to specific target migration', async () => {
      const executedMigrations = [
        {
          name: '20260111000003_third.sql',
          executed_at: '2026-01-11T10:02:00Z',
          rollback_sql: 'DROP TABLE third;'
        },
        {
          name: '20260111000002_second.sql',
          executed_at: '2026-01-11T10:01:00Z',
          rollback_sql: 'DROP TABLE second;'
        },
        {
          name: '20260111000001_first.sql',
          executed_at: '2026-01-11T10:00:00Z',
          rollback_sql: 'DROP TABLE first;'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: executedMigrations,
            error: null
          })
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      mockSupabase.rpc.mockResolvedValue({ error: null });

      const result = await runner.rollbackMigrations({ 
        target: '20260111000002_second.sql' 
      });

      expect(result.success).toBe(true);
      expect(result.rolled_back).toHaveLength(1);
      expect(result.rolled_back[0]).toBe('20260111000003_third.sql');
    });
  });

  describe('generateRollbackSql', () => {
    it('should generate rollback SQL for CREATE TABLE', () => {
      const migrationSql = `
        CREATE TABLE public.test_table (
          id UUID PRIMARY KEY,
          name VARCHAR(255)
        );
      `;

      const rollbackSql = runner.generateRollbackSql(migrationSql);

      expect(rollbackSql).toContain('DROP TABLE IF EXISTS public.test_table CASCADE;');
    });

    it('should generate rollback SQL for CREATE INDEX', () => {
      const migrationSql = `
        CREATE INDEX idx_test_name ON public.test_table(name);
      `;

      const rollbackSql = runner.generateRollbackSql(migrationSql);

      expect(rollbackSql).toContain('DROP INDEX IF EXISTS idx_test_name;');
    });

    it('should generate rollback SQL for CREATE FUNCTION', () => {
      const migrationSql = `
        CREATE FUNCTION public.test_function() RETURNS VOID AS $$ BEGIN END; $$ LANGUAGE plpgsql;
      `;

      const rollbackSql = runner.generateRollbackSql(migrationSql);

      expect(rollbackSql).toContain('DROP FUNCTION IF EXISTS public.test_function CASCADE;');
    });
  });
});