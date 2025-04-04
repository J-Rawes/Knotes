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
    database: 'postgres', // DB name
    password: 'password', // DB password
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
                const {username, password} = JSON.parse(body);

                if (!username || !password) {
                    res.writeHead(400, {'Content-Type': 'text/plain'});
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
                            res.writeHead(500, {'Content-Type': 'text/plain'});
                            res.end('Database error');
                        } else {
                            res.writeHead(200, {'Content-Type': 'text/plain'});
                            res.end('User registered successfully');
                        }
                    }
                );
            } catch (error) {
                res.writeHead(400, {'Content-Type': 'text/plain'});
                res.end('Invalid request format');
            }
        });
    } else if (req.method === 'POST' && req.url === '/submitText') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                var content = JSON.parse(body);
                content = content.content;
               // const dataUri = body.content;
                console.log(typeof content);
                console.log("contents of: ", content);
                const textImg = dataUrlToBuffer(content);
                const extractedText = await extract(textImg);


                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end(extractedText);

            } catch (error) {
                res.writeHead(400, {'Content-Type': 'text/plain'});
                console.log(error);
                res.end('Invalid request format');
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

function dataUrlToBuffer(dataUrl) {
    if (typeof dataUrl !== "string") {
        throw new Error("textImg must be a string");
    }
    //fs.writeFileSync('./filename.png', Buffer.from(dataUrl.split(',')[1], 'base64'))
    const matches = dataUrl.match("^data:image/(png|jpeg);base64,(.+)$");
    if (!matches) {
        throw new Error('Invalid Data URL');
    }
    return Buffer.from(matches[2], 'base64');
}
// Method for extracting from file

const CREDENTIALS = JSON.parse(JSON.stringify({
    
}));

const CONFIG = {
    credentials: {
        private_key: CREDENTIALS.private_key,
        client_email: CREDENTIALS.client_email
    }
};

async function extract(image) {
    const client = new vision.ImageAnnotatorClient(CONFIG);

// Read a local image as a text document
    console.log("extract:");
    const [result] = await client.documentTextDetection(image);
    const fullTextAnnotation = result.fullTextAnnotation;
    return (fullTextAnnotation.text);

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
