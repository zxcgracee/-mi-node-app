const { Readable } = require('stream');

let chunks = [
    'Группа: 401',
    'Студент: Рогацевич Вячеслав',
    'Лабораторная работа: №21',
    'Тема: Потоки в Node.js'
];

let index = 0;
let totalBytes = 0;
let totalChunks = 0;

const readable = new Readable({
    read() {
        if (index < chunks.length) {
            const chunk = chunks[index++];
            this.push(chunk);
        } else {
            this.push(null);
        }
    }
});

console.log('=== Демонстрация Readable-потока ===\n');

readable.on('data', (chunk) => {
    totalChunks++;
    totalBytes += chunk.length;
    console.log(`[CHUNK ${totalChunks}] ${chunk.toString('utf8')}`);
});

readable.on('end', () => {
    console.log('\n[END] Поток завершён');
    console.log(`Всего получено чанков: ${totalChunks}`);
    console.log(`Общий размер данных: ${totalBytes} байт`);
});

readable.on('error', (err) => {
    console.error('[ERROR]', err.message);
});