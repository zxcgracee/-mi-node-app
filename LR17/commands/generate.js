const { generateReport } = require('../services/report-service');

module.exports = function (program) {
    program.command('generate')
        .description('Создание отчёта')
        .option('-t, --type <type>', 'Тип отчёта', 'html')
        .option('-o, --output <file>', 'Имя файла', 'report.html')
        .action((options) => {
            const types = ['html', 'pdf', 'json', 'csv'];

            if (!types.includes(options.type)) {
                console.error('Ошибка: неверный тип отчёта');
                process.exitCode = 1;
                return;
            }

            const file = generateReport(options.type, options.output);
            console.log(`Отчёт создан: ${file}`);
        });
};