

import { describe, it, expect, vi, beforeEach } from 'vitest';
import inquirer from 'inquirer';
import { confirmBatchDeletion, confirmBranchDeletion } from './prompts.js';

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

describe('confirmBatchDeletion', () => {
  beforeEach(() => {
    inquirer.prompt.mockReset();
  });

  it('should return true when user confirms deletion', async () => {
    inquirer.prompt.mockResolvedValue({ confirm: true });
    
    const result = await confirmBatchDeletion(['feature/a', 'feature/b']);
    
    expect(result).toBe(true);
  });

  it('should return false when user declines deletion', async () => {
    inquirer.prompt.mockResolvedValue({ confirm: false });
    
    const result = await confirmBatchDeletion(['feature/a']);
    
    expect(result).toBe(false);
  });
});

describe('confirmBranchDeletion', () => {
  it('should return true when user confirms deletion', async () => {
    inquirer.prompt.mockResolvedValue({ confirm: true });
    
    const result = await confirmBranchDeletion('feature/a');
    
    expect(result).toBe(true);
  });

  it('should return false when user declines deletion', async () => {
    inquirer.prompt.mockResolvedValue({ confirm: false });
    
    const result = await confirmBranchDeletion('feature/a');
    
    expect(result).toBe(false);
  });
});