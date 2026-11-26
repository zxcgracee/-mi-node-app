const args = process.argv.slice(2);

function showHelp() {
    console.log('Использование: my-cli <команда> [аргументы]');
    console.log('Доступные команды:');
    console.log('  greet <имя> - поприветствовать пользователя');
    console.log('  info        - вывести информацию о группе');
}

const command = args[0];

if (!command || command === '--help') {
    showHelp();
} else if (command === 'greet') {
    if (!args[1]) {
        console.error('Ошибка: укажите имя пользователя');
        process.exit(1);
    }
    console.log(`Привет, ${args[1]}! Добро пожаловать в CLI-приложение группы 401.`);
} else if (command === 'info') {
    console.log('Группа: 401');
    console.log('Студент: Vyacheslav Rogatsevich');
    console.log('Лабораторная работа: №17');
    console.log('Дата: 2026-11-27');
} else {
    console.error(`Ошибка: неизвестная команда "${command}"`);
    console.error('Для справки используйте: my-cli --help');
    process.exit(1);
}