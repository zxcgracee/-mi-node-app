const os = require('os');
const fs = require('fs');

const GROUP = '401';
const LOG_FILE = 'monitor.log';

let warnings = 0;
let previousCpus = os.cpus();

const snapshot = {
    timestamp: new Date().toISOString(),
    group: GROUP,
    system: {
        platform: os.platform(),
        type: os.type(),
        architecture: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: os.uptime()
    },
    cpu: os.cpus(),
    memory: {
        total: os.totalmem(),
        free: os.freemem()
    },
    loadAverage: os.platform() === 'win32' ? null : os.loadavg(),
    network: os.networkInterfaces(),
    user: os.userInfo()
};

console.log('=== Первичный сбор данных ===');
console.log('Группа:', snapshot.group);
console.log('Платформа:', snapshot.system.platform);
console.log('Имя компьютера:', snapshot.system.hostname);
console.log('Процессор:', snapshot.cpu[0].model);
console.log('Количество ядер:', snapshot.cpu.length);
console.log('Общая память:', (snapshot.memory.total / 1024 ** 3).toFixed(2), 'ГБ');
console.log('Пользователь:', snapshot.user.username);
console.log('Время сбора:', snapshot.timestamp);

console.log('\nМониторинг (группа 401). Ctrl+C для выхода.');

function getCpuUsage(previous, current) {
    let idleDiff = 0;
    let totalDiff = 0;

    for (let i = 0; i < current.length; i++) {
        const oldTimes = previous[i].times;
        const newTimes = current[i].times;

        const oldTotal = Object.values(oldTimes).reduce((a, b) => a + b, 0);
        const newTotal = Object.values(newTimes).reduce((a, b) => a + b, 0);

        totalDiff += newTotal - oldTotal;
        idleDiff += newTimes.idle - oldTimes.idle;
    }

    if (totalDiff <= 0) return 0;

    return ((totalDiff - idleDiff) / totalDiff) * 100;
}

function writeWarning(message) {
    const date = new Date();
    const timestamp = date.toLocaleString('sv-SE').replace('T', ' ');

    const line = `[${timestamp}] [${GROUP}] Предупреждение: ${message}`;

    fs.appendFileSync(LOG_FILE, line + '\n');
    warnings++;
}

const interval = setInterval(() => {
    const currentCpus = os.cpus();
    const cpuUsage = getCpuUsage(previousCpus, currentCpus);

    previousCpus = currentCpus;

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const freePercent = (freeMemory / totalMemory) * 100;
    const usedPercent = 100 - freePercent;

    let cpuStatus = 'Норма';
    let warningSymbol = '';

    if (cpuUsage > 80) {
        cpuStatus = 'Критично';
        warningSymbol = ' ⚠⚠';
        writeWarning(`Критическая загрузка CPU: ${cpuUsage.toFixed(1)}%`);
    } else if (cpuUsage > 50) {
        cpuStatus = 'Предупреждение';
        warningSymbol = ' ⚠';
        writeWarning(`Высокая загрузка CPU: ${cpuUsage.toFixed(1)}%`);
    }

    if (freePercent < 10) {
        warningSymbol += ' ⚠';
        writeWarning(`Мало свободной памяти: ${freePercent.toFixed(1)}%`);
    }

    const line = `CPU: ${cpuUsage.toFixed(1)}% (${cpuStatus}) | RAM: ${usedPercent.toFixed(1)}% (${(freeMemory / 1024 ** 3).toFixed(2)} ГБ свободно)${warningSymbol}`;

    process.stdout.write('\r' + line.padEnd(110));
}, 2000);

process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n\nМониторинг остановлен. Предупреждений:', warnings);
    process.exit(0);
});