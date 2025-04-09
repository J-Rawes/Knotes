
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const vision = require('@google-cloud/vision');
const visionClient = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }
});
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = "ChickenJockey"; // Super secret key

// PostgreSQL client setup
const client = new Client({
    user: 'knotes_user',
    host: 'dpg-cvqm5fm3jp1c73dro7l0-a.oregon-postgres.render.com',
    database: 'knotes',
    password: 'brUbr6qvDRMI3GMgcJLuoPQ86ZxtY6XG',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

// Middleware
app.use(bodyParser.json());
// Serve static files from ../FrontEnd relative to server.js
app.use(express.static(path.join(__dirname, '..', 'FrontEnd')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'FrontEnd', 'index.html'));
});

// Helper functions
const serveStaticFile = (filePath, contentType, res) => {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(404).send('File not found');
        } else {
            res.setHeader('Content-Type', contentType);
            res.send(data);
        }
    });
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes
app.post('/register', async (req, res) => {
    try {
        const { username, password, securityQuestion, securityAnswer } = req.body;

        if (!username || !password || !securityQuestion || !securityAnswer) {
            return res.status(400).send('A required field is missing');
        }

        const checkQuery = 'SELECT uname FROM "Users" WHERE uname = $1';
        const checkResult = await client.query(checkQuery, [username]);

        if (checkResult.rows.length > 0) {
            return res.status(409).send('Username already exists');
        }

        const likedNotes = [];
        const likedCourses = [];
        const user_gen_id = await generateID("Users", "user_id");

        await client.query(
            'INSERT INTO "Users" (user_id, uname, pword, securityq, securityq_ans, liked_notes, liked_courses) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [user_gen_id, username, password, securityQuestion, securityAnswer, likedNotes, likedCourses]
        );

        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'User registered successfully', token });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Database error');
    }
});

app.post('/getNoteCountAndID', async (req, res) => {
    try {
        const { courseID } = req.body;

        if (!courseID) {
            return res.status(400).send("Missing course ID");
        }

        const query = `
            SELECT ARRAY_AGG(note_id) AS note_ids
            FROM "Notes"
            WHERE course_id = $1
        `;

        const result = await client.query(query, [courseID]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No notes found" });
        }

        const noteIDs = result.rows[0].note_ids || [];
        res.status(200).json({ noteIDs });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/uploadNote', async (req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        const { course, title, imageArray, txtArray, username } = JSON.parse(body);

        console.log("Course:", course);
        console.log("Title:", title);
        console.log("Image Array:", imageArray);
        console.log("Text Array:", txtArray);
        console.log("Username:", username);

        try {
            const getCourseID = `
                SELECT course_id
                FROM "Courses"
                WHERE course_name = $1
            `;

            const courseIDResult = await client.query(getCourseID, [course]);
            const courseID = courseIDResult.rows[0]?.course_id;

            const getUserIDQuery = `
                SELECT user_id
                FROM "Users"
                WHERE uname = $1
            `;

            const userIDResult = await client.query(getUserIDQuery, [username]);
            const userID = userIDResult.rows[0]?.user_id;

            const noteNum = await generateID("Notes", "note_id");

            const query = `
                INSERT INTO "Notes" (note_id, title, num_likes, course_id, user_id)  
                VALUES($1, $2, $3, $4, $5)
            `;
            await client.query(query, [noteNum, title, 0, courseID, userID]);

            for (const text of txtArray) {
                const textNum = await generateID("Text", "text_id");
                const query2 = `
                    INSERT INTO "Text" (text_id, text, note_id)  
                    VALUES($1, $2, $3)
                `;
                await client.query(query2, [textNum, text, noteNum]);
            }

            for (const image of imageArray) {
                const imageNum = await generateID("Images", "image_id");
                const query3 = `
                    INSERT INTO "Images" (image_id, image, note_id)  
                    VALUES($1, $2, $3)
                `;
                await client.query(query3, [imageNum, image, noteNum]);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Note uploaded successfully' }));
        } catch (error) {
            console.error('Error uploading note:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database error' }));
        }
    });
});

app.post('/verifySecurityAnswer', async (req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const { username, securityAnswer } = JSON.parse(body);

            if (!username || !securityAnswer) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing username or security answer' }));
                return;
            }

            const query = `
                SELECT securityq_ans
                FROM "Users"
                WHERE uname = $1
            `;

            const result = await client.query(query, [username]);

            if (result.rows.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'User not found' }));
                return;
            }

            const storedHashAnswer = result.rows[0].securityq_ans;

            if (storedHashAnswer.trim() === securityAnswer.trim()) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Security answer verified' }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Incorrect security answer' }));
            }
        } catch (error) {
            console.error('Error verifying security answer:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error' }));
        }
    });
});

app.post('/resetPassword', async (req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const { username, newPassword } = JSON.parse(body);

            if (!username || !newPassword) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing required fields' }));
                return;
            }

            if (newPassword.length < 8) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Password must be at least 8 characters long' }));
                return;
            }

            const query = `
                UPDATE "Users"
                SET pword = $1
                WHERE uname = $2
            `;

            await client.query(query, [newPassword, username]);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Password reset successfully' }));
        } catch (error) {
            console.error('Error resetting password:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error' }));
        }
    });
});

app.post('/verifyUsername', async (req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const { username } = JSON.parse(body);

            const query = 'SELECT securityq FROM "Users" WHERE uname = $1';
            const result = await client.query(query, [username]);

            if (result.rows.length > 0) {
                const securityQuestion = result.rows[0].securityq;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ exists: true, securityQuestion }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ exists: false }));
            }
        } catch (error) {
            console.error('Error verifying username:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error' }));
        }
    });
});

app.post('/deleteNote', async (req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const { noteID } = JSON.parse(body);
            const query = 'DELETE FROM "Notes" WHERE "note_id" = $1';
            const result = await client.query(query, [noteID]);

            if (result.rowCount === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Note not found' }));
                return;
            } else {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end("Note Successfully Deleted");
                return;
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error' }));
        }
    });
});

app.get('/protected', (req, res) => {
    authenticateToken(req, res, () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'This is a protected route', user: req.user }));
    });
});

app.post('/getNoteTombstoneInfo', async (req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const { noteID } = JSON.parse(body);

            const query = `
                SELECT *
                FROM "Images" 
                WHERE note_id = $1
            `;

            const query2 = `
                SELECT *
                FROM "Text" 
                WHERE note_id = $1               
            `;

            const query3 = `
                SELECT *
                FROM "Notes" 
                WHERE note_id = $1               
            `;

            const imageResult = await client.query(query, [noteID]);
            const textResult = await client.query(query2, [noteID]);
            const tombstoneResult = await client.query(query3, [noteID]);

            const images = imageResult.rows.map(row => {
                return row.image ? `data:image/png;base64,${row.image.toString('base64')}` : null;
            });
            console.log("Images: ", images);
            const text = textResult.rows.map(row => row.text);
            const noteInfo = tombstoneResult.rows[0];

            const getUsernameQuery = `
                SELECT uname
                FROM "Users"
                WHERE user_id = $1
            `;

            const userResult = await client.query(getUsernameQuery, [noteInfo.user_id]);
            const username = userResult.rows[0]?.uname;
            noteInfo.username = username;

            console.log("Tombstone Info: ", noteInfo);
            console.log(images);
            console.log(text);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ images, text, noteInfo }));
        } catch (error) {
            console.error('Database query error:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Database error');
        }
    });
});

app.post('/likeNote', async (req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const { currentNote, courseID, username } = JSON.parse(body);
            console.log(currentNote);
            console.log(username);

            if (!currentNote) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing note ID' }));
                return;
            }

            const query = `
                UPDATE "Notes"
                SET num_likes = num_likes + 1
                WHERE note_id = $1
            `;

            const query2 = `
                UPDATE "Users"
                SET liked_notes = array_append(liked_notes, $1::bigint)
                WHERE uname = $2
            `;

            const query3 = `
                UPDATE "Users"
                SET liked_courses = array_append(liked_courses, $1::bigint)
                WHERE uname = $2
            `;

            await client.query(query, [currentNote]);
            await client.query(query2, [currentNote, username]);
            await client.query(query3, [courseID, username]);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Note liked successfully' }));
        } catch (error) {
            console.error('Error liking note:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error' }));
        }
    });
});

app.post('/getLikedNotes', async (req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const { username } = JSON.parse(body);

            if (!username) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing username' }));
                return;
            }

            const query = `
                SELECT liked_notes
                FROM "Users"
                WHERE uname = $1
            `;

            const result = await client.query(query, [username]);
            const likedNotes = result.rows[0]?.liked_notes || [];

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ likedNotes }));
        } catch (error) {
            console.error('Error fetching liked notes:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error' }));
        }
    });
});

app.post('/getLikedCourses', async (req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const { username } = JSON.parse(body);

            if (!username) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing username' }));
                return;
            }

            const query = `
                SELECT liked_courses
                FROM "Users"
                WHERE uname = $1
            `;

            const result = await client.query(query, [username]);
            const likedCourses = result.rows[0]?.liked_courses || [];

            const query2 = `
                SELECT course_name, course_id
                FROM "Courses"
                WHERE course_id = ANY($1::bigint[])
            `;

            const result2 = await client.query(query2, [likedCourses]);

            if (result2.rows.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "No courses found" }));
                return;
            }

            const courseArr = result2.rows.map(row => ({ course_id: row.course_id, course_name: row.course_name }));

            console.log(courseArr);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ courseArr }));
        } catch (error) {
            console.error('Error fetching liked courses:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error' }));
        }
    });
});

app.get('/common.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'common.js'));
});

app.get('/courses', async (req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const query = `
                SELECT course_name, course_id
                FROM "Courses"               
            `;

            const result = await client.query(query);

            if (result.rows.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "No courses found" }));
                return;
            }

            const courseArr = result.rows.map(row => ({ course_id: row.course_id, course_name: row.course_name }));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ courseArr }));
        } catch (error) {
            console.error('Error Fetching Courses', error);
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Error Fetching Courses');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const CREDENTIALS = {
  type: process.env.GOOGLE_TYPE,
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY,
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: process.env.GOOGLE_AUTH_URI,
  token_uri: process.env.GOOGLE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT,
  client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
  universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN
};

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
    return (fullTextAnnotation.text);

}

async function generateID(idType, columnName) {
    try {
        const query = `SELECT MAX(${columnName}) AS max_id FROM "${idType}"`;
        const result = await client.query(query);
        const maxId = result.rows[0].max_id || 0;
        return maxId + 1;
    } catch (err) {
        console.error(`Error generating ${idType}:`, err);
        throw err;
    }
}

function dataUrlToBuffer(dataUrl) {
    if (typeof dataUrl !== "string") {
        throw new Error("textImg must be a string");
    }
    const matches = dataUrl.match("^data:image/(png|jpeg);base64,(.+)$");
    if (!matches) {
        throw new Error('Invalid Data URL');
    }
    return Buffer.from(matches[2], 'base64');
}




