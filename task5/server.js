
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = 3004;
const SECRET_KEY = 'library_secret_key_401';
const GROUP_NUMBER = 401;
const CACHE_TTL = 5 * 60 * 1000;

app.use(express.json({ limit: '5mb' }));

let users = [];
let reviews = [];
let nextUserId = 1;
let nextReviewId = 1;
let nextBookId = 101;

const cache = new Map();

const titles = [
    'The Great Gatsby',
    '1984',
    'The Hobbit',
    'War and Peace',
    'Crime and Punishment',
    'Pride and Prejudice',
    'The Little Prince',
    'Jane Eyre',
    'Moby Dick',
    'The Lord of the Rings'
];

const authors = [
    'F. Scott Fitzgerald',
    'George Orwell',
    'J.R.R. Tolkien',
    'Leo Tolstoy',
    'Fyodor Dostoevsky',
    'Jane Austen',
    'Antoine de Saint-Exupery',
    'Charlotte Bronte',
    'Herman Melville',
    'J.R.R. Tolkien'
];

const genres = [
    'Novel',
    'Dystopia',
    'Fantasy',
    'Historical',
    'Detective',
    'Romance',
    'Adventure',
    'Classic',
    'Fiction',
    'Fantasy'
];

let books = [];

for (let i = 1; i <= 100; i++) {
    const index = (i + GROUP_NUMBER) % titles.length;

    books.push({
        id: i,
        title: titles[index] + ' ' + i,
        author: authors[index],
        year: 1900 + ((i * GROUP_NUMBER) % 125),
        genre: genres[index],
        isbn: '978-' + String(1000000000 + GROUP_NUMBER * 100 + i),
        available: i % 3 !== 0
    });
}

const bookSchema = Joi.object({
    title: Joi.string().trim().min(1).required(),
    author: Joi.string().trim().min(2).required(),
    year: Joi.number().integer().min(1).max(2026).required(),
    genre: Joi.string().trim().min(2).required(),
    isbn: Joi.string().pattern(/^[0-9-]{10,17}$/).required(),
    available: Joi.boolean().default(true)
});

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().trim().min(2).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const reviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().trim().min(2).max(500).required()
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'Access token is required'
        });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({
                error: 'Invalid or expired token'
            });
        }

        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Administrator access required'
        });
    }

    next();
}

function clearCache() {
    cache.clear();
}

function parseCsvLine(line) {
    const result = [];
    let value = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"' && line[i + 1] === '"' && insideQuotes) {
            value += '"';
            i++;
        } else if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            result.push(value);
            value = '';
        } else {
            value += char;
        }
    }

    result.push(value);
    return result;
}

function toCsvValue(value) {
    const text = String(value ?? '');
    return '"' + text.replace(/"/g, '""') + '"';
}

app.post('/auth/register', async (req, res) => {
    const { error, value } = registerSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        });
    }

    const existingUser = users.find(
        user => user.email === value.email.toLowerCase()
    );

    if (existingUser) {
        return res.status(409).json({
            error: 'User already exists'
        });
    }

    const hashedPassword = await bcrypt.hash(value.password, 10);

    const user = {
        id: nextUserId++,
        email: value.email.toLowerCase(),
        password: hashedPassword,
        name: value.name,
        role: 'reader'
    };

    users.push(user);

    res.status(201).json({
        message: 'Registration successful',
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        }
    });
});

app.post('/auth/login', async (req, res) => {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        });
    }

    const user = users.find(
        item => item.email === value.email.toLowerCase()
    );

    if (!user || !(await bcrypt.compare(value.password, user.password))) {
        return res.status(401).json({
            error: 'Invalid email or password'
        });
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        SECRET_KEY,
        { expiresIn: '2h' }
    );

    res.json({
        message: 'Login successful',
        token
    });
});

app.get('/api/books', authenticateToken, (req, res) => {
    const cacheKey = JSON.stringify(req.query);
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.time < CACHE_TTL) {
        return res.json(cached.data);
    }

    let result = [...books];

    if (req.query.author) {
        result = result.filter(book =>
            book.author.toLowerCase().includes(req.query.author.toLowerCase())
        );
    }

    if (req.query.genre) {
        result = result.filter(book =>
            book.genre.toLowerCase() === req.query.genre.toLowerCase()
        );
    }

    if (req.query.search) {
        const search = req.query.search.toLowerCase();

        result = result.filter(book =>
            book.title.toLowerCase().includes(search) ||
            book.author.toLowerCase().includes(search)
        );
    }

    if (req.query.yearFrom) {
        result = result.filter(book =>
            book.year >= Number(req.query.yearFrom)
        );
    }

    if (req.query.yearTo) {
        result = result.filter(book =>
            book.year <= Number(req.query.yearTo)
        );
    }

    if (req.query.sort === 'title') {
        result.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (req.query.sort === '-title') {
        result.sort((a, b) => b.title.localeCompare(a.title));
    }

    if (req.query.sort === 'year') {
        result.sort((a, b) => a.year - b.year);
    }

    if (req.query.sort === '-year') {
        result.sort((a, b) => b.year - a.year);
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const total = result.length;

    const data = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        books: result.slice((page - 1) * limit, page * limit)
    };

    cache.set(cacheKey, {
        data,
        time: Date.now()
    });

    res.json(data);
});

app.get('/api/books/stats', authenticateToken, (req, res) => {
    const years = books.map(book => book.year);
    const authorsCount = {};

    books.forEach(book => {
        authorsCount[book.author] = (authorsCount[book.author] || 0) + 1;
    });

    const genresCount = {};

    books.forEach(book => {
        genresCount[book.genre] = (genresCount[book.genre] || 0) + 1;
    });

    res.json({
        totalBooks: books.length,
        totalAuthors: Object.keys(authorsCount).length,
        oldestBookYear: Math.min(...years),
        newestBookYear: Math.max(...years),
        authors: authorsCount,
        genres: genresCount
    });
});

app.get('/api/books/available', authenticateToken, (req, res) => {
    res.json(books.filter(book => book.available));
});

app.get('/api/books/recommendations', authenticateToken, (req, res) => {
    const genre = req.query.genre;

    if (!genre) {
        return res.status(400).json({
            error: 'Genre is required'
        });
    }

    const recommendations = books.filter(book =>
        book.genre.toLowerCase() === genre.toLowerCase()
    );

    res.json(recommendations);
});

app.get('/api/books/export', authenticateToken, (req, res) => {
    const format = req.query.format || 'json';

    if (format === 'json') {
        return res.json(books);
    }

    if (format === 'csv') {
        const headers = [
            'id',
            'title',
            'author',
            'year',
            'genre',
            'isbn',
            'available'
        ];

        const rows = books.map(book =>
            headers.map(header => toCsvValue(book[header])).join(',')
        );

        const csv = [headers.join(','), ...rows].join('\n');

        res.type('text/csv');
        return res.send(csv);
    }

    res.status(400).json({
        error: 'Unsupported export format'
    });
});

app.post('/api/books/import', authenticateToken, requireAdmin, (req, res) => {
    const { csv } = req.body;

    if (typeof csv !== 'string' || !csv.trim()) {
        return res.status(400).json({
            error: 'CSV data is required'
        });
    }

    const lines = csv.trim().split(/\r?\n/);
    const headers = parseCsvLine(lines[0]).map(item => item.trim());
    const importedBooks = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) {
            continue;
        }

        const columns = parseCsvLine(lines[i]);
        const row = {};

        headers.forEach((header, index) => {
            row[header] = columns[index];
        });

        const bookData = {
            title: row.title,
            author: row.author,
            year: Number(row.year),
            genre: row.genre,
            isbn: row.isbn,
            available: row.available === 'false' ? false : true
        };

        const { error, value } = bookSchema.validate(bookData);

        if (error) {
            errors.push({
                line: i + 1,
                error: error.details[0].message
            });
            continue;
        }

        const duplicate = books.some(book =>
            book.isbn === value.isbn
        );

        if (duplicate) {
            errors.push({
                line: i + 1,
                error: 'Book with this ISBN already exists'
            });
            continue;
        }

        const book = {
            id: nextBookId++,
            ...value
        };

        books.push(book);
        importedBooks.push(book);
    }

    clearCache();

    res.status(201).json({
        message: 'Import completed',
        imported: importedBooks.length,
        errors
    });
});

app.get('/api/books/:id', authenticateToken, (req, res) => {
    const book = books.find(item => item.id === Number(req.params.id));

    if (!book) {
        return res.status(404).json({
            error: 'Book not found'
        });
    }

    const bookReviews = reviews.filter(
        review => review.bookId === book.id
    );

    res.json({
        ...book,
        reviews: bookReviews
    });
});

app.post('/api/books', authenticateToken, requireAdmin, (req, res) => {
    const { error, value } = bookSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        });
    }

    const duplicate = books.some(book =>
        book.isbn === value.isbn
    );

    if (duplicate) {
        return res.status(409).json({
            error: 'Book with this ISBN already exists'
        });
    }

    const book = {
        id: nextBookId++,
        ...value
    };

    books.push(book);
    clearCache();

    res.status(201).json(book);
});

app.put('/api/books/:id', authenticateToken, (req, res) => {
    const book = books.find(item => item.id === Number(req.params.id));

    if (!book) {
        return res.status(404).json({
            error: 'Book not found'
        });
    }

    const updateSchema = Joi.object({
        title: Joi.string().trim().min(1),
        author: Joi.string().trim().min(2),
        year: Joi.number().integer().min(1).max(2026),
        genre: Joi.string().trim().min(2),
        isbn: Joi.string().pattern(/^[0-9-]{10,17}$/),
        available: Joi.boolean()
    }).min(1);

    const { error, value } = updateSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        });
    }

    if (value.isbn && books.some(item =>
        item.isbn === value.isbn && item.id !== book.id
    )) {
        return res.status(409).json({
            error: 'Book with this ISBN already exists'
        });
    }

    Object.assign(book, value);
    clearCache();

    res.json(book);
});

app.delete('/api/books/:id', authenticateToken, requireAdmin, (req, res) => {
    const index = books.findIndex(
        item => item.id === Number(req.params.id)
    );

    if (index === -1) {
        return res.status(404).json({
            error: 'Book not found'
        });
    }

    const deletedBook = books.splice(index, 1)[0];
    clearCache();

    res.json({
        message: 'Book deleted successfully',
        book: deletedBook
    });
});

app.post('/api/books/:id/reviews', authenticateToken, (req, res) => {
    const book = books.find(item => item.id === Number(req.params.id));

    if (!book) {
        return res.status(404).json({
            error: 'Book not found'
        });
    }

    const { error, value } = reviewSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        });
    }

    const review = {
        id: nextReviewId++,
        bookId: book.id,
        userId: req.user.id,
        ...value
    };

    reviews.push(review);

    res.status(201).json(review);
});

app.get('/api/admin', authenticateToken, requireAdmin, (req, res) => {
    res.json({
        message: 'Administrator access granted'
    });
});

const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Library Management API',
        version: '1.0.0',
        description: 'REST API for managing a library'
    },
    servers: [
        {
            url: 'http://localhost:3004'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    },
    paths: {
        '/auth/register': {
            post: {
                summary: 'Register a new reader',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password', 'name'],
                                properties: {
                                    email: { type: 'string' },
                                    password: { type: 'string' },
                                    name: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Registration successful' },
                    400: { description: 'Invalid data' },
                    409: { description: 'User already exists' }
                }
            }
        },
        '/auth/login': {
            post: {
                summary: 'Login and receive JWT',
                responses: {
                    200: { description: 'Login successful' },
                    401: { description: 'Invalid credentials' }
                }
            }
        },
        '/api/books': {
            get: {
                summary: 'Get books with filtering and pagination',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'author', in: 'query', schema: { type: 'string' } },
                    { name: 'genre', in: 'query', schema: { type: 'string' } },
                    { name: 'search', in: 'query', schema: { type: 'string' } },
                    { name: 'page', in: 'query', schema: { type: 'integer' } },
                    { name: 'limit', in: 'query', schema: { type: 'integer' } },
                    { name: 'sort', in: 'query', schema: { type: 'string' } }
                ],
                responses: {
                    200: { description: 'List of books' },
                    401: { description: 'Authentication required' }
                }
            },
            post: {
                summary: 'Add a book (administrator only)',
                security: [{ bearerAuth: [] }],
                responses: {
                    201: { description: 'Book created' },
                    400: { description: 'Invalid book data' },
                    403: { description: 'Administrator access required' }
                }
            }
        },
        '/api/books/{id}': {
            get: {
                summary: 'Get a book and its reviews',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Book details' },
                    404: { description: 'Book not found' }
                }
            },
            put: {
                summary: 'Update a book',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Book updated' },
                    404: { description: 'Book not found' }
                }
            },
            delete: {
                summary: 'Delete a book (administrator only)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Book deleted' },
                    403: { description: 'Administrator access required' }
                }
            }
        },
        '/api/books/stats': {
            get: {
                summary: 'Get library statistics',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Library statistics' }
                }
            }
        },
        '/api/books/available': {
            get: {
                summary: 'Get available books',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Available books' }
                }
            }
        },
        '/api/books/recommendations': {
            get: {
                summary: 'Get book recommendations by genre',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'genre', in: 'query', required: true, schema: { type: 'string' } }
                ],
                responses: {
                    200: { description: 'Recommended books' }
                }
            }
        },
        '/api/books/export': {
            get: {
                summary: 'Export books as JSON or CSV',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'] } }
                ],
                responses: {
                    200: { description: 'Exported books' }
                }
            }
        },
        '/api/books/import': {
            post: {
                summary: 'Import books from CSV (administrator only)',
                security: [{ bearerAuth: [] }],
                responses: {
                    201: { description: 'Import completed' },
                    400: { description: 'Invalid CSV data' }
                }
            }
        },
        '/api/books/{id}/reviews': {
            post: {
                summary: 'Add a review to a book',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    201: { description: 'Review created' },
                    404: { description: 'Book not found' }
                }
            }
        },
        '/api/admin': {
            get: {
                summary: 'Administrator-only route',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Administrator access granted' },
                    403: { description: 'Administrator access required' }
                }
            }
        }
    }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found'
    });
});

app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        error: 'Internal server error'
    });
});

async function startServer() {
    const adminPassword = await bcrypt.hash('Admin123!', 10);

    users.push({
        id: nextUserId++,
        email: 'admin@library.com',
        password: adminPassword,
        name: 'Library Administrator',
        role: 'admin'
    });

    app.listen(PORT, () => {
        console.log('Library API server is running at http://localhost:' + PORT);
        console.log('Swagger documentation: http://localhost:' + PORT + '/api-docs');
        console.log('Generated books: ' + books.length);
        console.log('Group number: ' + GROUP_NUMBER);
        console.log('Administrator email: admin@library.com');
        console.log('Administrator password: Admin123!');
    });
}

startServer();
