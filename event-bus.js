
const EventEmitter = require('events');
const os = require('os');
const http = require('http');

const GROUP = '401';

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.registry = new Map();
        this.anyListeners = [];
        this.metrics = {};
        this.totalEvents = 0;
    }

    on(event, listener, priority = 0) {
        if (!this.registry.has(event)) {
            this.registry.set(event, []);
        }

        this.registry.get(event).push({
            listener,
            priority,
            once: false
        });

        this.registry.get(event).sort((a, b) => b.priority - a.priority);

        return this;
    }

    once(event, listener, priority = 0) {
        if (!this.registry.has(event)) {
            this.registry.set(event, []);
        }

        this.registry.get(event).push({
            listener,
            priority,
            once: true
        });

        this.registry.get(event).sort((a, b) => b.priority - a.priority);

        return this;
    }

    onAny(listener) {
        this.anyListeners.push(listener);
        return this;
    }

    off(event, listener) {
        if (!this.registry.has(event)) return this;

        const filtered = this.registry.get(event).filter(
            item => item.listener !== listener
        );

        this.registry.set(event, filtered);
        return this;
    }

    emit(event, ...args) {
        this.totalEvents++;

        if (!this.metrics[event]) {
            this.metrics[event] = {
                calls: 0,
                errors: 0,
                lastCall: null
            };
        }

        this.metrics[event].calls++;
        this.metrics[event].lastCall = new Date().toISOString();

        for (const listener of this.anyListeners) {
            listener(event, ...args);
        }

        const listeners = [...(this.registry.get(event) || [])];

        for (const item of listeners) {
            if (item.once) {
                this.off(event, item.listener);
            }

            try {
                item.listener(...args);
            } catch (error) {
                this.metrics[event].errors++;
                console.log(
                    `[ERROR] [${GROUP}] Ошибка в слушателе "${event}": ${error.message}`
                );

                if (event !== 'error') {
                    const errorListeners = this.registry.get('error') || [];

                    if (errorListeners.length > 0) {
                        this.emit('error', error, event);
                    }
                }
            }
        }

        return listeners.length > 0 || this.anyListeners.length > 0;
    }

    getMetrics() {
        const events = {};

        for (const [name, data] of Object.entries(this.metrics)) {
            events[name] = data.calls;
        }

        const listeners = {};

        for (const [name, items] of this.registry.entries()) {
            listeners[name] = items.length;
        }

        return {
            group: GROUP,
            events,
            details: this.metrics,
            total: this.totalEvents,
            listeners
        };
    }
}

const bus = new EventBus();

console.log(`EventBus (группа ${GROUP})`);

bus.on('error', (error, event) => {
    console.log(`[ERROR] [${GROUP}] Обработана ошибка события "${event}"`);
}, 100);

console.log('\nПриоритеты');

bus.on('priority', () => {
    console.log('[priority 0] Низкий приоритет');
}, 0);

bus.on('priority', () => {
    console.log('[priority 10] Высокий приоритет');
}, 10);

bus.on('priority', () => {
    console.log('[priority 5] Средний приоритет');
}, 5);

bus.emit('priority');

console.log('\nWildcard');

bus.onAny((event, ...args) => {
    console.log(`[onAny] Событие "${event}" с аргументами: ${JSON.stringify(args)}`);
});

bus.on('greet', name => {
    console.log(`Привет, ${name}!`);
});

bus.on('info', group => {
    console.log(`Группа: ${group}`);
});

bus.emit('greet', 'Иван');
bus.emit('info', GROUP);

console.log('\nOnce-кэш');

let onceCount = 0;

bus.once('tick', () => {
    onceCount++;
    console.log('[tick] Одноразовый слушатель');
});

bus.on('tick', () => {
    console.log('[tick] Обычный слушатель');
});

bus.emit('tick');
bus.emit('tick');
bus.emit('tick');

console.log('once-слушатель вызван:', onceCount, 'раз');

console.log('\nОбработка ошибок');

bus.on('test', () => {
    throw new Error('Ошибка тестового слушателя');
});

bus.on('test2', () => {
    throw new Error('Ошибка второго слушателя');
});

bus.emit('test');
bus.emit('test2');

console.log('\nМетрики');

const metrics = bus.getMetrics();

for (const [event, count] of Object.entries(metrics.events)) {
    console.log(`${event}: ${count} вызовов`);
}

console.log('Всего событий:', metrics.total);

console.log('\nИнтеграция с OS');

const memory = {
    total: os.totalmem(),
    free: os.freemem()
};

bus.on('system:memory', data => {
    console.log(
        `[OS] Свободная память: ${(data.free / 1024 ** 3).toFixed(2)} ГБ`
    );
});

bus.emit('system:memory', memory);

bus.on('system:cpu', data => {
    console.log(`[OS] Логических процессоров: ${data.length}`);
});

bus.emit('system:cpu', os.cpus());

console.log('\nHTTP-сервер');

const server = http.createServer((req, res) => {
    bus.emit('request', req.method, req.url);

    if (req.url === '/metrics') {
        res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8'
        });

        res.end(JSON.stringify(bus.getMetrics(), null, 2));
    } else {
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8'
        });

        res.end(`EventBus работает. Группа ${GROUP}`);
    }
});

server.listen(3000, () => {
    console.log('HTTP-сервер запущен: http://localhost:3000');
    console.log('Метрики: http://localhost:3000/metrics');
});
