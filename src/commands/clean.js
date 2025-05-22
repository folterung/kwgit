import { isProtectedBranch } from '../services/protectionService.js';
import chalk from 'chalk';
import {
  deleteBranch,
  deleteRemoteBranch,
  getLocalBranches,
  getMergedBranches,
  remoteBranchExists
} from '../services/gitService.js';
import { confirmBatchDeletion } from '../utils/prompts.js';

/**
 * Command: kwgit clean
 */
export const cleanCommand = {
  command: 'clean [pattern]',
  describe: 'Clean up local Git branches that are stale, merged, or match a regex pattern.',
  builder: (yargs) =>
    yargs
      .positional('pattern', {
        type: 'string',
        describe: 'Regex pattern to match branch names',
        default: '.*', // matches everything
      })
      .option('dry-run', {
        alias: 'd',
        type: 'boolean',
        describe: 'Preview branches that would be deleted',
        default: true,
      })
      .option('merged', {
        alias: 'm',
        type: 'boolean',
        describe: 'Only delete branches merged into the base branch (e.g., main)',
        default: true,
      })
      .option('force', {
        alias: 'f',
        type: 'boolean',
        describe: 'Force deletion without prompt',
        default: false,
      })
      .option('base', {
        alias: 'b',
        type: 'string',
        describe: 'Base branch to check merged status against',
        default: 'main',
      })
      .option('remote', {
        alias: 'r',
        type: 'boolean',
        describe: 'Also delete the matching remote tracking branches (origin/...)',
        default: false,
      }),
  handler: async ({ pattern, dryRun, merged, force, base, remote }) => {
    const regex = new RegExp(pattern);
    console.log(chalk.blueBright(`Finding branches matching pattern: ${chalk.green(pattern)}`));

    let branches = merged
      ? await getMergedBranches(base)
      : await getLocalBranches();

    const matchingBranches = branches.filter(name => regex.test(name));

    if (matchingBranches.length === 0) {
      console.log(chalk.yellow('No matching branches found.'));
      return;
    }

    console.log(chalk.cyan(`Found ${matchingBranches.length} matching branches:`));
    matchingBranches.forEach(branch => {
      if (isProtectedBranch(branch)) {
        console.log(`  • ${chalk.gray(branch)}`);
      } else {
        console.log(`  • ${chalk.green(branch)}`);
      }
    });
    console.log(); // extra spacing before protected warning logs

    // Filter out protected branches
    const deletableBranches = matchingBranches.filter(branch => {
      if (isProtectedBranch(branch)) {
        console.log(chalk.yellow(`Skipping protected branch: ${branch}`));
        return false;
      }
      return true;
    });

    if (deletableBranches.length === 0) {
      console.log(chalk.yellow('No deletable branches found (all are protected).'));
      return;
    }

    if (dryRun) {
      console.log(chalk.gray('\nDry run enabled — no branches were deleted.'));
      return;
    }

    console.log(chalk.bold(`\nThese branches will be deleted:`));
    deletableBranches.forEach(branch => console.log(`  • ${chalk.red(branch)}`));

    const confirm = await confirmBatchDeletion(deletableBranches);

    if (!confirm) {
      console.log(chalk.yellow('\nAborted. No branches were deleted.'));
      return;
    }

    console.log(); // extra spacing

    for (const branch of deletableBranches) {
      try {
        await deleteBranch(branch, force);
        console.log(chalk.green(`✓ Deleted local branch: ${branch}`));

        if (remote) {
          const exists = await remoteBranchExists(branch);

          if (exists) {
            await deleteRemoteBranch(branch);
            console.log(chalk.green(`✓ Deleted remote branch: ${remote}/${branch}`));
          } else {
            console.log(chalk.gray(`ⓘ Skipped remote delete: ${remote}/${branch} does not exist.`));
          }
        }
      } catch (err) {
        console.error(chalk.red(`✗ Failed to delete ${branch}: ${err.message}`));
      }
    }
  },
};