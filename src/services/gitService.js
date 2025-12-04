import chalk from 'chalk';
import simpleGit from 'simple-git';
import { isProtectedBranch } from './protectionService.js';

/**
 * Initialize a simple-git instance at the current working directory.
 */
function getGit() {
  return simpleGit();
}

/**
 * Deletes a local branch.
 */
export async function deleteBranch(branchName, force = false) {
  return force
    ? getGit().deleteLocalBranch(branchName, true)
    : getGit().deleteLocalBranch(branchName);
}

/**
 * Deletes a remote branch from the given remote (default: origin)
 */
export async function deleteRemoteBranch(branchName, remote = 'origin') {
  return getGit().push(remote, '--delete', branchName);
}

/**
 * Gets all local branches.
 */
export async function getLocalBranches() {
  const result = await getGit().branchLocal();

  return result.all; // Returns an array of branch names
}

/**
 * Gets the last commit timestamp (in seconds since epoch) for a branch.
 */
export async function getLastCommitTimestamp(branchName) {
  const result = await getGit().raw(['log', '-1', '--format=%ct', branchName]);

  return parseInt(result.trim(), 10); // e.g., 1716249302
}

/**
 * Gets merged branches into the given base (e.g. main, develop).
 */
export async function getMergedBranches(base = 'main') {
  try {
    const merged = await getGit().raw(['branch', '--merged', base]);
    return merged
      .split('\n')
      .map(line => line.trim().replace(/^\* /, ''))
      .filter(name => name && name !== base);
  } catch (err) {
    if (err.message.includes('malformed object name')) {
      console.error(chalk.red(`✗ The base branch '${base}' does not exist in this repository.`));
      return [];
    }
    throw err;
  }
}

/**
 * Checks if a remote branch exists.
 */
export async function remoteBranchExists(branchName, remote = 'origin') {
  const result = await getGit().branch(['-r']);
  const fullName = `${remote}/${branchName}`;

  return result.all.includes(fullName);
}

/**
 * Gets the current branch name.
 */
export async function getCurrentBranch() {
  const result = await getGit().branchLocal();
  return result.current;
}

/**
 * Gets the actual branch creation timestamp from reflog
 * Returns the timestamp of the oldest reflog entry (branch creation)
 */
async function getBranchCreationTimestamp(branchName) {
  try {
    const git = getGit();
    const result = await git.raw(['reflog', 'show', '--date=unix', branchName]);
    const lines = result.trim().split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      const match = lastLine.match(/@\{(\d+)\}/);
      if (match && match[1]) {
        const timestamp = parseInt(match[1], 10);
        return isNaN(timestamp) ? null : timestamp;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Gets branches with metadata (creation date, last commit date, etc.)
 * @param {Object} options - Filtering options
 * @param {boolean} options.includeRemote - Include remote branches
 * @param {boolean} options.remoteOnly - Only remote branches
 * @returns {Promise<Array>} Array of branch objects with metadata
 */
export async function getBranchesWithMetadata({ includeRemote = false, remoteOnly = false } = {}) {
  const git = getGit();
  const currentBranch = await getCurrentBranch();
  const branches = [];

  if (!remoteOnly) {
    const localRefs = await git.raw([
      'for-each-ref',
      'refs/heads',
      '--format=%(refname:short)|%(creatordate:unix)|%(committerdate:unix)'
    ]);

    const localLines = localRefs.trim().split('\n').filter(line => line.trim());
    
    for (const line of localLines) {
      const [name, creatorDate, commitDate] = line.split('|');
      
      if (!name) continue;

      const lastCommitTimestamp = parseInt(commitDate, 10);
      if (isNaN(lastCommitTimestamp)) {
        continue;
      }

      let creationTimestamp = parseInt(creatorDate, 10);
      if (isNaN(creationTimestamp) || creationTimestamp === 0) {
        creationTimestamp = lastCommitTimestamp;
      }

      const reflogCreationTimestamp = await getBranchCreationTimestamp(name);
      if (reflogCreationTimestamp) {
        if (creationTimestamp === lastCommitTimestamp || reflogCreationTimestamp < creationTimestamp) {
          creationTimestamp = reflogCreationTimestamp;
        }
      }

      branches.push({
        name,
        creationDate: creationTimestamp,
        lastCommitDate: lastCommitTimestamp,
        isCurrent: name === currentBranch,
        isRemote: false,
        isProtected: isProtectedBranch(name)
      });
    }
  }

  if (includeRemote || remoteOnly) {
    const remoteRefs = await git.raw([
      'for-each-ref',
      'refs/remotes',
      '--format=%(refname:short)|%(creatordate:unix)|%(committerdate:unix)'
    ]);

    const remoteLines = remoteRefs.trim().split('\n').filter(line => line.trim());
    
    for (const line of remoteLines) {
      const [fullName, creatorDate, commitDate] = line.split('|');
      
      if (!fullName) continue;

      const parts = fullName.split('/');
      if (parts.length < 2) continue;

      const name = parts.slice(1).join('/');
      let creationTimestamp = parseInt(creatorDate, 10);
      const lastCommitTimestamp = parseInt(commitDate, 10);

      if (isNaN(creationTimestamp) || creationTimestamp === 0) {
        creationTimestamp = lastCommitTimestamp;
      }

      if (isNaN(lastCommitTimestamp)) {
        continue;
      }

      branches.push({
        name,
        creationDate: creationTimestamp,
        lastCommitDate: lastCommitTimestamp,
        isCurrent: false,
        isRemote: true,
        isProtected: isProtectedBranch(name)
      });
    }
  }

  return branches.sort((a, b) => a.creationDate - b.creationDate);
}