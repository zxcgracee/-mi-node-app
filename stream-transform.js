
const { Transform, Readable } = require('stream');

class UpperCaseTransform extends Transform {
    _transform(chunk, encoding, callback) {
        callback(null, chunk.toString().toUpperCase());
    }
}

class JsonParserTransform extends Transform {
    constructor(options = {}) {
        super({ ...options, readableObjectMode: true });
    }

    _transform(chunk, encoding, callback) {
        try {
            callback(null, JSON.parse(chunk.toString()));
        } catch (error) {
            callback(error);
        }
    }
}

class FilterTransform extends Transform {
    constructor(group) {
        super({ objectMode: true });
        this.group = group;
    }

    _transform(student, encoding, callback) {
        if (student.group === this.group) {
            callback(null, student);
        } else {
            callback();
        }
    }
}

async function main() {
    console.log('Преобразование текста');

    const textStream = Readable.from(['Рогацевич Вячеслав', ' группа 401']);
    textStream
        .pipe(new UpperCaseTransform())
        .on('data', chunk => console.log(chunk.toString()));

    console.log('\nРазбор JSON');

    const jsonStream = Readable.from([
        JSON.stringify({ name: 'Рогацевич Вячеслав', group: '401' }),
        JSON.stringify({ name: 'Студент 2', group: '402' }),
        JSON.stringify({ name: 'Студент 3', group: '401' })
    ]);

    const parser = new JsonParserTransform();
    const filter = new FilterTransform('401');

    jsonStream
        .pipe(parser)
        .pipe(filter)
        .on('data', student => console.log(student))
        .on('error', error => console.error('Ошибка:', error.message))
        .on('end', () => console.log('Фильтрация завершена'));

    console.log('\nАсинхронная итерация');

    const students = Readable.from([
        'Рогацевич Вячеслав',
        'Группа 401',
        'Лабораторная работа 21'
    ]);

    for await (const item of students) {
        console.log(item);
    }
}

main().catch(error => console.error(error));
