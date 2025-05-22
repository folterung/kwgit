/**
 * Gets the list of protected branch names from environment variable or defaults
 * @returns {string[]} Array of protected branch names in lowercase
 * @description Checks KWGIT_PROTECTED_BRANCHES environment variable for comma-separated branch names.
 * If not set, defaults to ['main', 'master']
 */
export function getProtectedBranches() {
  const env = process.env.KWGIT_PROTECTED_BRANCHES;
  
  return env
    ? env.split(',').map(b => b.trim().toLowerCase())
    : ['main', 'master'];
}

/**
 * Checks if a branch name is in the protected branches list
 * @param {string} branchName - The name of the branch to check
 * @returns {boolean} True if the branch is protected, false otherwise
 */
export function isProtectedBranch(branchName) {
  const protectedList = getProtectedBranches();
  
  return protectedList.includes(branchName.toLowerCase());
}