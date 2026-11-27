const os = require('os');

const cpus = os.cpus();

const totalMemory = os.totalmem();
const freeMemory = os.freemem();
const usedMemory = totalMemory - freeMemory;

const totalGB = (totalMemory / 1024 ** 3).toFixed(2);
const freeGB = (freeMemory / 1024 ** 3).toFixed(2);
const usedGB = (usedMemory / 1024 ** 3).toFixed(2);

const usagePercent = ((usedMemory / totalMemory) * 100).toFixed(1);
const freePercent = (100 - usagePercent).toFixed(1);

const averageSpeed = (
    cpus.reduce((sum, cpu) => sum + cpu.speed, 0) / cpus.length
).toFixed(0);

console.log('=== Информация о процессоре ===');
console.log('Количество логических ядер:', cpus.length);
console.log('Модель процессора:', cpus[0].model);
console.log('Средняя частота:', averageSpeed, 'МГц');

console.log('\nЧастота каждого ядра:');

cpus.forEach((cpu, index) => {
    console.log(`Ядро ${index + 1}: ${cpu.speed} МГц`);
});

console.log('\n=== Информация о памяти ===');
console.log('Общий объём:', totalGB, 'ГБ');
console.log('Свободно:', freeGB, 'ГБ');
console.log('Использовано:', usedGB, 'ГБ (' + usagePercent + '%)');

console.log('\n=== Средняя загрузка системы ===');

if (os.platform() === 'win32') {
    console.log('Средняя загрузка недоступна в Windows');
} else {
    console.log('За 1, 5 и 15 минут:', os.loadavg());
}

console.log('\nГруппа: 401');

if (Number(freePercent) < 20) {
    console.log('ВНИМАНИЕ: мало свободной оперативной памяти!');
} else {
    console.log('Память в норме');
}