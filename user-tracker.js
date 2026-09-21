const EventEmitter = require('events');

class UserTracker extends EventEmitter {
    trackAction(userId, action, metadata) {
        const eventData = {
            userId: userId,
            action: action,
            timestamp: new Date().toISOString(),
            metadata: metadata,
            id: Math.random().toString(36).substr(2, 9)
        };

        this.emit('user:action', eventData);
    }
}


const tracker = new UserTracker();

tracker.on('user:action', (data) => {
    console.log('Пользователь: ' + data.userId);
    console.log('Действие: ' + data.action);
    console.log('Время: ' + data.timestamp);
    console.log('Данные:', data.metadata);
    console.log('ID события: ' + data.id);
    console.log('-------------------------');
});


tracker.trackAction('user1', 'login', {
    browser: 'Chrome',
    device: 'PC'
});

tracker.trackAction('user2', 'purchase', {
    product: 'Volvo',
    price: 500
});

tracker.trackAction('user1', 'logout', {
    reason: 'user action'
});