import inquirer from 'inquirer';

/**
 * Prompt the user to confirm deletion of a group of branches.
 */
export async function confirmBatchDeletion(branches) {
    const isPlural = branches.length !== 1;
    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete ${branches.length} branch${isPlural ? 'es' : ''}?`,
            default: false,
        },
    ]);

    return confirm;
}

/**
 * Prompt the user to confirm deletion of a branch.
 */
export async function confirmBranchDeletion(branchName) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Delete branch '${branchName}'?`,
        default: false,
      },
    ]);
  
    return confirm;
  }