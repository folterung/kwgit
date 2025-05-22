import chalk from 'chalk';
import { getLocalBranches, getLastCommitTimestamp, deleteBranch, deleteRemoteBranch, remoteBranchExists } from '../services/gitService.js';
import { confirmBranchDeletion } from '../utils/prompts.js';
import { isProtectedBranch } from '../services/protectionService.js';

export const staleCommand = {
  command: 'stale',
  describe: 'Interactively review and delete stale local branches.',
  builder: yargs =>
    yargs
      .option('days', {
        alias: 'd',
        type: 'number',
        describe: 'Minimum days since last commit to consider a branch stale',
        default: 30,
      })
      .option('max-days', {
        alias: 'm',
        type: 'number',
        describe: 'Maximum days since last commit (exclude ancient branches)',
        default: 365,
      })
      .option('base', {
        alias: 'b',
        type: 'string',
        describe: 'Branch to exclude from evaluation',
        default: 'main',
      })
      .option('dry-run', {
        type: 'boolean',
        default: false,
        describe: 'Preview stale branches without deleting',
      })
      .option('force', {
        alias: 'f',
        type: 'boolean',
        describe: 'Delete matching branches without prompt',
        default: false,
      })
      .option('remote', {
        alias: 'r',
        type: 'boolean',
        describe: 'Also delete matching remote tracking branches (origin/...)',
        default: false,
      }),
  handler: async ({ days, maxDays, base, dryRun, force, remote }) => {
    const branches = await getLocalBranches();
    const now = Math.floor(Date.now() / 1000); // seconds
    const candidates = [];

    for (const branch of branches) {
      if (branch === base) continue;

      const timestamp = await getLastCommitTimestamp(branch);
      const ageInDays = Math.floor((now - timestamp) / 86400);

      if (ageInDays >= days && ageInDays <= maxDays) {
        candidates.push({ branch, ageInDays });
      }
    }

    if (candidates.length === 0) {
      console.log(chalk.green(`No stale branches found in range ${days}–${maxDays} days.`));
      return;
    }

    console.log(chalk.yellow(`\nFound ${candidates.length} potentially stale branches:`));
    console.log(); // blank line before listing branches

    for (const { branch, ageInDays } of candidates) {
      console.log(`\n  • ${chalk.red(branch)} (${chalk.gray(`${ageInDays} days old`)})`);

      if (isProtectedBranch(branch)) {
        console.log(chalk.yellow(`Skipping protected branch: ${branch}`));
        continue;
      }

      if (dryRun) {
        console.log(chalk.gray('  Skipping deletion: dry-run mode enabled.'));
        continue;
      }

      const confirm = force ? true : await confirmBranchDeletion(branch);

      if (confirm) {
        try {
          await deleteBranch(branch, true); // true = force delete
          console.log(chalk.green(`  ✓ Deleted ${branch}`));
        } catch (err) {
          console.error(chalk.red(`  ✗ Failed to delete ${branch}: ${err.message}`));
        }
      } else {
        console.log(chalk.gray(`  Skipped ${branch}`));
      }

      if (remote) {
        const remoteExists = await remoteBranchExists(branch);
        
        if (!remoteExists) {
          console.log(chalk.gray(`  ⓘ Skipped remote delete: origin/${branch} does not exist.`));
          continue;
        }

        const confirmRemote = force ? true : await confirmBranchDeletion(`origin/${branch}`);
        
        if (confirmRemote) {
          try {
            await deleteRemoteBranch(branch);
            console.log(chalk.green(`  ✓ Deleted remote branch: origin/${branch}`));
          } catch (err) {
            console.error(chalk.red(`  ✗ Failed to delete remote branch: origin/${branch}: ${err.message}`));
          }
        } else {
          console.log(chalk.gray(`  Skipped remote branch: origin/${branch}`));
        }
      }
    }
  },
};