/*TODO: 
Handle Task logic (DB = Owen + Ares) (Text scan = Nathen)
*/

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const vision = require('@google-cloud/vision');

// PostgreSQL client setup
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'Knotes', // DB name
    password: 'of7224165', // DB password
    port: 5432, // Default PostgreSQL port
});

client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

// Serve static files
const serveStaticFile = (filePath, contentType, res) => {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
};

// Create server
const server = http.createServer((req, res) => {
    const url = req.url === '/' ? '/register.html' : req.url;
    const ext = path.extname(url);

    // Serve static files (HTML, CSS, JS)
    if (ext === '.html') {
        serveStaticFile(path.join(__dirname, url), 'text/html', res);
    } else if (ext === '.css') {
        serveStaticFile(path.join(__dirname, url), 'text/css', res);
    } else if (ext === '.js') {
        serveStaticFile(path.join(__dirname, url), 'application/javascript', res);
    }

        //TODO handle UID creation
        // Handle POST request for registration
    else if (req.method === 'POST' && req.url === '/register') { /////////////////////////////////////////////// /register is the "task" in question
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { username, password } = JSON.parse(body);

                if (!username || !password) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Missing username or password');
                    return;
                }

                // Insert into PostgreSQL (user_id is auto-generated)
                const user_gen_id = await generateUID();
                client.query(
                    'INSERT INTO "Users" (user_id, uname, pword) VALUES ($1, $2, $3)',
                    [user_gen_id, username, password],
                    (err, result) => {
                        if (err) {
                            console.error('Database insert error:', err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Database error');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('User registered successfully');
                        }
                    }
                );
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Invalid request format');
            }
        });
    }

    else if (req.method === 'POST' && req.url === '/submitText') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const content = JSON.parse(body);
                var textImg = new Image;
                var outputText;
                textImg.src = content;
                textImg.onload = () => {
                    outputText = extract(textImg);
                }
                
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(outputText);

            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Invalid request format');
            }
        });
    }

          //COURSE SEARCH QUERY// 
    /*
    Note For Owen/Ares/Ryan: To avoid SQL injection we need to have a catch on the front end for blank inputs and special characters. 
    If not, we need to sanatize the inputs. We will discuss this in a future meeting.
    */
    else if (req.method === 'POST' && req.url === '/courseSearch') { 
        let body = '';
    
        req.on('data', chunk => {
            body += chunk.toString();
        });
    
        req.on('end', async () => {
            try {
                const { input } = JSON.parse(body);
    
                if (!input) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Missing content');
                    return;
                }
    
                await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    
                // Perform the similarity search with async/await
                const query = `
                    SELECT course_id, course_name, institution 
                    FROM "Courses" 
                    WHERE similarity(course_name, $1) > 0.3 
                    ORDER BY similarity(course_name, $1) DESC 
                    LIMIT 10;
                `;
    
                const result = await client.query(query, [input]);
    
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result.rows));
            } catch (error) {
                console.error('Database query error:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Database error');
            }
        });
    }

    // Default 404
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found\n');
    }
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Method for extracting from file

const CREDENTIALS;

const CONFIG = {
    credentials: {
        private_key: CREDENTIALS.private_key,
        client_email: CREDENTIALS.client_email
    }
};

async function extract(image) {

const client = new vision.ImageAnnotatorClient(CONFIG);

// Read a local image as a text document
const [result] = await client.documentTextDetection(image);
const fullTextAnnotation = result.fullTextAnnotation;
console.log(`Full text: ${fullTextAnnotation.text}`);

}

// Method for generating UID on account creation

async function generateUID() {
    try {
        const result = await client.query('SELECT COUNT(*) FROM "Users"');
        const count = result.rows[0].count; // Check DB for "next UID"
        return count;
    } catch (err) {
        console.error('Error generating UID:', err);
        throw err;
    }
    
}

