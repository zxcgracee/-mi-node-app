
const EventEmitter = require('events');

class PluginManager extends EventEmitter {
    constructor() {
        super();

        this.on('newListener', (eventName) => {
            if (eventName !== 'newListener') {
                console.log(`[newListener] Добавлен слушатель "${eventName}"`);
            }
        });

        this.on('removeListener', (eventName) => {
            if (eventName !== 'removeListener') {
                console.log(`[removeListener] Удалён слушатель "${eventName}"`);
            }
        });
    }

    register(name, eventName, listener) {
        this.on(eventName, listener);
        console.log(`[PLUGIN] Зарегистрирован: ${name}`);
    }

    remove(name, eventName, listener) {
        this.removeListener(eventName, listener);
        console.log(`[PLUGIN] Удалён: ${name}`);
    }
}

console.log('Система плагинов');

const manager = new PluginManager();

function loggerPlugin() {
    console.log('LoggerPlugin работает');
}

function alertPlugin() {
    console.log('AlertPlugin работает');
}

manager.register('LoggerPlugin', 'log', loggerPlugin);
manager.register('AlertPlugin', 'alert', alertPlugin);

manager.emit('log');
manager.emit('alert');

manager.remove('LoggerPlugin', 'log', loggerPlugin);

console.log('\nДемонстрация утечки памяти');

const leakEmitter = new EventEmitter();

const listeners = [];

for (let i = 0; i < 10; i++) {
    const listener = () => {};
    listeners.push(listener);
    leakEmitter.on('data', listener);
}

console.log('Слушателей до:', leakEmitter.listenerCount('data'));

for (let i = 0; i < 1000; i++) {
    leakEmitter.on('data', () => {});
}

console.log('Слушателей после добавления 1000:', leakEmitter.listenerCount('data'));

leakEmitter.removeAllListeners('data');

console.log('Слушателей после removeAllListeners:', leakEmitter.listenerCount('data'));

console.log('\nАсинхронные слушатели');

const asyncEmitter = new EventEmitter();

asyncEmitter.on('task', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('[401] async-слушатель завершён через 100ms');
});

asyncEmitter.emit('task');

console.log('[401] emit вызван (не ждёт async-слушатель)');

setImmediate(() => {
    console.log('[401] setImmediate выполнен');
});
