const fs = require('fs');

function generateReport(type, output) {
    const content = `Отчёт лабораторной работы №17
Студент: Vyacheslav Rogatsevich
Группа: 401
Тип отчёта: ${type}`;

    fs.writeFileSync(output, content);
    return output;
}

module.exports = { generateReport };