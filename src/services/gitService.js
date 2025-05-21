import chalk from 'chalk';
import simpleGit from 'simple-git';

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