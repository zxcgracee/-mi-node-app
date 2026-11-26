const os = require('os');

const interfaces = os.networkInterfaces();
const user = os.userInfo();

let mainInterface = null;
let interfaceCount = 0;

console.log('=== Сетевые интерфейсы ===');

for (const [name, addresses] of Object.entries(interfaces)) {
    console.log('\nИнтерфейс:', name);
    interfaceCount++;

    for (const address of addresses) {
        const family = address.family === 'IPv4' || address.family === 4
            ? 'IPv4'
            : 'IPv6';

        const macParts = address.mac.split(':');
        const maskedMac = macParts.length === 6
            ? macParts.slice(0, 3).join(':') + ':**:**:**'
            : address.mac;

        console.log(`  ${family}:`, address.address);
        console.log('  MAC:', maskedMac);
        console.log('  Внутренний:', address.internal ? 'да' : 'нет');

        if (family === 'IPv4' && !address.internal && !mainInterface) {
            mainInterface = {
                name,
                address: address.address
            };
        }
    }
}

console.log('\nВсего интерфейсов:', interfaceCount);

if (mainInterface) {
    console.log(
        'Основной интерфейс:',
        `${mainInterface.name} (${mainInterface.address})`
    );
} else {
    console.log('Основной интерфейс не найден');
}

console.log('\n=== Информация о пользователе ===');
console.log('Имя пользователя:', user.username);
console.log('UID:', user.uid === -1 ? 'Недоступен в Windows' : user.uid);
console.log('GID:', user.gid === -1 ? 'Недоступен в Windows' : user.gid);
console.log('Домашняя директория:', user.homedir);
console.log('Оболочка:', process.env.SHELL || process.env.ComSpec || 'Неизвестна');

console.log('\nГруппа: 401');

if (os.platform() === 'win32') {
    console.log('Проверка root: Windows, проверка UID неприменима');
} else {
    console.log('Проверка root:', user.uid === 0 ? 'да' : 'нет');
}