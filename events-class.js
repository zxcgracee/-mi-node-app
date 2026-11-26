
const EventEmitter = require('events');

class DatabaseConnection extends EventEmitter {
    connect() {
        console.log('Подключение к БД...');
        this.emit('connect');
    }

    query(sql) {
        console.log('Выполнение запроса:', sql);

        let result;

        if (sql.startsWith('SELECT')) {
            result = '50 записей';
        } else if (sql.startsWith('INSERT')) {
            result = '1 запись добавлена';
        } else {
            result = 'Запрос выполнен';
        }

        this.emit('query', sql, result);
    }

    close() {
        this.emit('close');
    }

    error(message) {
        this.emit('error', new Error(message));
    }
}

const db = new DatabaseConnection();

console.log('DatabaseConnection (группа 401)');

db.on('connect', () => {
    console.log('[EVENT] Соединение установлено');
});

db.on('query', (sql, result) => {
    console.log('[EVENT] Запрос:', sql);
    console.log('[EVENT] Результат:', result);
});

db.on('close', () => {
    console.log('[EVENT] Соединение закрыто');
});

db.on('error', (error) => {
    console.log('[EVENT] Ошибка:', error.message);
});

db.connect();
db.query('SELECT * FROM students');
db.query('INSERT INTO students');
db.close();

console.log('\nДемонстрация ошибки');

db.error('Connection timeout');

if (process.argv.includes('--crash')) {
    const crashDb = new DatabaseConnection();
    crashDb.error('Connection timeout');
}
