# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] - 2025-12-04

### Added

#### New Commands

- **`kwgit list`** - Display all branches with comprehensive metadata
  - Shows index, branch name, creation date, last commit date, and age
  - Color-coded staleness indicators:
    - Normal (default) for branches < 7 days old
    - Yellow for branches 7-30 days old
    - Red for branches > 30 days old
  - Special visual indicators:
    - Protected branches shown in dimmed text with "(protected)" label
    - Current branch highlighted in cyan with asterisk (*)
    - Remote branches marked with "(remote)" label
  - Filtering options:
    - `--remote` / `-r`: Include remote branches
    - `--remote-only`: Show only remote branches
    - `--all` / `-a`: Show both local and remote branches
  - `--json`: Output structured JSON format
  - Uses reflog for accurate branch creation date detection

- **`kwgit focus <indices...>`** - Operate on branches by their list index
  - Default behavior: Interactive prompts for each selected branch (delete or skip)
  - `--view`: Only view selected branches without deletion
  - `--yes` / `-y`: Delete all selected branches without individual prompts
  - `--force` / `-f`: Force delete local branches
  - Supports same filtering options as `list` command (`--remote`, `--remote-only`, `--all`)
  - `--json`: Output selected branches as JSON
  - Safety features:
    - Prevents deletion of protected branches (error if selected)
    - Prevents deletion of current branch (error if attempted)
    - Shows summary of deleted, skipped, and failed branches

### Improved

- Branch creation date detection now uses git reflog for more accurate timestamps
- Staleness coloring now considers branch creation date when more recent than commit date
- Protected branches are visually distinct and cannot be deleted
- Current branch is clearly marked and excluded from deletion operations

### Technical

- Added `getBranchesWithMetadata()` function to `gitService.js` for efficient branch discovery
- New `formatters.js` utility module for table and JSON output formatting
- Improved ANSI color code handling in table formatting for proper alignment
- Enhanced branch metadata retrieval using `git for-each-ref`

