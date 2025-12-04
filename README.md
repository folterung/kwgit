# kwgit

A command-line utility to help with cleaning up git branches. This tool provides a safe and efficient way to manage your git branches, helping you keep your repository clean and organized.

## Features

- **Clean Command**: Remove local and remote branches that match specific patterns
  - Filter branches using regex patterns
  - Option to only delete merged branches
  - Dry run mode for previewing changes
  - Interactive confirmation prompts
  - Support for remote branch cleanup

- **Stale Command**: Find and remove stale branches
  - Configurable time thresholds for stale branches
  - Interactive review process
  - Dry run mode for safety
  - Exclude specific branches (e.g., main)
  - Support for remote branch cleanup with confirmation

- **List Command**: Display all branches with comprehensive metadata
  - Shows index, branch name, creation date, last commit date, and age
  - Color-coded staleness indicators
  - Visual indicators for protected and current branches
  - Support for local, remote, or all branches
  - JSON output option

- **Focus Command**: Operate on branches by their list index
  - Interactive branch-by-branch deletion prompts
  - View selected branches without deletion
  - Delete all selected branches at once
  - Prevents deletion of protected and current branches

## Installation

```bash
npm install -g kwgit
```

## Requirements

- Node.js >= 20.0.0
- Git

## Usage

### Clean Command

```bash
# Clean all merged branches (dry run by default)
kwgit clean

# Clean branches matching a pattern
kwgit clean "feature/*"

# Clean and delete remote branches
kwgit clean --remote

# Force delete without prompts
kwgit clean --force

# Clean branches merged into a specific base branch
kwgit clean --base develop
```

### Stale Command

```bash
# Find branches older than 30 days
kwgit stale

# Customize the stale threshold
kwgit stale --days 60

# Set maximum age for branches
kwgit stale --max-days 180

# Preview changes without deleting
kwgit stale --dry-run

# Remove stale branches including remote (with confirmation)
kwgit stale --remote
```

### List Command

```bash
# List all local branches (default)
kwgit list

# Include remote branches
kwgit list --remote

# Show only remote branches
kwgit list --remote-only

# Show both local and remote branches
kwgit list --all

# Output as JSON
kwgit list --json
```

### Focus Command

```bash
# Interactively delete branches by index (prompts for each)
kwgit focus 1 2 3

# View selected branches without deletion
kwgit focus 1 2 --view

# Delete all selected branches without prompts
kwgit focus 1 2 --yes

# Force delete local branches
kwgit focus 1 --force

# Focus on remote branches (must match list filters)
kwgit focus 1 2 --remote
```

## Using with NPX

You can run `kwgit` directly without installation using:

```bash
npx kwgit clean "feature/*"
npx kwgit stale --remote
npx kwgit list
npx kwgit focus 1 2 3
```

This is useful for one-off usage or running in CI/CD pipelines.

## Options

### Clean Command Options

- `[pattern]`: Regex pattern to match branch names (default: '.*')
- `--dry-run, -d`: Preview branches that would be deleted (default: true)
- `--merged, -m`: Only delete branches merged into the base branch (default: true)
- `--force, -f`: Force deletion without prompt (default: false)
- `--base, -b`: Base branch to check merged status against (default: 'main')
- `--remote, -r`: Also delete matching remote tracking branches (default: false)

### Stale Command Options

- `--days, -d`: Minimum days since last commit to consider a branch stale (default: 30)
- `--max-days, -m`: Maximum days since last commit (default: 365)
- `--base, -b`: Branch to exclude from evaluation (default: 'main')
- `--dry-run`: Preview stale branches without deleting (default: false)
- `--force, -f`: Delete matching branches without prompt (default: false)
- `--remote, -r`: Also delete matching remote tracking branches (with prompt unless --force)

### List Command Options

- `--remote, -r`: Include remote branches (default: false)
- `--remote-only`: Show only remote branches (default: false)
- `--all, -a`: Show both local and remote branches (default: false)
- `--json`: Output structured JSON instead of table (default: false)

### Focus Command Options

- `<indices...>`: 0-based indices from `kwgit list` (required)
- `--remote, -r`: Include remote branches (must match list filters) (default: false)
- `--remote-only`: Only remote branches (must match list filters) (default: false)
- `--all-branches, -a`: Local + remote branches (must match list filters) (default: false)
- `--view`: Only view selected branches without deletion (default: false)
- `--force, -f`: Force delete local branches (default: false)
- `--yes, -y`: Delete all selected branches without individual prompts (default: false)
- `--json`: Output structured JSON (default: false)

## Environment Variables

### `KWGIT_PROTECTED_BRANCHES`

Use this environment variable to define a comma-separated list of branch names that should never be deleted, even if they match your cleanup criteria.

If not specified, the default protected branches are:
```
main, master
```

You can set this in your shell configuration file (e.g., `.zprofile`, `.bashrc`, or `.zshrc`):

```bash
export KWGIT_PROTECTED_BRANCHES="main,master,develop,staging"
```

When running `kwgit`, these branches will always be excluded from deletion. You will see a warning message indicating they were skipped.

Protected branches are visually distinct in the `list` command output (shown in dimmed text with a "(protected)" label) and cannot be selected for deletion in the `focus` command.

## License

MIT

## Author

Kevin Warnock
