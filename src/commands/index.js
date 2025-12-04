import { cleanCommand } from './clean.js';
import { staleCommand } from './stale.js';
import { listCommand } from './list.js';
import { focusCommand } from './focus.js';

/**
 * This function registers all available commands with yargs.
 * Each command must export a properly shaped command object.
 */
export function registerCommands(yargsInstance) {
  return yargsInstance
    .command(cleanCommand)
    .command(staleCommand)
    .command(listCommand)
    .command(focusCommand);
}