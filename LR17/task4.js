const chalk = require('chalk');
const ora = require('ora');
const cliProgress = require('cli-progress');
const fs = require('fs');

async function main() {
    const files = process.argv.slice(2);

    if (files.length === 0) {
        return;
    }

    const spinner = ora('Обработка файлов...').start();
    await new Promise(resolve => setTimeout(resolve, 1500));
    spinner.succeed('Обработка завершена');

    const bar = new cliProgress.SingleBar({
        format: 'Прогресс |{bar}| {percentage}% | {value}/{total}'
    }, cliProgress.Presets.shades_classic);

    bar.start(files.length, 0);

    const results = [];

    for (const file of files) {
        await new Promise(resolve => setTimeout(resolve, 500));

        if (fs.existsSync(file)) {
            results.push({ file, status: 'processed' });
            console.log(chalk.green(`✔ Файл ${file} обработан`));
        } else {
            console.error(chalk.red(`✖ Файл ${file} не найден`));
            results.push({ file, status: 'missing' });
        }

        bar.increment();
    }

    bar.stop();

    const missing = results.filter(item => item.status === 'missing').length;

    if (missing > 0) {
        console.error(chalk.yellow(`⚠ Пропущено ${missing} файл(ов)`));
        process.exitCode = 1;
    }

    process.stdout.write(JSON.stringify(results, null, 2));
}

main();