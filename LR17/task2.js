const { Command } = require('commander');

const program = new Command();

program
    .name('my-cli')
    .description('CLI-приложение для лабораторной работы №17')
    .version('1.0.0')
    .option('-v, --verbose', 'подробный вывод');

program.command('generate')
    .description('сгенерировать отчёт')
    .option('-t, --type <type>', 'тип отчёта', 'html')
    .option('-o, --output <path>', 'путь для сохранения')
    .option('-f, --force', 'перезаписать существующий файл')
    .option('--dry-run', 'показать действия без выполнения')
    .action((options) => {
        const types = ['html', 'pdf', 'json', 'csv'];

        if (!types.includes(options.type)) {
            console.error(`Ошибка: недопустимый тип отчёта "${options.type}".`);
            console.error('Допустимые значения: html, pdf, json, csv');
            process.exitCode = 1;
            return;
        }

        const output = options.output || `output.${options.type}`;

        if (program.opts().verbose) {
            console.log('[VERBOSE] Запуск генерации отчёта...');
            console.log(`[VERBOSE] Тип отчёта: ${options.type}`);
            console.log(`[VERBOSE] Путь сохранения: ${output}`);
        }

        if (options.dryRun) {
            console.log(`[DRY-RUN] Будет сгенерирован отчёт типа: ${options.type}`);
            console.log(`[DRY-RUN] Файл будет сохранён в: ${output}`);
            console.log('[DRY-RUN] Действия не выполнены');
            return;
        }

        require('fs').writeFileSync(output, `Report type: ${options.type}`);
        console.log(`Отчёт успешно сгенерирован: ${output}`);
    });

program.command('convert')
    .description('конвертировать файл')
    .option('-i, --input <path>', 'входной файл')
    .option('-o, --output <path>', 'выходной файл')
    .action((options) => {
        console.log(`Входной файл: ${options.input || 'не указан'}`);
        console.log(`Выходной файл: ${options.output || 'не указан'}`);
    });

program.parse();