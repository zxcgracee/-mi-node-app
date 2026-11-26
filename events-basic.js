
const EventEmitter = require('events');

const emitter = new EventEmitter();

console.log('=== Демонстрация EventEmitter ===');

emitter.on('greet', (name) => {
    console.log(`[greet] Привет, ${name}!`);
});

emitter.on('info', () => {
    console.log('[info] Группа: 401');
});

emitter.on('bye', () => {
    console.log('[bye] До свидания!');
});

emitter.emit('greet', 'Иван');
emitter.emit('info');
emitter.emit('bye');

console.log(
    '\nСобытие "unknown" без слушателей:',
    emitter.emit('unknown')
);

console.log(
    'Событие "greet" со слушателями:',
    emitter.emit('greet', 'Вячеслав')
);
