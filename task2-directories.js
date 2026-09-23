const fs = require('fs').promises;
const path = require('path');

const VARIANT = 15;
const ROOT = path.resolve(process.cwd(), `project_${VARIANT}`);

const structure = {
  'src/modules': 'Модули приложения',
  'src/components': 'Компоненты интерфейса',
  'src/utils': 'Вспомогательные утилиты',
  'data/input': 'Входные данные',
  'data/output': 'Выходные данные',
  'data/temp': 'Временные файлы'
};

async function createStructure() {
  for (const rel of Object.keys(structure)) {
    await fs.mkdir(path.join(ROOT, rel), { recursive: true });
  }
  console.log(`Создана структура: project_${VARIANT}/`);
}

async function createInfoFiles() {
  for (const [rel, description] of Object.entries(structure)) {
    const infoPath = path.join(ROOT, rel, 'info.txt');
    await fs.writeFile(infoPath, `Назначение: ${description}\n`, 'utf8');
  }
  console.log('Созданы info.txt во всех папках');
}

async function createExtraFolders() {
  for (const num of [1, 2, 3]) {
    await fs.mkdir(path.join(ROOT, 'src', 'components', String(num)), { recursive: true });
  }
  console.log('Созданы доп. папки: src/components/{1,2,3}');
}

async function printTree(dir, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const sorted = entries.sort((a, b) => a.name.localeCompare(b.name));

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const isLast = i === sorted.length - 1;
    const branch = isLast ? '└── ' : '├── ';
    console.log(prefix + branch + entry.name);

    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      await printTree(path.join(dir, entry.name), newPrefix);
    }
  }
}

async function main() {
  try {
    await createStructure();
    await createInfoFiles();
    await createExtraFolders();

    console.log('\n=== Исходное дерево ===');
    console.log(`project_${VARIANT}/`);
    await printTree(ROOT, '');

    const oldOutput = path.join(ROOT, 'data', 'output');
    const newResults = path.join(ROOT, 'data', 'results');
    await fs.rename(oldOutput, newResults);
    console.log('\nПереименовано: data/output -> data/results');

    const tempDir = path.join(ROOT, 'data', 'temp');
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log('Удалена папка: data/temp');

    console.log('\n=== Обновлённое дерево ===');
    console.log(`project_${VARIANT}/`);
    await printTree(ROOT, '');
  } catch (err) {
    console.error('Ошибка:', err.message);
    process.exit(1);
  }
}

main();