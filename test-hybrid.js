const FileManagerHybrid = require('./fileOperationsHybrid');

const fileManager = new FileManagerHybrid('./test-data-hybrid');

console.log(' ТЕСТИРОВАНИЕ ГИБРИДНОГО ПОДХОДА \n');

function testCallbacks() {
  return new Promise((resolve, reject) => {
    console.log(' Часть 1: колбэки ');

    fileManager.createFile('cb1.txt', 'Файл через колбэк', (err, filePath) => {
      if (err) return reject(err);
      console.log('Файл создан: ' + filePath);

      fileManager.readFile('cb1.txt', (err, content) => {
        if (err) return reject(err);
        console.log('Содержимое: ' + content);

        fileManager.getFileStats('cb1.txt', (err, stats) => {
          if (err) return reject(err);
          console.log('Размер: ' + stats.size + ' байт');

          fileManager.listFiles((err, files) => {
            if (err) return reject(err);
            console.log('Файлы: ' + files.join(', '));
            resolve();
          });
        });
      });
    });
  });
}

async function testPromises() {
  console.log('\n Часть 2: промисы ');

  const filePath = await fileManager.createFile('pr1.txt', 'Файл через промис');
  console.log('Файл создан: ' + filePath);

  const content = await fileManager.readFile('pr1.txt');
  console.log('Содержимое: ' + content);

  const stats = await fileManager.getFileStats('pr1.txt');
  console.log('Размер: ' + stats.size + ' байт');

  const files = await fileManager.listFiles();
  console.log('Файлы: ' + files.join(', '));

  return files;
}

async function main() {
  try {
    await testCallbacks();
    const files = await testPromises();

    console.log('\n Очистка ');
    for (const file of files) {
      await fileManager.deleteFile(file);
      console.log(file + ' удалён');
    }

    console.log('\nВсе операции завершены!');
  } catch (error) {
    console.error('Ошибка: ' + error.message);
  }
}

main();