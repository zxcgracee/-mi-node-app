const FileManager = require('./fileOperations');

const fileManager = new FileManager('./test-data');

console.log(' ТЕСТИРОВАНИЕ КОЛБЭКОВ ');

console.log('1. Создание файла...');

fileManager.createFile('test1.txt', 'Привет, мир!', (err, filePath) => {
    if (err) {
        console.error('Ошибка:', err.message);
        return;
    }

    console.log(`Файл создан: ${filePath}`);

    console.log('2. Чтение файла...');

    fileManager.readFile('test1.txt', (err, content) => {
        if (err) {
            console.error('Ошибка:', err.message);
            return;
        }

        console.log(`Содержимое: ${content}`);

        console.log('3. Получение статистики...');

        fileManager.getFileStats('test1.txt', (err, stats) => {
            if (err) {
                console.error('Ошибка:', err.message);
                return;
            }

            console.log(`Размер: ${stats.size} байт`);
            console.log(`Создан: ${stats.created}`);
            console.log(`Изменён: ${stats.modified}`);

            console.log('4. Создание второго файла...');

            fileManager.createFile('test2.txt', 'Второй файл', (err, filePath) => {
                if (err) {
                    console.error('Ошибка:', err.message);
                    return;
                }

                console.log(`Файл создан: ${filePath}`);

                console.log('5. Список файлов...');

                fileManager.listFiles((err, files) => {
                    if (err) {
                        console.error('Ошибка:', err.message);
                        return;
                    }

                    console.log(files);

                    console.log('6. Удаление файлов...');

                    fileManager.deleteFile('test1.txt', (err) => {
                        if (err) {
                            console.error('Ошибка:', err.message);
                            return;
                        }

                        fileManager.deleteFile('test2.txt', (err) => {
                            if (err) {
                                console.error('Ошибка:', err.message);
                                return;
                            }

                            console.log('Все операции завершены!');
                        });
                    });
                });
            });
        });
    });
});