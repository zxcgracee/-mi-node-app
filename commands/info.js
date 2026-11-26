module.exports = function (program) {
    program.command('info')
        .description('Информация о студенте')
        .action(() => {
            console.log('Студент: Vyacheslav Rogatsevich');
            console.log('Группа: 401');
            console.log('Лабораторная работа: №17');
        });
};