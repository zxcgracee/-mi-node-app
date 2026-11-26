const os = require('os');

const platform = os.platform();

console.log('=== Информация о системе (группа 401) ===');
console.log('Платформа:', platform);
console.log('Тип ОС:', os.type());
console.log('Архитектура:', os.arch());
console.log('Версия ОС:', os.release());
console.log('Имя хоста:', os.hostname());

const uptime = os.uptime();

const hours = Math.floor(uptime / 3600);
const minutes = Math.floor((uptime % 3600) / 60);
const seconds = Math.floor(uptime % 60);

console.log(`Время работы: ${hours} ч ${minutes} мин ${seconds} сек`);

if (platform === 'win32') {
    console.log('\nВы работаете в Windows');
} else if (platform === 'linux') {
    console.log('\nВы работаете в Linux');
} else if (platform === 'darwin') {
    console.log('\nВы работаете в macOS');
} else {
    console.log('\nНеизвестная платформа');
}