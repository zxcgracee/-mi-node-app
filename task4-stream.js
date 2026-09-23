const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const readline = require('readline');

const VARIANT = 15;
const TOTAL_LINES = 100000;
const DATA_FILE = path.resolve(process.cwd(), `data_${VARIANT}.txt`);
const PROCESSED_FILE = path.resolve(process.cwd(), `processed_${VARIANT}.txt`);
const FILTERED_FILE = path.resolve(process.cwd(), `filtered_${VARIANT}.txt`);

async function generateFile() {
  try {
    await fsp.access(DATA_FILE);
    console.log(`Файл уже существует: data_${VARIANT}.txt`);
    return;
  } catch {}

  console.log(`Генерация файла data_${VARIANT}.txt (${TOTAL_LINES} строк)...`);
  const stream = fs.createWriteStream(DATA_FILE, { encoding: 'utf8' });

  for (let i = 1; i <= TOTAL_LINES; i++) {
    const num = Math.floor(Math.random() * 1000) + 1;
    const line = `${i}, ${num}, Вариант ${VARIANT}\n`;
    if (!stream.write(line)) {
      await new Promise((resolve) => stream.once('drain', resolve));
    }
  }

  await new Promise((resolve, reject) => {
    stream.end((err) => (err ? reject(err) : resolve()));
  });
  console.log('Файл сгенерирован');
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(2) + ' МБ';
}

async function processFile() {
  const stats = await fsp.stat(DATA_FILE);
  console.log('');
  console.log(`Обработка файла: data_${VARIANT}.txt`);
  console.log(`Размер файла: ${formatSize(stats.size)}`);
  console.log('');

  const startTime = Date.now();

  const rl = readline.createInterface({
    input: fs.createReadStream(DATA_FILE, { encoding: 'utf8', highWaterMark: 64 * 1024 }),
    crlfDelay: Infinity
  });

  let count = 0;
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  let lastProgress = 0;

  const filteredStream = fs.createWriteStream(FILTERED_FILE, { encoding: 'utf8' });

  for await (const line of rl) {
    if (!line.trim()) continue;

    const parts = line.split(',').map((s) => s.trim());
    const num = parseInt(parts[1], 10);
    if (isNaN(num)) continue;

    count++;
    sum += num;
    if (num < min) min = num;
    if (num > max) max = num;

    if (num > 500) {
      filteredStream.write(line + '\n');
    }

    const progress = Math.floor((count / TOTAL_LINES) * 100);
    if (progress >= lastProgress + 10) {
      lastProgress = progress;
      console.log(`Прогресс: ${progress}% (${count} строк обработано)`);
    }
  }

  await new Promise((resolve, reject) => {
    filteredStream.end((err) => (err ? reject(err) : resolve()));
  });

  const avg = sum / count;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('');
  console.log('Обработка завершена!');
  console.log('');
  console.log('Результаты:');
  console.log(`- Всего строк: ${count}`);
  console.log(`- Сумма чисел: ${sum}`);
  console.log(`- Среднее значение: ${avg.toFixed(2)}`);
  console.log(`- Максимальное число: ${max}`);
  console.log(`- Минимальное число: ${min}`);
  console.log('');

  const report = [
    `Отчёт по обработке data_${VARIANT}.txt`,
    `Дата: ${new Date().toISOString()}`,
    '',
    `Всего строк: ${count}`,
    `Сумма чисел: ${sum}`,
    `Среднее значение: ${avg.toFixed(2)}`,
    `Максимальное число: ${max}`,
    `Минимальное число: ${min}`,
    '',
    `Время выполнения: ${elapsed} сек`
  ].join('\n');

  await fsp.writeFile(PROCESSED_FILE, report, 'utf8');

  console.log(`Результаты сохранены в: processed_${VARIANT}.txt`);
  console.log(`Строки с числами > 500 сохранены в: filtered_${VARIANT}.txt`);
  console.log(`Время выполнения: ${elapsed} сек`);
}

async function main() {
  try {
    await generateFile();
    await processFile();
  } catch (err) {
    console.error('Ошибка:', err.message);
    process.exit(1);
  }
}

main();