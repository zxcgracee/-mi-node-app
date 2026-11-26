
const express = require('express');

const app = express();
const PORT = 3001;

app.use(express.json());

let books = [
    { id: 1, title: 'War and Peace', author: 'Leo Tolstoy', year: 1869 },
    { id: 2, title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', year: 1866 },
    { id: 3, title: 'The Master and Margarita', author: 'Mikhail Bulgakov', year: 1967 },
    { id: 4, title: 'Anna Karenina', author: 'Leo Tolstoy', year: 1877 }
];

let nextId = 5;

// Get all books
app.get('/api/books', (req, res) => {
    res.json(books);
});

// Search books by author
app.get('/api/books/search', (req, res) => {
    const author = req.query.author;

    if (!author) {
        return res.status(400).json({
            error: 'Author parameter is required'
        });
    }

    const results = books.filter(book =>
        book.author.toLowerCase().includes(author.toLowerCase())
    );

    res.json(results);
});

// Get a book by ID
app.get('/api/books/:id', (req, res) => {
    const book = books.find(b => b.id === Number(req.params.id));

    if (!book) {
        return res.status(404).json({ error: 'Book not found' });
    }

    res.json(book);
});

// Add a new book
app.post('/api/books', (req, res) => {
    const { title, author, year } = req.body;

    if (
        typeof title !== 'string' || !title.trim() ||
        typeof author !== 'string' || !author.trim() ||
        !Number.isInteger(year) || year < 1
    ) {
        return res.status(400).json({
            error: 'Invalid data. Title, author and a valid year are required'
        });
    }

    const newBook = {
        id: nextId++,
        title: title.trim(),
        author: author.trim(),
        year
    };

    books.push(newBook);

    res.status(201).json(newBook);
});

// Update a book
app.put('/api/books/:id', (req, res) => {
    const book = books.find(b => b.id === Number(req.params.id));

    if (!book) {
        return res.status(404).json({ error: 'Book not found' });
    }

    const { title, author, year } = req.body;

    if (
        (title !== undefined && (typeof title !== 'string' || !title.trim())) ||
        (author !== undefined && (typeof author !== 'string' || !author.trim())) ||
        (year !== undefined && (!Number.isInteger(year) || year < 1))
    ) {
        return res.status(400).json({ error: 'Invalid book data' });
    }

    if (title !== undefined) book.title = title.trim();
    if (author !== undefined) book.author = author.trim();
    if (year !== undefined) book.year = year;

    res.json(book);
});

// Delete a book
app.delete('/api/books/:id', (req, res) => {
    const index = books.findIndex(b => b.id === Number(req.params.id));

    if (index === -1) {
        return res.status(404).json({ error: 'Book not found' });
    }

    const deletedBook = books.splice(index, 1)[0];

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

    next(err);
});

app.listen(PORT, () => {
    console.log(`Library API server is running at http://localhost:${PORT}`);
});
