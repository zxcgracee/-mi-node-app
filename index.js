const http = require('http');
const EventEmitter = require('events');
const logger = require('./logger');
const OrderHandler = require('./order-handler');

class AppServer extends EventEmitter {
    constructor() {
        super();

        this.server = http.createServer((req, res) => {

         
            this.emit('request:received', {
                url: req.url,
                method: req.method
            });

          
            if (req.url.startsWith('/order/')) {
                const orderId = req.url.split('/')[2];

                orderHandler.processOrder(orderId);

                res.writeHead(200, {
                    'Content-Type': 'text/plain; charset=utf-8'
                });

                res.end('Заказ #' + orderId + ' принят в обработку');
                return;
            }

          
            res.writeHead(200, {
                'Content-Type': 'text/plain; charset=utf-8'
            });

            res.end('Hello from Event-Driven Server!');
        });
    }


    start(port) {
        this.server.listen(port, () => {
            this.emit('server:started', port);
        });
    }


    stop() {
        this.server.close(() => {
            this.emit('server:stopped');
        });
    }
}


function calculatePi(digits) {
    let pi = 0;
    const iterations = 10000000;

    for (let i = 0; i < iterations; i++) {
        const term = 4 / (2 * i + 1);

        if (i % 2 === 0) {
            pi += term;
        } else {
            pi -= term;
        }
    }

    return pi.toFixed(digits);
}

const app = new AppServer();


const orderHandler = new OrderHandler();


logger.setupLogger(app);


orderHandler.on('order:start', (orderId) => {
    console.log('Заказ #' + orderId + ' начат');
});


orderHandler.on('order:processing', (message) => {
    console.log('Заказ: ' + message);
});


orderHandler.on('order:complete', ({ orderId, sum }) => {
    const pi = calculatePi(7);

    console.log(
        'Заказ #' + orderId +
        ' завершён на сумму ' + sum +
        ' руб. PI = ' + pi
    );
});


app.on('server:started', (port) => {
    console.log('Сервер запущен на порту ' + port);
});


app.on('request:received', ({ method, url }) => {
    console.log('Получен запрос: ' + method + ' ' + url);
});


app.on('server:stopped', () => {
    console.log('Сервер остановлен');
});


app.start(3000);


setTimeout(() => {
    app.stop();
}, 10000);