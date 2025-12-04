#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { registerCommands } from '../src/commands/index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

const cli = yargs(hideBin(process.argv))
    .scriptName('kwgit')
    .usage('$0 <command> [options]')
    .recommendCommands()
    .strict()
    .demandCommand(1, 'Please specify a valid command.')
    .help()
    .alias('h', 'help')
    .version(packageJson.version)
    .alias('v', 'version');

registerCommands(cli).parse();