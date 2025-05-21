import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as gitService from './gitService.js';

const mockSimpleGitInstance = {
  branchLocal: vi.fn(),
  raw: vi.fn(),
  deleteLocalBranch: vi.fn(),
  push: vi.fn(),
  branch: vi.fn(),
};

vi.mock('simple-git', () => ({
  default: vi.fn(() => mockSimpleGitInstance),
}));

describe('gitService', () => {
  beforeEach(() => {
    Object.values(mockSimpleGitInstance).forEach(fn => fn.mockReset());
  });

  it('getLocalBranches returns local branches', async () => {
    mockSimpleGitInstance.branchLocal.mockResolvedValue({ all: ['main', 'dev'] });

    const branches = await gitService.getLocalBranches();
    
    expect(branches).toEqual(['main', 'dev']);
  });

  it('getMergedBranches returns merged branches', async () => {
    mockSimpleGitInstance.raw.mockResolvedValue('* main\n  feature/x\n  fix/y\n');

    const merged = await gitService.getMergedBranches('main');
    
    expect(merged).toEqual(['feature/x', 'fix/y']);
  });

  it('deleteBranch calls deleteLocalBranch', async () => {
    await gitService.deleteBranch('old-branch', true);
    
    expect(mockSimpleGitInstance.deleteLocalBranch).toHaveBeenCalledWith('old-branch', true);
  });

  it('deleteRemoteBranch pushes --delete to remote', async () => {
    await gitService.deleteRemoteBranch('feature/z');
    
    expect(mockSimpleGitInstance.push).toHaveBeenCalledWith('origin', '--delete', 'feature/z');
  });

  it('remoteBranchExists returns true/false correctly', async () => {
    mockSimpleGitInstance.branch.mockResolvedValue({ all: ['origin/main', 'origin/feature/x'] });

    const exists = await gitService.remoteBranchExists('feature/x');
    
    expect(exists).toBe(true);

    const missing = await gitService.remoteBranchExists('feature/missing');
    
    expect(missing).toBe(false);
  });

  it('getLastCommitTimestamp parses integer timestamp', async () => {
    mockSimpleGitInstance.raw.mockResolvedValue('1716249302\n');

    const ts = await gitService.getLastCommitTimestamp('main');
    
    expect(ts).toBe(1716249302);
  });
});