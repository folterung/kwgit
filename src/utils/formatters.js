import chalk from 'chalk';

/**
 * Formats age in seconds to human-readable format (d, w, m, y)
 */
export function formatAge(seconds) {
  const days = Math.floor(seconds / 86400);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return `${years}y`;
  }
  if (months > 0) {
    return `${months}m`;
  }
  if (weeks > 0) {
    return `${weeks}w`;
  }
  return `${days}d`;
}

/**
 * Formats timestamp to readable date string
 */
export function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Returns chalk color function based on staleness
 */
export function getStalenessColor(ageInDays) {
  if (ageInDays < 7) {
    return chalk.reset;
  }
  if (ageInDays < 30) {
    return chalk.yellow;
  }
  return chalk.red;
}

/**
 * Strips ANSI color codes from a string
 */
function stripAnsi(str) {
  return str.replace(/\u001b\[[0-9;]*m/g, '');
}

/**
 * Pads a string with ANSI codes, accounting for their length
 */
function padWithAnsi(str, width) {
  const stripped = stripAnsi(str);
  const padding = Math.max(0, width - stripped.length);
  return str + ' '.repeat(padding);
}

/**
 * Formats branches as a table for terminal output
 */
export function formatBranchListTable(branches, currentBranch) {
  if (branches.length === 0) {
    return '';
  }

  const rows = [];
  const headers = ['Index', 'Branch', 'Created', 'Last Commit', 'Age'];
  const columnWidths = [5, 35, 15, 15, 8];

  rows.push(headers.map((h, i) => h.padEnd(columnWidths[i])).join('  '));
  rows.push(headers.map((_, i) => '-'.repeat(columnWidths[i])).join('  '));

  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    const now = Math.floor(Date.now() / 1000);
    
    const ageInSeconds = now - branch.lastCommitDate;
    const age = formatAge(ageInSeconds);
    
    let stalenessAgeInDays;
    if (branch.creationDate > branch.lastCommitDate) {
      stalenessAgeInDays = Math.floor((now - branch.creationDate) / 86400);
    } else {
      stalenessAgeInDays = Math.floor(ageInSeconds / 86400);
    }
    
    let branchName = branch.name;
    if (branch.isRemote) {
      branchName = `${branchName} ${chalk.gray('(remote)')}`;
    }
    if (branch.isCurrent) {
      branchName = `${chalk.cyan('*')} ${branchName}`;
    }

    let colorFn;
    let coloredBranchName;
    let coloredAge;
    
    if (branch.isProtected && branch.isCurrent) {
      colorFn = chalk.cyan;
      coloredBranchName = colorFn(`${branchName} ${chalk.gray('(protected)')}`);
      coloredAge = colorFn(age);
    } else if (branch.isProtected) {
      colorFn = chalk.dim;
      coloredBranchName = colorFn(`${branchName} ${chalk.gray('(protected)')}`);
      coloredAge = colorFn(age);
    } else if (branch.isCurrent) {
      colorFn = chalk.cyan;
      coloredBranchName = colorFn(branchName);
      coloredAge = colorFn(age);
    } else {
      colorFn = getStalenessColor(stalenessAgeInDays);
      coloredBranchName = colorFn(branchName);
      coloredAge = colorFn(age);
    }

    const index = i.toString().padEnd(columnWidths[0]);
    const branchCol = padWithAnsi(coloredBranchName, columnWidths[1]);
    const created = formatDate(branch.creationDate).padEnd(columnWidths[2]);
    const lastCommit = formatDate(branch.lastCommitDate).padEnd(columnWidths[3]);
    const ageCol = padWithAnsi(coloredAge, columnWidths[4]);

    rows.push(`${index}  ${branchCol}  ${created}  ${lastCommit}  ${ageCol}`);
  }

  return rows.join('\n');
}

/**
 * Formats branches as JSON array
 */
export function formatBranchListJson(branches) {
  const now = Math.floor(Date.now() / 1000);
  
  return JSON.stringify(
    branches.map(branch => {
      const ageInSeconds = now - branch.lastCommitDate;
      return {
        name: branch.name,
        creationDate: branch.creationDate,
        lastCommitDate: branch.lastCommitDate,
        age: formatAge(ageInSeconds),
        isProtected: branch.isProtected || false
      };
    }),
    null,
    2
  );
}

