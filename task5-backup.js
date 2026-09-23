const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const VARIANT = 15;
const SOURCE = path.resolve(process.cwd(), `source_${VARIANT}`);
const BACKUP = path.resolve(process.cwd(), `backup_${VARIANT}`);
const SYNC_REPORT = path.resolve(process.cwd(), `sync_report_${VARIANT}.txt`);

const STREAM_EXT = ['.txt', '.js', '.json'];
const PLAIN_EXT = ['.jpg', '.png', '.gif'];

const FILES = [
  { name: 'doc1.txt', size: 2000 },
  { name: 'doc2.txt', size: 5000 },
  { name: 'script1.js', size: 3000 },
  { name: 'script2.js', size: 8000 },
  { name: 'data1.json', size: 1500 },
  { name: 'data2.json', size: 4000 },
  { name: 'image1.jpg', size: 12000 },
  { name: 'image2.png', size: 15000 },
  { name: 'image3.gif', size: 9000 },
  { name: 'notes.txt', size: 1000 },
  { name: 'readme.txt', size: 700 },
  { name: 'config.json', size: 600 },
  { name: 'app.js', size: 2500 },
  { name: 'style.txt', size: 300 },
  { name: 'photo.jpg', size: 20000 },
  { name: 'icon.png', size: 3000 },
  { name: 'big.txt', size: 1500000 },
  { name: 'big.js', size: 1200000 },
  { name: 'small.txt', size: 100 },
  { name: 'tiny.json', size: 50 },
];

const SUBFOLDERS = [
  { dir: 'sub1', files: ['a.txt', 'b.js', 'c.json'] },
  { dir: 'sub2', files: ['d.txt', 'e.jpg'] },
  { dir: 'sub3', files: ['f.png', 'g.md', 'h.txt'] },
];

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

function randomContent(size) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 \n';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function createTestStructure() {
  await ensureDir(SOURCE);
  const manifest = [];

  for (const f of FILES) {
    const fullPath = path.join(SOURCE, f.name);
    await fsp.writeFile(fullPath, randomContent(f.size), 'utf8');
    manifest.push({ name: f.name, size: f.size, ext: path.extname(f.name) });
  }

  for (const sub of SUBFOLDERS) {
    const subDir = path.join(SOURCE, sub.dir);
    await ensureDir(subDir);
    for (const fname of sub.files) {
      const fullPath = path.join(subDir, fname);
      const size = Math.floor(Math.random() * 5000) + 500;
      await fsp.writeFile(fullPath, randomContent(size), 'utf8');
      manifest.push({ name: `${sub.dir}/${fname}`, size, ext: path.extname(fname) });
    }
  }

  await fsp.writeFile(
    path.join(SOURCE, 'manifest.json'),
    JSON.stringify({ variant: VARIANT, files: manifest, createdAt: new Date().toISOString() }, null, 2),
    'utf8'
  );

  console.log(`Создана тестовая структура: source_${VARIANT}/`);
  console.log(`  Файлов: ${manifest.length + 1}`);
}

async function getAllFiles(dir, base = dir) {
  const result = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full);

    if (entry.isDirectory()) {
      result.push(...(await getAllFiles(full, base)));
    } else if (entry.isFile()) {
      const stats = await fsp.stat(full);
      result.push({ rel, full, size: stats.size, mtime: stats.mtimeMs });
    }
  }

  return result;
}

function copyStream(src, dest) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(src, { highWaterMark: 64 * 1024 });
    const writeStream = fs.createWriteStream(dest);
    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);
    readStream.pipe(writeStream);
  });
}

async function copyPlain(src, dest) {
  await fsp.copyFile(src, dest);
}

async function incrementalCopy() {
  await ensureDir(BACKUP);

  const sourceFiles = await getAllFiles(SOURCE);
  const backupFiles = (await getAllFiles(BACKUP).catch(() => []));

  const backupMap = new Map();
  for (const f of backupFiles) backupMap.set(f.rel, f);

  let copied = 0;
  let skipped = 0;
  let streamCount = 0;
  let plainCount = 0;
  let totalSize = 0;

  for (const src of sourceFiles) {
    const destPath = path.join(BACKUP, src.rel);
    const destDir = path.dirname(destPath);
    await ensureDir(destDir);

    const existing = backupMap.get(src.rel);
    const isChanged =
      !existing ||
      existing.size !== src.size ||
      Math.abs(existing.mtime - src.mtime) > 1000;

    if (!isChanged) {
      skipped++;
      continue;
    }

    const ext = path.extname(src.rel).toLowerCase();

    if (STREAM_EXT.includes(ext)) {
      await copyStream(src.full, destPath);
      streamCount++;
    } else {
      await copyPlain(src.full, destPath);
      plainCount++;
    }

    totalSize += src.size;
    copied++;

    if (copied % 5 === 0 || copied === sourceFiles.length) {
      console.log(`Прогресс копирования: ${copied}/${sourceFiles.length} файлов`);
    }
  }

  return { copied, skipped, streamCount, plainCount, totalSize };
}

async function syncDirs() {
  const sourceFiles = await getAllFiles(SOURCE);
  const backupFiles = await getAllFiles(BACKUP).catch(() => []);

  const srcMap = new Map(sourceFiles.map((f) => [f.rel, f]));
  const bakMap = new Map(backupFiles.map((f) => [f.rel, f]));

  const same = [];
  const changed = [];
  const added = [];
  const removed = [];

  for (const [rel, src] of srcMap) {
    const bak = bakMap.get(rel);
    if (!bak) {
      added.push(rel);
    } else if (bak.size !== src.size) {
      changed.push(rel);
    } else {
      same.push(rel);
    }
  }

  for (const rel of bakMap.keys()) {
    if (!srcMap.has(rel)) removed.push(rel);
  }

  const lines = [
    `Sync report: source_${VARIANT} vs backup_${VARIANT}`,
    `Date: ${new Date().toISOString()}`,
    '',
    `Same: ${same.length} files`,
    `Changed: ${changed.length} files`,
    `Added: ${added.length} files`,
    `Removed: ${removed.length} files`,
    '',
  ];

  if (changed.length) {
    lines.push('Changed files:');
    changed.forEach((f) => lines.push(`  - ${f}`));
    lines.push('');
  }
  if (added.length) {
    lines.push('Added files:');
    added.forEach((f) => lines.push(`  - ${f}`));
    lines.push('');
  }
  if (removed.length) {
    lines.push('Removed files:');
    removed.forEach((f) => lines.push(`  - ${f}`));
  }

  await fsp.writeFile(SYNC_REPORT, lines.join('\n'), 'utf8');

  return { same: same.length, changed: changed.length, added: added.length, removed: removed.length };
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(2) + ' МБ';
}

async function main() {
  try {
    console.log(`Исходная директория: source_${VARIANT}`);
    console.log(`Директория назначения: backup_${VARIANT}`);
    console.log('');

    await createTestStructure();

    const all = await getAllFiles(SOURCE);
    const byExt = {};
    for (const f of all) {
      const ext = path.extname(f.rel).toLowerCase() || 'other';
      if (!byExt[ext]) byExt[ext] = { count: 0, size: 0 };
      byExt[ext].count++;
      byExt[ext].size += f.size;
    }

    console.log('');
    console.log(`Обнаружено файлов: ${all.length}`);
    for (const [ext, g] of Object.entries(byExt)) {
      const mode = STREAM_EXT.includes(ext) ? 'потоковое' : 'обычное';
      console.log(`  ${ext}: ${g.count} файлов (${formatSize(g.size)}) - ${mode} копирование`);
    }
    console.log('');

    const startTime = Date.now();
    const copyStats = await incrementalCopy();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('Копирование завершено!');
    console.log('');
    console.log('Статистика:');
    console.log(`- Скопировано файлов: ${copyStats.copied}`);
    console.log(`- Пропущено (без изменений): ${copyStats.skipped}`);
    console.log(`- Потоковое копирование: ${copyStats.streamCount} файлов`);
    console.log(`- Обычное копирование: ${copyStats.plainCount} файлов`);
    console.log(`- Общий размер: ${formatSize(copyStats.totalSize)}`);
    console.log(`- Время выполнения: ${elapsed} сек`);
    console.log('');

    const sync = await syncDirs();

    console.log('Сравнение директорий:');
    console.log(`- Совпадают: ${sync.same} файлов`);
    console.log(`- Изменены: ${sync.changed} файлов`);
    console.log(`- Добавлены: ${sync.added} файлов`);
    console.log(`- Удалены: ${sync.removed} файлов`);
    console.log('');
    console.log(`Отчет сохранен: sync_report_${VARIANT}.txt`);
  } catch (err) {
    console.error('Ошибка:', err.message);
    process.exit(1);
  }
}

main();