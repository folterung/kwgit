#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { registerCommands } from '../src/commands/index.js';

const cli = yargs(hideBin(process.argv))
    .scriptName('kwgit')
    .usage('$0 <command> [options]')
    .recommendCommands()
    .strict()
    .demandCommand(1, 'Please specify a valid command.')
    .help()
    .alias('h', 'help')
    .version('1.0.0')
    .alias('v', 'version');

registerCommands(cli).parse();