#!/usr/bin/env node

import { Command } from 'commander';
import { login } from './commands/login';
import { practice } from './commands/practice';
import { stats } from './commands/stats';
import { categories } from './commands/categories';
import { logout } from './commands/logout';
import { sync } from './commands/sync';

const program = new Command();

program
  .name('hayaku')
  .description('Terminal-based typing trainer for developers')
  .version('1.0.0');

program
  .command('login')
  .description('Authenticate with your Hayaku account')
  .option('-k, --api-key <key>', 'Use API key for authentication')
  .action(login);

program
  .command('logout')
  .description('Remove stored authentication credentials')
  .action(logout);

program
  .command('practice')
  .description('Start a typing practice session')
  .option('-c, --category <slug>', 'Practice a specific category')
  .option('-d, --difficulty <level>', 'Filter by difficulty (beginner|intermediate|advanced)')
  .option('-r, --random', 'Practice a random challenge')
  .option('--offline', 'Practice in offline mode (will sync later)')
  .action(practice);

program
  .command('categories')
  .description('List all available practice categories')
  .option('-f, --free', 'Show only free categories')
  .action(categories);

program
  .command('stats')
  .description('View your typing statistics')
  .option('-d, --days <number>', 'Show stats for the last N days', '7')
  .option('--detailed', 'Show detailed keystroke analysis')
  .action(stats);

program
  .command('sync')
  .description('Sync offline practice sessions')
  .action(sync);

program.parse();
