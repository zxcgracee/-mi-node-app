
const express = require('express');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    const currentDate = new Date().toLocaleString('en-GB');

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Laboratory Work №16</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #f0f2f5;
                    margin: 40px;
                    color: #333;
                }
                .container {
                    max-width: 700px;
                    margin: auto;
                    padding: 30px;
                    background: white;
                    border-radius: 10px;
                }
                h1 {
                    color: #2563eb;
                }
                a {
                    color: #2563eb;
                    text-decoration: none;
                }
                li {
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Laboratory Work №16</h1>
                <h2>Student Information</h2>
                <p><strong>Student:</strong> Vyacheslav Rogatsevich</p>
                <p><strong>Group:</strong> 401</p>
                <p><strong>Current Date and Time:</strong> ${currentDate}</p>
                <h2>Welcome!</h2>
                <p>Welcome to my Express.js web server!</p>
                <h2>Available Routes</h2>
                <ul>
                    <li><a href="/">Home</a> - Main page</li>
                    <li><a href="/about">About</a> - Developer information</li>
                    <li><a href="/contacts">Contacts</a> - Contact information</li>
                </ul>
            </div>
        </body>
        </html>
    `);
});

app.get('/about', (req, res) => {
    res.send(`
        <h1>About the Developer</h1>
        <p>Name: Vyacheslav Rogatsevich</p>
        <p>Group: 401</p>
        <p>Project: Laboratory Work №16</p>
        <a href="/">Back to Home</a>
    `);
});

app.get('/contacts', (req, res) => {
    res.send(`
        <h1>Contact Information</h1>
        <p>Student: Vyacheslav Rogatsevich</p>
        <p>Group: 401</p>
        <p>Educational Project: Express.js Server</p>
        <a href="/">Back to Home</a>
    `);
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
