const { Writable } = require('stream');

let count = 0;

const writable = new Writable({
    highWaterMark: 1,

    write(chunk, encoding, callback) {
        setTimeout(() => {
            count++;
            console.log(`[WRITE] ${chunk.toString('utf8')}`);
            callback();
        }, 300);
    }
});

const chunks = [
    'Группа: 401',
    'Студент: Рогацевич Вячеслав',
    'Лабораторная работа: №21',
    'Тема: Потоки в Node.js'
];

console.log('=== Демонстрация Writable-потока ===\n');

function writeNext(index) {
    if (index >= chunks.length) {
        writable.end();
        return;
    }

    const canContinue = writable.write(chunks[index], 'utf8');

    console.log(`write() вернул: ${canContinue}`);

    if (!canContinue) {
        console.log('[BACKPRESSURE] Буфер заполнен!');
        writable.once('drain', () => {
            console.log('[DRAIN] Буфер освобождён, продолжаем запись\n');
            writeNext(index + 1);
        });
    } else {
        writeNext(index + 1);
    }
}

writable.on('finish', () => {
    console.log('\n[FINISH] Все данные записаны');
    console.log(`Всего записано: ${count} чанка`);
});

writable.on('error', (err) => {
    console.error('[ERROR]', err.message);
});

writeNext(0);