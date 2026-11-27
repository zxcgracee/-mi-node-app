const args = process.argv.slice(2);

async function main() {
    const get = (flag) => {
        const index = args.indexOf(flag);
        return index === -1 ? undefined : args[index + 1];
    };

    let name = get('--name');
    let type = get('--type');
    let options = [];
    let git = args.includes('--git');

    const interactive = !args.includes('--no-interactive') && process.stdin.isTTY;

    if (!interactive && (!name || !type)) {
        console.error('Ошибка: в неинтерактивном режиме необходимо указать --name и --type');
        process.exitCode = 1;
        return;
    }

    if (interactive && (!name || !type)) {
        const inquirer = (await import('inquirer')).default;

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Введите название проекта:',
                default: name || 'my-project'
            },
            {
                type: 'select',
                name: 'type',
                message: 'Выберите тип проекта:',
                choices: ['Web-приложение', 'CLI-утилита', 'Библиотека', 'Микросервис']
            },
            {
                type: 'checkbox',
                name: 'options',
                message: 'Выберите дополнительные опции:',
                choices: ['TypeScript', 'ESLint', 'Prettier', 'Jest']
            },
            {
                type: 'confirm',
                name: 'git',
                message: 'Использовать Git?',
                default: true
            },
            {
                type: 'password',
                name: 'token',
                message: 'Введите токен доступа:'
            }
        ]);

        name = answers.name;
        type = answers.type;
        options = answers.options;
        git = answers.git;
    } else {
        options = ['--typescript', '--eslint', '--prettier', '--jest']
            .filter(flag => args.includes(flag))
            .map(flag => flag.slice(2));
    }

    console.log(`✓ Проект "${name}" успешно инициализирован!`);
    console.log(`Тип: ${type}`);
    console.log(`Опции: ${options.join(', ') || 'нет'}`);
    console.log(`Git: ${git ? 'да' : 'нет'}`);
}

main().catch(error => {
    console.error('Ошибка:', error.message);
    process.exitCode = 1;
});