
const EventEmitter = require('events');

const emitter = new EventEmitter();

let onCount = 0;
let onceCount = 0;

console.log('Сравнение on и once');

emitter.on('tick', () => {
    onCount++;
    console.log(`[tick #${onCount}] on-слушатель`);
});

emitter.once('tick', () => {
    onceCount++;
    console.log(`[tick #${onCount}] once-слушатель`);
});

emitter.emit('tick');
emitter.emit('tick');
emitter.emit('tick');

console.log('\non-слушатель вызван:', onCount, 'раза');
console.log('once-слушатель вызван:', onceCount, 'раз');

console.log('\nУправление подписками');

const testEmitter = new EventEmitter();

function listener1() {
    console.log('Первый слушатель');
}

function listener2() {
    console.log('Второй слушатель');
}

function listener3() {
    console.log('Третий слушатель');
}

testEmitter.on('test', listener1);
testEmitter.on('test', listener2);
testEmitter.addListener('test', listener3);

console.log('Слушателей до удаления:', testEmitter.listenerCount('test'));
console.log('Массив слушателей:', testEmitter.listeners('test').length);

testEmitter.removeListener('test', listener2);

console.log('Слушателей после удаления одного:', testEmitter.listenerCount('test'));

testEmitter.removeAllListeners('test');

console.log('Слушателей после removeAllListeners:', testEmitter.listenerCount('test'));

console.log('\nПорядок вызова');

const orderEmitter = new EventEmitter();

orderEmitter.on('order', () => {
    console.log('Первый слушатель (группа 401)');
});

orderEmitter.on('order', () => {
    console.log('Второй слушатель');
});

orderEmitter.on('order', () => {
    console.log('Третий слушатель');
});

orderEmitter.emit('order');
