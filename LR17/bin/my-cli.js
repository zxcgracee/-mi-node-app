#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();

program
    .name('my-cli')
    .description('CLI-приложение лабораторной работы №17')
    .version('1.0.0');

require('../commands/info')(program);
require('../commands/generate')(program);

program.parse(process.argv);