const fs = require('fs');

function setupLogger(app) {
    app.on('server:started', (port) => {
        const message = `[${new Date().toISOString()}] СОБЫТИЕ: server:started - ${port}\n`;

        fs.appendFile('logs.txt', message, (err) => {
            if (err) {
                console.error('Ошибка записи в лог:', err);
            }
        });
    });

    app.on('server:stopped', () => {
        const message = `[${new Date().toISOString()}] СОБЫТИЕ: server:stopped\n`;

        fs.appendFile('logs.txt', message, (err) => {
            if (err) {
                console.error('Ошибка записи в лог:', err);
            }
        });
    });

    app.on('request:received', ({ method, url }) => {
        const message = `[${new Date().toISOString()}] СОБЫТИЕ: request:received - ${method} ${url}\n`;

        fs.appendFile('logs.txt', message, (err) => {
            if (err) {
                console.error('Ошибка записи в лог:', err);
            }
        });
    });
}

module.exports = {
    setupLogger
};