const { execFileSync } = require('child_process');
const path = require('path');

const cli = path.join(__dirname, '..', 'bin', 'my-cli.js');

try {
    const info = execFileSync('node', [cli, 'info'], { encoding: 'utf8' });

    if (!info.includes('Группа: 401')) {
        throw new Error('Тест команды info не пройден');
    }

    const help = execFileSync('node', [cli, '--help'], { encoding: 'utf8' });

    if (!help.includes('generate')) {
        throw new Error('Тест справки не пройден');
    }

    console.log('Все тесты успешно пройдены!');
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}