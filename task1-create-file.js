const fs = require('fs').promises;
const path = require('path');

const VARIANT = 15;
const FILE_NAME = `student_${VARIANT}.txt`;

const student = {
  name: 'Рогацевич Вячеслав',
  group: 'ИС-202',
  variant: VARIANT,
  date: new Date().toISOString().replace('T', ' ').slice(0, 19),
  favorites: [
    '1. "Мастер и Маргарита" - М. Булгаков',
    '2. "1984" - Дж. Оруэлл',
    '3. "Преступление и наказание" - Ф. Достоевский',
    '4. "Гарри Поттер" - Дж. Роулинг',
    '5. "Война и мир" - Л. Толстой'
  ]
};

async function main() {
  const filePath = path.resolve(process.cwd(), FILE_NAME);

  try {
    // Формируем содержимое
    const lines = [
      `Студент: ${student.name}`,
      `Группа: ${student.group}`,
      `Вариант: ${student.variant}`,
      `Дата: ${student.date}`,
      '',
      'Любимые книги:',
      ...student.favorites
    ];

    // Создаём файл
    await fs.writeFile(filePath, lines.join('\n'), 'utf8');
    console.log(`Создан файл: ${FILE_NAME}`);

    // Читаем файл и считаем количество строк
    let content = await fs.readFile(filePath, 'utf8');
    const lineCount = content.split('\n').length;

    // Добавляем строку "Количество записей: X"
    content += `\n\nКоличество записей: ${lineCount}`;
    await fs.writeFile(filePath, content, 'utf8');

    // Повторно читаем и выводим отформатированно
    const finalContent = await fs.readFile(filePath, 'utf8');
    console.log('\nСодержимое файла:\n');
    console.log(finalContent);
  } catch (err) {
    console.error('Ошибка:', err.message);
    process.exit(1);
  }
}

main();