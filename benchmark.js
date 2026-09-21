const fs = require('fs');
const path = require('path');

const DIR = './benchmark-data';
const FILE = 'big.txt';
const FILE_PATH = path.join(DIR, FILE);
const SIZE_MB = 20;
const ITERATIONS = 10;

if (!fs.existsSync(DIR)) {
  fs.mkdirSync(DIR, { recursive: true });
}

if (!fs.existsSync(FILE_PATH)) {
  const chunk = 'A'.repeat(1024 * 1024);
  const fd = fs.openSync(FILE_PATH, 'w');
  for (let i = 0; i < SIZE_MB; i++) {
    fs.writeSync(fd, chunk);
  }
  fs.closeSync(fd);
  console.log('Создан тестовый файл ' + SIZE_MB + ' МБ\n');
}

function hr() {
  return process.hrtime.bigint();
}

function ms(start, end) {
  return Number(end - start) / 1e6;
}

function benchSync() {
  const start = hr();
  for (let i = 0; i < ITERATIONS; i++) {
    fs.readFileSync(FILE_PATH);
  }
  return ms(start, hr());
}

function benchCallback() {
  return new Promise((resolve) => {
    const start = hr();
    let done = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      fs.readFile(FILE_PATH, () => {
        done++;
        if (done === ITERATIONS) {
          resolve(ms(start, hr()));
        }
      });
    }
  });
}

async function benchPromise() {
  const start = hr();
  const tasks = [];
  for (let i = 0; i < ITERATIONS; i++) {
    tasks.push(fs.promises.readFile(FILE_PATH));
  }
  await Promise.all(tasks);
  return ms(start, hr());
}

async function benchAsyncSequential() {
  const start = hr();
  for (let i = 0; i < ITERATIONS; i++) {
    await fs.promises.readFile(FILE_PATH);
  }
  return ms(start, hr());
}

async function main() {
  console.log('Файл: ' + SIZE_MB + ' МБ, итераций: ' + ITERATIONS + '\n');

  const t1 = benchSync();
  console.log('1. Синхронно:              ' + t1.toFixed(2) + ' мс');

  const t2 = await benchCallback();
  console.log('2. Колбэки (параллельно):  ' + t2.toFixed(2) + ' мс');

  const t3 = await benchPromise();
  console.log('3. Промисы (Promise.all):  ' + t3.toFixed(2) + ' мс');

  const t4 = await benchAsyncSequential();
  console.log('4. async/await (послед.):  ' + t4.toFixed(2) + ' мс');
}

main();