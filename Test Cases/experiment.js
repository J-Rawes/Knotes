//libraries
const http = require('http');
const fs = require('fs');
const path = require('path');
const { parse } = require('querystring');
const { Client } = require('pg');
/*
This code is just a basic template, creates a server at http://localhost:8080
Server sends an upload file form, then saves the uploaded filename in the DB.
*/

/*
TO DO: 
connect server to frontend code
Update DB to actual SQL tables 
*/ 

/*Note: you will need postgresSQL downloaded on your computer.
update the password field with the one you set.
The table I used is just a template for testing the DB connection, created using:
CREATE TABLE uploads (
    id SERIAL PRIMARY KEY,
    file_name TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/
// PostgreSQL client setup
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'password',//set as your DB password
    port: 5432, // Default PostgreSQL port
});

client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

//create server
const server = http.createServer((req, res) => {
    if (req.method === 'POST') { //file uploaded
        const boundary = req.headers['content-type'].split('=')[1];
        let rawData = '';

        req.on('data', chunk => {
            rawData += chunk;
        });

        req.on('end', async () => {
            const matches = rawData.match(/filename="(.+)"/);
            const fileName = matches ? matches[1] : 'uploaded_file';
            const filePath = path.join(__dirname, fileName);
            const fileData = rawData.split(`--${boundary}`)[1].split('\r\n\r\n')[1].split('\r\n--')[0];

            //NOTE: change later to save file data to database
            fs.writeFile(filePath, fileData, async err => {//save file in directory
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error saving file\n');
                } else {
                    try {
                        // Insert filename into PostgreSQL
                        await client.query('INSERT INTO uploads (file_name) VALUES ($1)', [fileName]);
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end(`File uploaded successfully: ${fileName}\n`);
                    } catch (dbErr) {
                        console.error('Database error:', dbErr);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error saving file to database\n');
                    }
                }
            });
        });
    } else {//default web page and upload file form
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <html>
                <body>
                    <form action="/" method="post" enctype="multipart/form-data">
                        <input type="file" name="file" /><br/>
                        <input type="submit" value="Upload File" />
                    </form>
                </body>
            </html>
        `);
    }
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`); //connect in browser with http://localhost:8080
});
