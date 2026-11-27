const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GROUP = '401';
const PORT = 3000;
const HTTPS_PORT = 3443;
const PUBLIC_DIR = path.join(__dirname, 'public');

let requestCount = 0;
let errorCount = 0;
let totalResponseTime = 0;

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.txt': 'text/plain; charset=utf-8'
};

function sendResponse(response, statusCode, content, contentType = 'text/plain; charset=utf-8') {
    response.writeHead(statusCode, {
        'Content-Type': contentType,
        'X-Group': GROUP
    });
    response.end(content);
}
function middleware(request, response, next) {
    const startTime = Date.now();

    requestCount++;

    response.setHeader('X-Group', GROUP);
    response.setHeader('X-Powered-By', 'Node.js');

    const originalEnd = response.end;

    response.end = function (...args) {
        const duration = Date.now() - startTime;
        totalResponseTime += duration;

        const logEntry = `[${new Date().toISOString()}] ${request.method} ${request.url} ${response.statusCode} ${duration}ms\n`;

        fs.appendFile(path.join(__dirname, 'access.log'), logEntry, () => {});

        originalEnd.apply(response, args);
    };

    next();
}
function serveStatic(request, response) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return false;
    }

    let pathname;

    try {
        pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    } catch {
        sendResponse(response, 400, 'Некорректный URL');
        return true;
    }

    const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
    const filePath = path.resolve(PUBLIC_DIR, relativePath);

    if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== path.join(PUBLIC_DIR, 'index.html')) {
        sendResponse(response, 403, 'Доступ запрещен');
        return true;
    }

    fs.stat(filePath, (error, stats) => {
        if (error || !stats.isFile()) {
            sendResponse(response, 404, 'Файл не найден');
            return;
        }

        const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
        const etag = crypto.createHash('md5').update(`${stats.size}-${stats.mtimeMs}`).digest('hex');
        const lastModified = stats.mtime.toUTCString();

        response.setHeader('Content-Type', contentType);
        response.setHeader('X-Group', GROUP);
        response.setHeader('Cache-Control', 'public, max-age=60');
        response.setHeader('ETag', etag);
        response.setHeader('Last-Modified', lastModified);

        if (request.headers['if-none-match'] === etag || request.headers['if-modified-since'] === lastModified) {
            response.writeHead(304);
            response.end();
            return;
        }

        response.writeHead(200);

        if (request.method === 'HEAD') {
            response.end();
            return;
        }

        fs.createReadStream(filePath).pipe(response);
    });

    return true;
}
function handleMetrics(request, response) {
    if (request.method !== 'GET' || request.url !== '/metrics') {
        return false;
    }

    sendResponse(response, 200, JSON.stringify({
        group: GROUP,
        requests: requestCount,
        errors: errorCount,
        averageResponseTime: requestCount
            ? Math.round(totalResponseTime / requestCount)
            : 0,
        uptime: Math.round(process.uptime())
    }, null, 2), 'application/json; charset=utf-8');

    return true;
}
function requestHandler(request, response) {
    middleware(request, response, () => {
        if (handleMetrics(request, response)) {
            return;
        }

        if (serveStatic(request, response)) {
            return;
        }

        errorCount++;
        sendResponse(response, 404, 'Маршрут не найден');
    });
}
const server = http.createServer(requestHandler);

server.on('error', error => {
    console.error('Ошибка HTTP-сервера:', error.message);
});

server.on('clientError', (error, socket) => {
    errorCount++;

    if (socket.writable) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
});

server.listen(PORT, () => {
    console.log(`HTTP-сервер запущен: http://localhost:${PORT}`);
    console.log(`Группа: ${GROUP}`);
});
const httpsServer = https.createServer({
    pfx: fs.readFileSync(path.join(__dirname, 'certs', 'localhost.pfx')),
    passphrase: 'Lab20Secure123!'
}, requestHandler);

httpsServer.on('error', error => {
    console.error('HTTPS server error:', error.message);
});

httpsServer.listen(HTTPS_PORT, () => {
    console.log(`HTTPS server started: https://localhost:${HTTPS_PORT}`);
});
process.on('SIGINT', () => {
    console.log('\nShutting down servers...');

    server.close(() => {
        console.log('HTTP server closed');
    });

    httpsServer.close(() => {
        console.log('HTTPS server closed');
        console.log('Graceful shutdown completed');
        process.exit(0);
    });
});