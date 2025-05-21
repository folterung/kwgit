import { staleCommand } from './stale.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as gitService from '../services/gitService.js';
import * as prompts from '../utils/prompts.js';

const now = Math.floor(Date.now() / 1000); // current time in seconds

describe('staleCommand', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should skip deletion in dry-run mode', async () => {
    vi.spyOn(gitService, 'getLocalBranches').mockResolvedValue(['old-branch', 'recent-branch']);
    vi.spyOn(gitService, 'getLastCommitTimestamp').mockImplementation(branch => {
      if (branch === 'old-branch') return now - (60 * 86400); // 60 days ago
      if (branch === 'recent-branch') return now - (10 * 86400); // 10 days ago
    });

    const deleteSpy = vi.spyOn(gitService, 'deleteBranch');

    await staleCommand.handler({ days: 30, maxDays: 365, base: 'main', dryRun: true, force: false });

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should delete stale branches with force', async () => {
    vi.spyOn(gitService, 'getLocalBranches').mockResolvedValue(['ancient']);
    vi.spyOn(gitService, 'getLastCommitTimestamp').mockResolvedValue(now - (120 * 86400));

    const deleteSpy = vi.spyOn(gitService, 'deleteBranch').mockResolvedValue();

    await staleCommand.handler({ days: 30, maxDays: 365, base: 'main', dryRun: false, force: true });

    expect(deleteSpy).toHaveBeenCalledWith('ancient', true);
  });

  it('should prompt before deleting if not forced', async () => {
    vi.spyOn(gitService, 'getLocalBranches').mockResolvedValue(['prompt-me']);
    vi.spyOn(gitService, 'getLastCommitTimestamp').mockResolvedValue(now - (90 * 86400));
    vi.spyOn(prompts, 'confirmBranchDeletion').mockResolvedValue(true);

    const deleteSpy = vi.spyOn(gitService, 'deleteBranch').mockResolvedValue();

    await staleCommand.handler({ days: 30, maxDays: 365, base: 'main', dryRun: false, force: false });

    expect(deleteSpy).toHaveBeenCalledWith('prompt-me', true);
  });

  it('should skip branches younger than "days"', async () => {
    vi.spyOn(gitService, 'getLocalBranches').mockResolvedValue(['young']);
    vi.spyOn(gitService, 'getLastCommitTimestamp').mockResolvedValue(now - (5 * 86400)); // 5 days old

    const deleteSpy = vi.spyOn(gitService, 'deleteBranch');

    await staleCommand.handler({ days: 10, maxDays: 365, base: 'main', dryRun: false, force: true });

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should skip branches older than "max-days"', async () => {
    vi.spyOn(gitService, 'getLocalBranches').mockResolvedValue(['ancient']);
    vi.spyOn(gitService, 'getLastCommitTimestamp').mockResolvedValue(now - (400 * 86400)); // 400 days

    const deleteSpy = vi.spyOn(gitService, 'deleteBranch');

    await staleCommand.handler({ days: 30, maxDays: 365, base: 'main', dryRun: false, force: true });

    expect(deleteSpy).not.toHaveBeenCalled();
  });
});

  it('should delete remote branches if --remote is passed and remote branch exists', async () => {
    vi.spyOn(gitService, 'getLocalBranches').mockResolvedValue(['feature/x']);
    vi.spyOn(gitService, 'getLastCommitTimestamp').mockResolvedValue(now - (100 * 86400)); // 100 days ago
    vi.spyOn(prompts, 'confirmBranchDeletion').mockResolvedValue(true);
    vi.spyOn(gitService, 'remoteBranchExists').mockResolvedValue(true);
    
    const remoteDeleteSpy = vi.spyOn(gitService, 'deleteRemoteBranch').mockResolvedValue();
    const localDeleteSpy = vi.spyOn(gitService, 'deleteBranch').mockResolvedValue();

    await staleCommand.handler({
      days: 30,
      maxDays: 365,
      base: 'main',
      dryRun: false,
      force: false,
      remote: true,
    });

    expect(localDeleteSpy).toHaveBeenCalledWith('feature/x', true);
    expect(remoteDeleteSpy).toHaveBeenCalledWith('feature/x');
  });

  it('should skip remote deletion if remote branch does not exist', async () => {
    vi.spyOn(gitService, 'getLocalBranches').mockResolvedValue(['ghost']);
    vi.spyOn(gitService, 'getLastCommitTimestamp').mockResolvedValue(now - (80 * 86400));
    vi.spyOn(gitService, 'remoteBranchExists').mockResolvedValue(false);
    vi.spyOn(gitService, 'deleteBranch').mockResolvedValue();

    const remoteDeleteSpy = vi.spyOn(gitService, 'deleteRemoteBranch');

    await staleCommand.handler({
      days: 30,
      maxDays: 365,
      base: 'main',
      dryRun: false,
      force: true,
      remote: true,
    });

    expect(remoteDeleteSpy).not.toHaveBeenCalled();
  });