import { cleanCommand } from './clean.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as gitService from '../services/gitService.js';
import * as prompts from '../utils/prompts.js';

describe('cleanCommand', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should match branches by regex pattern', async () => {
    vi.spyOn(gitService, 'getMergedBranches').mockResolvedValue(['feature/one', 'bugfix/two', 'hotfix/three']);

    const deleteSpy = vi.spyOn(gitService, 'deleteBranch');

    vi.spyOn(prompts, 'confirmBatchDeletion').mockResolvedValue(false); // don't delete

    await cleanCommand.handler({
      pattern: 'feature/.*',
      dryRun: false,
      merged: true,
      force: false,
      remote: false,
      base: 'main',
    });

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should not delete anything in dry-run mode', async () => {
    vi.spyOn(gitService, 'getMergedBranches').mockResolvedValue(['hotfix/safe']);

    const deleteSpy = vi.spyOn(gitService, 'deleteBranch');

    await cleanCommand.handler({
      pattern: 'hotfix/.*',
      dryRun: true,
      merged: true,
      force: true,
      remote: false,
      base: 'main',
    });

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should delete matching branches when confirmed', async () => {
    vi.spyOn(gitService, 'getMergedBranches').mockResolvedValue(['feature/delete-me']);

    const deleteSpy = vi.spyOn(gitService, 'deleteBranch').mockResolvedValue();

    vi.spyOn(prompts, 'confirmBatchDeletion').mockResolvedValue(true);

    await cleanCommand.handler({
      pattern: 'feature/.*',
      dryRun: false,
      merged: true,
      force: false,
      remote: false,
      base: 'main',
    });

    expect(deleteSpy).toHaveBeenCalledWith('feature/delete-me', false);
  });

  it('should delete remote branches if specified and they exist', async () => {
    vi.spyOn(gitService, 'getMergedBranches').mockResolvedValue(['release/x']);
    vi.spyOn(gitService, 'deleteBranch').mockResolvedValue();
    vi.spyOn(gitService, 'remoteBranchExists').mockResolvedValue(true);

    const remoteDeleteSpy = vi.spyOn(gitService, 'deleteRemoteBranch').mockResolvedValue();

    vi.spyOn(prompts, 'confirmBatchDeletion').mockResolvedValue(true);

    await cleanCommand.handler({
      pattern: 'release/.*',
      dryRun: false,
      merged: true,
      force: false,
      remote: true,
      base: 'main',
    });

    expect(remoteDeleteSpy).toHaveBeenCalledWith('release/x');
  });

  it('should skip remote deletion if remote branch does not exist', async () => {
    vi.spyOn(gitService, 'getMergedBranches').mockResolvedValue(['release/ghost']);
    vi.spyOn(gitService, 'deleteBranch').mockResolvedValue();
    vi.spyOn(gitService, 'remoteBranchExists').mockResolvedValue(false);

    const remoteDeleteSpy = vi.spyOn(gitService, 'deleteRemoteBranch').mockResolvedValue();

    vi.spyOn(prompts, 'confirmBatchDeletion').mockResolvedValue(true);

    await cleanCommand.handler({
      pattern: 'release/.*',
      dryRun: false,
      merged: true,
      force: false,
      remote: true,
      base: 'main',
    });

    expect(remoteDeleteSpy).not.toHaveBeenCalled();
  });

  it('should match multiple branches using regex', async () => {
    vi.spyOn(gitService, 'getMergedBranches').mockResolvedValue(['feature/a', 'feature/b', 'bugfix/c']);

    const deleteSpy = vi.spyOn(gitService, 'deleteBranch').mockResolvedValue();

    vi.spyOn(prompts, 'confirmBatchDeletion').mockResolvedValue(true);

    await cleanCommand.handler({
      pattern: 'feature/.*',
      dryRun: false,
      merged: true,
      force: false,
      remote: false,
      base: 'main',
    });

    expect(deleteSpy).toHaveBeenCalledTimes(2);
    expect(deleteSpy).toHaveBeenCalledWith('feature/a', false);
    expect(deleteSpy).toHaveBeenCalledWith('feature/b', false);
  });

  it('should not crash on invalid regex pattern', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => { });

    await expect(cleanCommand.handler({
      pattern: '[invalid-regex',
      dryRun: true,
      merged: true,
      force: false,
      remote: false,
      base: 'main',
    })).rejects.toThrow();
    spy.mockRestore();
  });

  it('should skip deletion if no branches match', async () => {
    vi.spyOn(gitService, 'getMergedBranches').mockResolvedValue(['feature/a']);

    const deleteSpy = vi.spyOn(gitService, 'deleteBranch');

    await cleanCommand.handler({
      pattern: 'hotfix/.*',
      dryRun: false,
      merged: true,
      force: true,
      remote: false,
      base: 'main',
    });

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should not delete if user declines prompt', async () => {
    vi.spyOn(gitService, 'getMergedBranches').mockResolvedValue(['feature/nope']);

    const deleteSpy = vi.spyOn(gitService, 'deleteBranch');

    vi.spyOn(prompts, 'confirmBatchDeletion').mockResolvedValue(false);

    await cleanCommand.handler({
      pattern: 'feature/.*',
      dryRun: false,
      merged: true,
      force: false,
      remote: false,
      base: 'main',
    });

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should use getLocalBranches when merged is false', async () => {
    vi.spyOn(gitService, 'getLocalBranches').mockResolvedValue(['local-only']);

    const deleteSpy = vi.spyOn(gitService, 'deleteBranch').mockResolvedValue();

    vi.spyOn(prompts, 'confirmBatchDeletion').mockResolvedValue(true);

    await cleanCommand.handler({
      pattern: 'local-.*',
      dryRun: false,
      merged: false,
      force: false,
      remote: false,
      base: 'main',
    });

    expect(deleteSpy).toHaveBeenCalledWith('local-only', false);
  });
});