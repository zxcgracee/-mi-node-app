
const express = require('express');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;

app.use(express.json());

const logFile = path.join(__dirname, 'requests.log');

app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `${new Date().toISOString()} | ${req.method} | ${req.originalUrl} | ${res.statusCode} | ${duration}ms\n`;

        fs.appendFileSync(logFile, message);
        console.log(message.trim());
    });

    next();
});

app.use(compression({ threshold: 0 }));

const requests = new Map();

app.use((req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 100;

    let data = requests.get(ip);

    if (!data || now - data.start >= windowMs) {
        data = { start: now, count: 0 };
    }

    data.count++;
    requests.set(ip, data);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - data.count));

    if (data.count > maxRequests) {
        return res.status(429).json({
            error: 'Too many requests. Please try again later.'
        });
    }

    next();
});

app.get('/', (req, res) => {
    res.json({
        message: 'Laboratory Work 16 - Task 3',
        routes: ['/error', '/async-error']
    });
});

app.get('/error', (req, res, next) => {
    next(new Error('This is a test error'));
});

app.get('/async-error', async (req, res, next) => {
    try {
        await Promise.reject(new Error('This is an asynchronous test error'));
    } catch (error) {
        next(error);
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        status: err.status || 500
    });
});

app.listen(PORT, () => {
    console.log(`Task 3 server is running at http://localhost:${PORT}`);
});
