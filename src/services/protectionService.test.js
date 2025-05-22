

import { afterAll, beforeEach, describe, it, expect } from 'vitest';
import { getProtectedBranches, isProtectedBranch } from './protectionService.js';

describe('protectionService', () => {
  const originalEnv = process.env.KWGIT_PROTECTED_BRANCHES;

  beforeEach(() => {
    delete process.env.KWGIT_PROTECTED_BRANCHES;
  });

  afterAll(() => {
    process.env.KWGIT_PROTECTED_BRANCHES = originalEnv;
  });

  describe('getProtectedBranches', () => {
    it('returns default protected branches when env var is not set', () => {
      expect(getProtectedBranches()).toEqual(['main', 'master']);
    });

    it('parses custom protected branches from environment variable', () => {
      process.env.KWGIT_PROTECTED_BRANCHES = 'main,develop,release';

      expect(getProtectedBranches()).toEqual(['main', 'develop', 'release']);
    });

    it('trims whitespace and lowercases entries', () => {
      process.env.KWGIT_PROTECTED_BRANCHES = ' Main , DEVELOP , Staging ';

      expect(getProtectedBranches()).toEqual(['main', 'develop', 'staging']);
    });
  });

  describe('isProtectedBranch', () => {
    it('correctly identifies protected branches from default list', () => {
      expect(isProtectedBranch('main')).toBe(true);
      expect(isProtectedBranch('master')).toBe(true);
      expect(isProtectedBranch('feature/test')).toBe(false);
    });

    it('works with custom environment variable values', () => {
      process.env.KWGIT_PROTECTED_BRANCHES = 'release,dev';

      expect(isProtectedBranch('release')).toBe(true);
      expect(isProtectedBranch('dev')).toBe(true);
      expect(isProtectedBranch('master')).toBe(false);
    });

    it('is case-insensitive', () => {
      process.env.KWGIT_PROTECTED_BRANCHES = 'Main,Staging';

      expect(isProtectedBranch('main')).toBe(true);
      expect(isProtectedBranch('staging')).toBe(true);
      expect(isProtectedBranch('StAgInG')).toBe(true);
    });
  });
});