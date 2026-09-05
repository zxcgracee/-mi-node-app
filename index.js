const http = require('http');


const fio = "Рогацевич Вячеслав Павлович"; 
const group = "Группа 301";
const journalNumber = 15; //


function calculatePi(digits) {
    let pi = 3.0;
    let sign = 1;
    for (let i = 2; i <= 500000; i += 2) {
        pi += sign * (4.0 / (i * (i + 1) * (i + 2)));
        sign *= -1;
    }
    return pi.toFixed(digits);
}

const piValue = calculatePi(journalNumber);


console.log(fio); 
console.log(group);
console.log(piValue);


const PORT = 3000;
const server = http.createServer((req, res) => {
    
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    
    
    res.write(`${fio}\n`);
    res.write(`${group}\n`);
    res.write(`${piValue}\n`);
    res.end();
});


server.listen(PORT, () => {
    console.log(`\n[Сервер запущен! Откройте в браузере: http://localhost:${PORT}]`);
});
