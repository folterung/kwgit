import chalk from 'chalk';
import { getBranchesWithMetadata } from '../services/gitService.js';
import { deleteBranch, deleteRemoteBranch } from '../services/gitService.js';
import { isProtectedBranch } from '../services/protectionService.js';
import { confirmBranchDeletion } from '../utils/prompts.js';

export const focusCommand = {
  command: 'focus <indices...>',
  describe: 'Perform operations on branches by their list index.',
  builder: yargs =>
    yargs
      .positional('indices', {
        type: 'string',
        describe: '0-based indices from kwgit list',
        array: true,
      })
      .option('remote', {
        alias: 'r',
        type: 'boolean',
        describe: 'Include remote branches (must match list filters)',
        default: false,
      })
      .option('remote-only', {
        type: 'boolean',
        describe: 'Only remote branches (must match list filters)',
        default: false,
      })
      .option('all-branches', {
        alias: 'a',
        type: 'boolean',
        describe: 'Local + remote branches (must match list filters)',
        default: false,
      })
      .option('json', {
        type: 'boolean',
        describe: 'Output structured JSON',
        default: false,
      })
      .option('view', {
        type: 'boolean',
        describe: 'Only view selected branches (do not delete)',
        default: false,
      })
      .option('force', {
        alias: 'f',
        type: 'boolean',
        describe: 'Force delete',
        default: false,
      })
      .option('yes', {
        alias: 'y',
        type: 'boolean',
        describe: 'Delete all selected branches without individual prompts',
        default: false,
      }),
  handler: async ({ indices, remote, remoteOnly, allBranches, json, view, force, yes }) => {
    if (!indices || indices.length === 0) {
      console.error(chalk.red('Error: At least one index is required.'));
      process.exit(1);
    }

    const includeRemote = remote || allBranches;
    const onlyRemote = remoteOnly;

    if (onlyRemote && !includeRemote) {
      console.error(chalk.red('Error: --remote-only requires remote branches to be included.'));
      process.exit(1);
    }

    const branches = await getBranchesWithMetadata({
      includeRemote: includeRemote || onlyRemote,
      remoteOnly: onlyRemote,
    });

    if (branches.length === 0) {
      console.log(chalk.yellow('No branches found.'));
      return;
    }

    const parsedIndices = indices.map(idx => {
      const num = parseInt(idx, 10);
      if (isNaN(num) || num < 0) {
        throw new Error(`Invalid index: ${idx}`);
      }
      return num;
    });

    const invalidIndices = parsedIndices.filter(idx => idx >= branches.length);
    if (invalidIndices.length > 0) {
      console.error(chalk.red(`Error: Invalid indices: ${invalidIndices.join(', ')}. Maximum index is ${branches.length - 1}.`));
      process.exit(1);
    }

    const selectedBranches = parsedIndices.map(idx => branches[idx]);

    const protectedBranches = selectedBranches.filter(b => b.isProtected);
    
    if (protectedBranches.length > 0) {
      console.error(chalk.red(`Error: Cannot focus on protected branches: ${protectedBranches.map(b => b.name).join(', ')}`));
      console.error(chalk.yellow('Protected branches cannot be deleted. Remove them from your selection.'));
      process.exit(1);
    }

    if (json) {
      console.log(JSON.stringify(selectedBranches, null, 2));
      return;
    }

    if (view) {
      console.log(chalk.bold(`\nSelected branches:`));
      selectedBranches.forEach(branch => {
        const remoteLabel = branch.isRemote ? chalk.gray(' (remote)') : '';
        const currentLabel = branch.isCurrent ? chalk.cyan(' (current)') : '';
        const protectedLabel = branch.isProtected ? chalk.gray(' (protected)') : '';
        console.log(`  • ${chalk.cyan(branch.name)}${remoteLabel}${currentLabel}${protectedLabel}`);
      });
      return;
    }

    const deleteAll = yes;

    const currentBranches = selectedBranches.filter(b => b.isCurrent);
    if (currentBranches.length > 0) {
      console.error(chalk.red(`Error: Cannot delete current branch: ${currentBranches.map(b => b.name).join(', ')}`));
      console.error(chalk.yellow('Switch to a different branch before deleting.'));
      process.exit(1);
    }

    const deletableBranches = selectedBranches.filter(b => !b.isCurrent);

    if (deletableBranches.length === 0) {
      console.log(chalk.yellow('No deletable branches selected.'));
      return;
    }

    console.log(chalk.bold(`\nReviewing ${deletableBranches.length} branch${deletableBranches.length === 1 ? '' : 'es'} for deletion:\n`));

    const deletedBranches = [];
    const skippedBranches = [];
    const failedBranches = [];

    for (const branch of deletableBranches) {
      let shouldDelete = deleteAll;

      if (!deleteAll) {
        const branchLabel = branch.isRemote ? `${branch.name} (remote)` : branch.name;
        shouldDelete = await confirmBranchDeletion(branchLabel);
      }

      if (!shouldDelete) {
        skippedBranches.push(branch);
        console.log(chalk.gray(`  Skipped ${branch.name}`));
        continue;
      }

      try {
        if (branch.isRemote) {
          await deleteRemoteBranch(branch.name);
          deletedBranches.push(branch);
          console.log(chalk.green(`  ✓ Deleted remote branch: ${branch.name}`));
        } else {
          await deleteBranch(branch.name, force);
          deletedBranches.push(branch);
          console.log(chalk.green(`  ✓ Deleted local branch: ${branch.name}`));
        }
      } catch (err) {
        failedBranches.push({ branch, error: err });
        const remoteLabel = branch.isRemote ? 'remote ' : '';
        console.error(chalk.red(`  ✗ Failed to delete ${remoteLabel}branch ${branch.name}: ${err.message}`));
      }
    }

    console.log();

    if (deletedBranches.length > 0) {
      console.log(chalk.green(`✓ Successfully deleted ${deletedBranches.length} branch${deletedBranches.length === 1 ? '' : 'es'}.`));
    }

    if (skippedBranches.length > 0) {
      console.log(chalk.yellow(`⊘ Skipped ${skippedBranches.length} branch${skippedBranches.length === 1 ? '' : 'es'}.`));
    }

    if (failedBranches.length > 0) {
      console.log(chalk.red(`✗ Failed to delete ${failedBranches.length} branch${failedBranches.length === 1 ? '' : 'es'}.`));
    }
  },
};

