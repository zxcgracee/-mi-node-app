
const { Readable, Transform } = require('stream');
const { pipeline } = require('stream/promises');
const fs = require('fs');

const TOTAL = 10000;
const GROUP = '401';

const stats = {
    received: 0,
    valid: 0,
    filtered: 0
};

const errors = [];

async function* generateStudents() {
    for (let i = 1; i <= TOTAL; i++) {
        yield {
            id: i,
            name: i === 1 ? 'Рогацевич Вячеслав' : `Студент ${i}`,
            group: i % 2 === 1 ? '401' : '402',
            score: i % 100,
            email: `student${i}@mail.com`
        };
    }
}

class ValidateTransform extends Transform {
    constructor() {
        super({ objectMode: true });
    }

    _transform(student, encoding, callback) {
        stats.received++;

        if (
            !student.name ||
            !student.group ||
            typeof student.score !== 'number' ||
            student.score < 0 ||
            student.score > 100
        ) {
            errors.push(`Некорректная запись: ${JSON.stringify(student)}`);
            callback();
            return;
        }

        stats.valid++;
        callback(null, student);
    }
}

class EnrichTransform extends Transform {
    constructor() {
        super({ objectMode: true });
    }

    _transform(student, encoding, callback) {
        const enrichedStudent = {
            ...student,
            status: student.score >= 60 ? 'Зачет' : 'Не зачет'
        };

        callback(null, enrichedStudent);
    }
}

class FilterTransform extends Transform {
    constructor() {
        super({ objectMode: true });
    }

    _transform(student, encoding, callback) {
        if (student.group === GROUP) {
            stats.filtered++;
            callback(null, student);
        } else {
            callback();
        }
    }
}

class CsvTransform extends Transform {
    constructor() {
        super({ writableObjectMode: true });
        this.first = true;
    }

    _transform(student, encoding, callback) {
        if (this.first) {
            this.push('ID,Имя,Группа,Балл,Статус\n');
            this.first = false;
        }

        const row = [
            student.id,
            student.name,
            student.group,
            student.score,
            student.status
        ].join(',');

        callback(null, row + '\n');
    }
}

async function main() {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 30000);

    try {
        console.log('Обработка студентов началась');

        await pipeline(
            Readable.from(generateStudents()),
            new ValidateTransform(),
            new EnrichTransform(),
            new FilterTransform(),
            new CsvTransform(),
            fs.createWriteStream('students-401.csv', {
                encoding: 'utf8'
            }),
            { signal: controller.signal }
        );

        console.log('Обработка завершена');
        console.log(`Получено записей: ${stats.received}`);
        console.log(`Проверено записей: ${stats.valid}`);
        console.log(`Отобрано для группы 401: ${stats.filtered}`);

        fs.writeFileSync('errors.log', errors.join('\n'), 'utf8');

        console.log('CSV сохранен: students-401.csv');
        console.log(`Ошибок: ${errors.length}`);
        console.log('Журнал сохранен: errors.log');
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Обработка отменена по тайм-ауту');
        } else {
            console.error('Ошибка обработки:', error.message);
        }
    } finally {
        clearTimeout(timeout);
    }

    console.log('\nСравнение с асинхронным итератором');

    let count = 0;

    for await (const student of Readable.from(generateStudents())) {
        if (student.group === GROUP) {
            count++;
        }

        if (count === 5) {
            break;
        }
    }

    console.log('Асинхронный итератор обработал первые 5 студентов группы 401');
}

main().catch(error => console.error(error));
