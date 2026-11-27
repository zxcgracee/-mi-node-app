
const fs = require('fs');
const { pipeline, Transform } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

async function main() {
    console.log('\nДемонстрация pipe()');

    fs.writeFileSync(
        'input.txt',
        'Группа: 401\nСтудент: Рогацевич Вячеслав\nЛабораторная работа №21. Потоки в Node.js',
        'utf8'
    );

    await new Promise((resolve, reject) => {
        const source = fs.createReadStream('input.txt', { encoding: 'utf8' });
        const destination = fs.createWriteStream('output-pipe.txt', { encoding: 'utf8' });

        source.on('error', reject);
        destination.on('error', reject);
        destination.on('finish', resolve);

        source.pipe(destination);
    });

    console.log('✓ Копирование завершено');
    console.log('Файл: output-pipe.txt');

    console.log('\nДемонстрация pipe() с ошибкой');

    await new Promise((resolve) => {
        const source = fs.createReadStream('missing.txt');
        const destination = fs.createWriteStream('error-pipe.txt');

        source.on('error', (err) => {
            console.log('✗ Ошибка:', err.code);
            console.log('⚠ pipe() не закрывает целевой поток автоматически');
            destination.destroy();
            resolve();
        });

        destination.on('error', (err) => {
            console.log('✗ Ошибка записи:', err.code);
            resolve();
        });

        source.pipe(destination);
    });

    console.log('\nДемонстрация pipeline()');

    await pipelineAsync(
        fs.createReadStream('input.txt'),
        fs.createWriteStream('output-pipeline.txt')
    );

    console.log('✓ Копирование завершено');
    console.log('Файл: output-pipeline.txt');

    console.log('\nДемонстрация pipeline() с ошибкой');

    try {
        await pipelineAsync(
            fs.createReadStream('missing.txt'),
            fs.createWriteStream('error-pipeline.txt')
        );
    } catch (err) {
        console.log('✗ Ошибка:', err.code);
        console.log('✓ Потоки автоматически закрыты');
    }

    console.log('\nЦепочка потоков');

    const uppercase = new Transform({
        transform(chunk, encoding, callback) {
            callback(null, chunk.toString('utf8').toUpperCase());
        }
    });

    const reverse = new Transform({
        transform(chunk, encoding, callback) {
            callback(null, chunk.toString('utf8').split('').reverse().join(''));
        }
    });

    await pipelineAsync(
        fs.createReadStream('input.txt'),
        uppercase,
        reverse,
        fs.createWriteStream('output-chain.txt')
    );

    console.log('✓ Обработка завершена');
    console.log('Файл: output-chain.txt');
}

main().catch((err) => {
    console.error('Ошибка выполнения:', err);
    process.exitCode = 1;
});
