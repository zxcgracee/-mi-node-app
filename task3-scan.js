const fs = require('fs').promises;
const path = require('path');

const VARIANT = 15;
const ALLOWED_EXT = ['.js', '.json', '.txt', '.md'];

async function scanDir(dir) {
  const result = { files: [], folders: 0 };

  async function walk(current) {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        result.folders++;
        await walk(full);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) continue;

        try {
          const stats = await fs.stat(full);
          result.files.push({
            path: full,
            name: entry.name,
            ext: ext,
            size: stats.size
          });
        } catch {
          continue;
        }
      }
    }
  }

  await walk(dir);
  return result;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(2) + ' МБ';
}

function groupByExt(files) {
  const groups = {};
  for (const f of files) {
    if (!groups[f.ext]) groups[f.ext] = { count: 0, size: 0 };
    groups[f.ext].count++;
    groups[f.ext].size += f.size;
  }
  return groups;
}

async function main() {
  try {
    const target = process.argv[2] || process.cwd();
    const absTarget = path.resolve(target);

    console.log(`Анализ директории: ${target}`);
    console.log('');

    const result = await scanDir(absTarget);

    const totalSize = result.files.reduce((s, f) => s + f.size, 0);

    console.log(`Общее количество папок: ${result.folders}`);
    console.log(`Общее количество файлов: ${result.files.length}`);
    console.log(`Общий размер: ${formatSize(totalSize)} (${totalSize} байт)`);
    console.log('');

    console.log('Расширения файлов:');
    const groups = groupByExt(result.files);
    const sortedExt = Object.entries(groups).sort((a, b) => b[1].count - a[1].count);
    for (const [ext, g] of sortedExt) {
      console.log(`  ${ext}: ${g.count} файлов (${formatSize(g.size)})`);
    }
    console.log('');

    const sortedBySize = [...result.files].sort((a, b) => b.size - a.size);

    console.log('Топ-5 самых больших файлов:');
    sortedBySize.slice(0, 5).forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} (${formatSize(f.size)}) - ${f.path}`);
    });
    console.log('');

    console.log('Топ-5 самых маленьких файлов:');
    sortedBySize.slice(-5).reverse().forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} (${formatSize(f.size)}) - ${f.path}`);
    });
    console.log('');

    const report = {
      variant: VARIANT,
      directory: absTarget,
      totalFiles: result.files.length,
      totalFolders: result.folders,
      totalSizeBytes: totalSize,
      totalSizeKB: +(totalSize / 1024).toFixed(2),
      totalSizeMB: +(totalSize / (1024 * 1024)).toFixed(2),
      extensions: groups,
      top5Largest: sortedBySize.slice(0, 5).map((f) => ({ name: f.name, size: f.size, path: f.path })),
      top5Smallest: sortedBySize.slice(-5).reverse().map((f) => ({ name: f.name, size: f.size, path: f.path })),
      generatedAt: new Date().toISOString()
    };

    const reportPath = path.join(process.cwd(), `report_${VARIANT}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`Отчет сохранен: report_${VARIANT}.json`);
  } catch (err) {
    console.error('Ошибка:', err.message);
    process.exit(1);
  }
}

main();