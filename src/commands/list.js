import chalk from 'chalk';
import { getBranchesWithMetadata } from '../services/gitService.js';
import { formatBranchListTable, formatBranchListJson } from '../utils/formatters.js';

export const listCommand = {
  command: 'list',
  describe: 'List all branches with metadata (creation date, last commit, age).',
  builder: yargs =>
    yargs
      .option('remote', {
        alias: 'r',
        type: 'boolean',
        describe: 'Include remote branches',
        default: false,
      })
      .option('remote-only', {
        type: 'boolean',
        describe: 'Only remote branches',
        default: false,
      })
      .option('all', {
        alias: 'a',
        type: 'boolean',
        describe: 'Local + remote branches',
        default: false,
      })
      .option('json', {
        type: 'boolean',
        describe: 'Output structured JSON',
        default: false,
      }),
  handler: async ({ remote, remoteOnly, all, json }) => {
    const includeRemote = remote || all;
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

    if (json) {
      console.log(formatBranchListJson(branches));
    } else {
      const currentBranch = branches.find(b => b.isCurrent)?.name || null;
      console.log(formatBranchListTable(branches, currentBranch));
    }
  },
};

