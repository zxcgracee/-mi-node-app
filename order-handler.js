const EventEmitter = require('events');

class OrderHandler extends EventEmitter {
    processOrder(orderId) {

        this.emit('order:start', orderId);


        setTimeout(() => {
            this.emit('order:processing', 'Идёт обработка...');


            setTimeout(() => {

                const sum = Math.floor(Math.random() * 901) + 100;

                this.emit('order:complete', {
                    orderId: orderId,
                    sum: sum
                });
            }, 2000);
        }, 2000);
    }
}

module.exports = OrderHandler;