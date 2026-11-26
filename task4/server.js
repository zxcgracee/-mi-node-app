
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3003;

app.use(express.json());

const logFile = path.join(__dirname, 'operations.log');

let books = [
    { id: 1, title: 'War and Peace', author: 'Leo Tolstoy', year: 1869 },
    { id: 2, title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', year: 1866 },
    { id: 3, title: 'The Master and Margarita', author: 'Mikhail Bulgakov', year: 1967 },
    { id: 4, title: 'Anna Karenina', author: 'Leo Tolstoy', year: 1877 },
    { id: 5, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: 1925 },
    { id: 6, title: '1984', author: 'George Orwell', year: 1949 },
    { id: 7, title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937 },
    { id: 8, title: 'The Catcher in the Rye', author: 'J.D. Salinger', year: 1951 }
];

let nextId = 9;

function logOperation(operation, book) {
    const message = `${new Date().toISOString()} | ${operation} | ${JSON.stringify(book)}\n`;
    fs.appendFileSync(logFile, message);
}

function validateBook(title, author, year) {
    return (
        typeof title === 'string' &&
        title.trim().length > 0 &&
        typeof author === 'string' &&
        author.trim().length > 0 &&
        Number.isInteger(year) &&
        year > 0
    );
}

// Get books with filtering, pagination, sorting and search
app.get('/api/books', (req, res) => {
    let result = [...books];

    const { author, year, yearFrom, yearTo, search, sort } = req.query;

    if (author) {
        result = result.filter(book =>
            book.author.toLowerCase().includes(author.toLowerCase())
        );
    }

    if (year) {
        result = result.filter(book => book.year === Number(year));
    }

    if (yearFrom) {
        result = result.filter(book => book.year >= Number(yearFrom));
    }

    if (yearTo) {
        result = result.filter(book => book.year <= Number(yearTo));
    }

    if (search) {
        result = result.filter(book =>
            book.title.toLowerCase().includes(search.toLowerCase()) ||
            book.author.toLowerCase().includes(search.toLowerCase())
        );
    }

    if (sort === 'title') {
        result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === '-title') {
        result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sort === 'year') {
        result.sort((a, b) => a.year - b.year);
    } else if (sort === '-year') {
        result.sort((a, b) => b.year - a.year);
    }

    const total = result.length;
    const page = Math.max(1, Number.parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit) || 10));
    const start = (page - 1) * limit;

    result = result.slice(start, start + limit);

    res.json({
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        books: result
    });
});

// Get library statistics
app.get('/api/books/stats', (req, res) => {
    const totalBooks = books.length;
    const authors = [...new Set(books.map(book => book.author))];

    const years = books.map(book => book.year);

    res.json({
        totalBooks,
        totalAuthors: authors.length,
        oldestBookYear: Math.min(...years),
        newestBookYear: Math.max(...years),
        authors
    });
});

// Get a book by ID
app.get('/api/books/:id', (req, res) => {
    const book = books.find(item => item.id === Number(req.params.id));

    if (!book) {
        return res.status(404).json({ error: 'Book not found' });
    }

    res.json(book);
});

// Add a book
app.post('/api/books', (req, res) => {
    const { title, author, year } = req.body;

    if (!validateBook(title, author, year)) {
        return res.status(400).json({ error: 'Invalid book data' });
    }

    const duplicate = books.some(book =>
        book.title.toLowerCase() === title.trim().toLowerCase() &&
        book.author.toLowerCase() === author.trim().toLowerCase()
    );

    if (duplicate) {
        return res.status(409).json({ error: 'This book already exists' });
    }

    const newBook = {
        id: nextId++,
        title: title.trim(),
        author: author.trim(),
        year
    };

    books.push(newBook);
    logOperation('CREATE', newBook);

    res.status(201).json(newBook);
});

// Update a book
app.put('/api/books/:id', (req, res) => {
    const book = books.find(item => item.id === Number(req.params.id));

    if (!book) {
        return res.status(404).json({ error: 'Book not found' });
    }

    const { title, author, year } = req.body;

    const updated = {
        title: title === undefined ? book.title : title,
        author: author === undefined ? book.author : author,
        year: year === undefined ? book.year : year
    };

    if (!validateBook(updated.title, updated.author, updated.year)) {
        return res.status(400).json({ error: 'Invalid book data' });
    }

    const duplicate = books.some(item =>
        item.id !== book.id &&
        item.title.toLowerCase() === updated.title.trim().toLowerCase() &&
        item.author.toLowerCase() === updated.author.trim().toLowerCase()
    );

    if (duplicate) {
        return res.status(409).json({ error: 'This book already exists' });
    }

    book.title = updated.title.trim();
    book.author = updated.author.trim();
    book.year = updated.year;

    logOperation('UPDATE', book);

    res.json(book);
});

// Delete a book
app.delete('/api/books/:id', (req, res) => {
    const index = books.findIndex(item => item.id === Number(req.params.id));

    if (index === -1) {
        return res.status(404).json({ error: 'Book not found' });
    }

    const deletedBook = books.splice(index, 1)[0];
    logOperation('DELETE', deletedBook);

    res.json({
        message: 'Book successfully deleted',
        book: deletedBook
    });
});

// Handle invalid JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON format' });
    }

    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Task 4 server is running at http://localhost:${PORT}`);
});
