const express = require('express');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const vision = require('@google-cloud/vision');
const bodyParser = require('body-parser');
const visionClient = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }
});



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
//app.use(bodyParser.json());
app.use(express.json({ limit: '50mb' }));
//app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

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

 console.log("Auth Header:", authHeader);
    console.log("Token received:", token);
  
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

// Register endpoint
app.post('/register', async (req, res) => {
    try {
        const { username, password, securityQuestion, securityAnswer } = req.body;
        if (!username || !password || !securityQuestion || !securityAnswer) {
            return res.status(400).send('A required field is missing');
        }

        // Check if username already exists
        const checkQuery = 'SELECT uname FROM "Users" WHERE uname = $1';
        const checkResult = await client.query(checkQuery, [username]);
        if (checkResult.rows.length > 0) {
            return res.status(409).send('Username already exists');
        }

        // Generate user ID
        const user_gen_id = await generateID("Users", "user_id");

        // Insert new user within a transaction
        await client.query('BEGIN');
        const insertQuery = `
            INSERT INTO "Users" (user_id, uname, pword, securityq, securityq_ans, liked_notes, liked_courses)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;

  
        const insertValues = [user_gen_id, username, password, securityQuestion, securityAnswer, [], []];

      console.log(user_gen_id + " " + username + " " + password + " " + securityQuestion + " " + securityAnswer)
        const insertResult = await client.query(insertQuery, insertValues);
        await client.query('COMMIT');

        if (insertResult.rows.length > 0) {
            const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
            return res.status(200).json({ message: 'User registered successfully', token });
        } else {
            throw new Error('User registration failed');
        }
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Register error:', err);
        res.status(500).send('Database error');
    }
});


// Submit text endpoint
app.post('/submitText', async (req, res) => {
    try {
        const { content } = req.body;
        const textImg = dataUrlToBuffer(content);
        const extractedText = await extract(textImg);

        res.status(200).send(extractedText);
    } catch (error) {
        console.error('Error processing text:', error);
        res.status(400).send('Invalid request format');
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    console.log("Login route hit!");
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({ error: "Missing username or password" });
           // return;
        }

        const query = 'SELECT pword FROM "Users" WHERE uname = $1';
        const result = await client.query(query, [username]);
        const storedHashPass = result.rows[0]?.pword;

        console.log(storedHashPass + " " + password);
        if (storedHashPass && storedHashPass.trim() === password.trim()) {
            const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
            res.status(200).json({ exists: true, token, message: "Login successful" });
        } else {
            res.status(401).json({ exists: false, message: "Incorrect password" });
        }
    } catch (error) {
        console.error('Error verifying user:', error);
        res.status(500).send('Server error');
    }
});



// Get liked courses endpoint
app.post('/getLikedCourses', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            res.status(400).json({ error: 'Missing username' });
            return;
        }

        const query = 'SELECT liked_courses FROM "Users" WHERE uname = $1';
        const result = await client.query(query, [username]);
        const likedCourses = result.rows[0]?.liked_courses || [];

        const query2 = `
            SELECT course_name, course_id
            FROM "Courses"
            WHERE course_id = ANY($1::bigint[])
        `;

        const result2 = await client.query(query2, [likedCourses]);

        if (result2.rows.length === 0) {
            res.status(404).json({ message: "No courses found" });
            return;
        }

        const courseArr = result2.rows.map(row => ({ course_id: row.course_id, course_name: row.course_name }));
        res.status(200).json({ courseArr });
    } catch (error) {
        console.error('Error fetching liked courses:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


//USED FOR COURSE SEARCH PAGE WHEN USER TYPES IN THE SEARCH BAR
app.post('/courseSearch', async (req, res) => {
    try {
        const { input } = req.body;

        if (!input) {
            res.status(400).send('Missing content');
            return;
        }

        await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

        const query = `
            SELECT course_id, course_name, institution 
            FROM "Courses" 
            WHERE similarity(course_name, $1) > 0.3 
            ORDER BY similarity(course_name, $1) DESC 
            LIMIT 10;
        `;

        const result = await client.query(query, [input]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).send('Database error');
    }
});

    //Used in Course Display Page, this is used to determine the amount of buttons and info fields about the course
    app.post('/getCourseNoteInfo', async (req, res) => {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {

            const { courseID } = JSON.parse(body);

            try {
                // Get note count and IDs for the given course
                const query = `
                    SELECT title, note_id, num_likes
                    FROM "Notes"
                    WHERE course_id = $1               
                `;

                const query2 = `
                    SELECT *
                    FROM "Courses"  
                    WHERE course_id = $1              
                `;

                const result = await client.query(query, [courseID]); 
                const result2 = await client.query(query2, [courseID]); 

                if (result.rows.length === 0) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: "No notes found" }));
                    return;
                }
        
                if (result2.rows.length === 0) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: "No course found" }));
                    return;
                }
        
                const noteNames = result.rows.map(row => ({ title: row.title, note_id: row.note_id, num_likes: row.num_likes }));
                const courseInfo = result2.rows[0];

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({noteNames, courseInfo})); //Send both the count and note IDs to courseDisplay.js

            } catch (error) {
                console.error('Error Fetching Courses', error);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Error Fetching Courses');
            }
        });
    });


app.post('/getNoteCountAndID', async (req, res) =>{ //USED TO CREATE BUTTONS
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const {courseID} = JSON.parse(body);
            
            if(!courseID){ //No password passed error
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end("Missing course ID");
                return;
            }

            // Get note count and IDs for the given course
            const query = `
                SELECT ARRAY_AGG(note_id) AS note_ids
                FROM "Notes"
                WHERE course_id = $1
            `;

            const result = await client.query(query, [courseID]); 

            if (result.rows.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "No notes found" }));
                return;
            }

            const noteIDs = result.rows[0].note_ids || []; //funky syntax basically prevents null return errors

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({noteIDs})); //Send both the count and note IDs to courseDisplay.js

        } catch (error) {
            console.error('Error hashing password:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({error: "Error hashing password"}));
        }
    });
});



    //Used in Course Search Page, this is used to determine the amount of buttons
    app.post ('/getCourseCount', async (req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            // Get note count and IDs for the given course
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
            res.end(JSON.stringify({courseArr})); //Send both the count and note IDs to courseDisplay.js

        } catch (error) {
            console.error('Error Fetching Courses', error);
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Error Fetching Courses');
        }
    });
});


app.post('/uploadNote', async (req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        const {course, title, imageArray, txtArray, username} = req.body;

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

            // Query to get the user_id from the Users table
            const getUserIDQuery = `
                SELECT user_id
                FROM "Users"
                WHERE uname = $1
    `       ;
            const userIDResult = await client.query(getUserIDQuery, [username]);
            const userID = userIDResult.rows[0]?.user_id;

           
            const noteNum = await generateID("Notes", "note_id");
            
            // Insert note into the Notes table
            const query = `
                INSERT INTO "Notes" (note_id, title, num_likes, course_id, user_id)  
                VALUES($1, $2, $3, $4, $5)
            `;
            await client.query(query, [noteNum, title, numlikes=0, courseID, userID]);

            // Insert text entries into the Text table
            for (const text of txtArray) {
                const textNum = await generateID("Text", "text_id");
                const query2 = `
                    INSERT INTO "Text" (text_id, text, note_id)  
                    VALUES($1, $2, $3)
                `;
                await client.query(query2, [textNum, text, noteNum]);
            }

            // Insert image entries into the Images table
            for (const image of imageArray) {
                const imageNum = await generateID("Images", "image_id");
                const query3 = `
                    INSERT INTO "Images" (image_id, image, note_id)  
                    VALUES($1, $2, $3)
                `;
                await client.query(query3, [imageNum, image, noteNum]);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({message: 'Note uploaded successfully'}));
        } catch (error) {
            console.error('Error uploading note:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({error: 'Database error'}));
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

            // Query to get the stored hashed security answer
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

            // Compare the stored hash with the provided hash
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


app.post ('/resetPassword', async (req, res) => {
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

            // Check if the username exists in the database
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
            }
            else{
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end("Note Successfully Deleted");
                return;
            }
        } catch (error) {
            console.error('Error verifying username:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error' }));
        }
    });
});

app.get('/protected', async (req, res) => {
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
        try { 7
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
          
            

            // Extract the data
            // Convert bytea images to Base64
            const images = imageResult.rows.map(row => {
                return row.image ? `data:image/png;base64,${row.image.toString('base64')}` : null;
            });
            console.log("Images: ", images);
            const text = textResult.rows.map(row => row.text); // Array of text
            const noteInfo = tombstoneResult.rows[0]; // Course info (single object)

            // Query the Users table to get the username
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

            // Return the data as a JSON response
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

            // Increment the number of likes for the note
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
            res.end(JSON.stringify({message: 'Note liked successfully' }));
        } catch (error) {
            console.error('Error liking note:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error' }));
        }
    });
});

// Endpoint to get liked notes
app.post('/getLikedNotes', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            res.status(400).json({ error: 'Missing username' });
            return;
        }

        const query = `
            SELECT liked_notes
            FROM "Users"
            WHERE uname = $1
        `;

        const result = await client.query(query, [username]);
        const likedNotes = result.rows[0]?.liked_notes || [];

        res.status(200).json({ likedNotes });
    } catch (error) {
        console.error('Error fetching liked notes:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Default 404 handler
app.use((req, res) => {
    res.status(404).send('Not Found');
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
/*
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
*/

const CREDENTIALS = JSON.parse(JSON.stringify({
    "type": "service_account",
    "project_id": "crucial-media-449421-c2",
    "private_key_id": "27c27db6d85862780693c92de92d5d954c277b98",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDOPQSPkr/xK9UB\nFCjot4GSfAJFk9MsfjQwhcIztBYQYh2sS/PLfNO5sF2SNWOYuuTEUm5Xqo0nFoZl\nbEjQZEQoYAyympgfq6t2ey9AUAY47iPtC9q8jGsnggmq1cpHwig9neo6lb5kIJF6\nDOql7u9RgvextYFOWyiN4XNwuhgt1skljlvcagafhMtbjC9idHCvkdIxH2nJamK8\n/i0cEANg5Y/G+UwDgEFlVjf+GQ8zhtv0aWnE/aIH+lVq9X+85nwaPCO9hYv5HgUf\nDtzolUp4/BPXidR0PrehJgKkeHJijewFJIs+oITT1gfa85d2UhemquRZrlzSgD18\n/ANmcVbrAgMBAAECggEACFcgCRexMB/1VD7WzK/Ry0pn48fE9tFVFk/tI57OdEko\n1AqaSF9lnJEiUkMFzRZkdqqyuv7dsyKjur70pDYkf3wq50ooiWythB7FMWpLEMr9\n+Zx3cxU7/B6zz2HSoAZHuajaNmukhci/ZAUuXsQuj3L8G1wGElTOFgweWVpdQfU8\nDbIdg/dtJT/ICb9ivL7Ys65EACHtB/WJm3t45/F4uW2Z5Y0i5prIuMHVD+WKr7IA\njUjxKbGIcHn6mn9DP0QivlamZIDsyfL20/a9mvPnJc9Te9+fEzLyjEzRKXigKzHN\nXvw8ZOOByFMTd0/Tb46oks8Lp48UDmryS8rACjIRcQKBgQD3hN8IzCr16M8+mogE\n28nnEl7obHqSrik2x8cj36fErTYHJ5h+qqjm4zo2I/ITAKRjA+zsYH27WMcChpLE\nGkVQHieC77uLMSQHlQHhTp8eMVaXsWIFf8WfnDPI8yleDcjXIvRbcVvXlP6Dy6WT\nWR8EqGi8wQL4BgcoIz68MKQO2QKBgQDVTgzu/JRYSYkXBaboipHtiRQp1ZY0+PEb\nX9gtg6fFGkyHMPBC7I9s+Ce+lg+utZpsYw+F/gNZd209JS3sCn40aCDr1zlxCGUR\nULeKdTUsVv2tS358/4v0ILJ2Y4I+TSySuxMLNrlDLAUo1v7ukb6KNN6WnkwxCsY5\nLdmgwX7BYwKBgFK4FwmLoffYvBoB7t8gzNLqcsleJ4CJr8Bc95JnllvGPz4Y33/F\nbPjsi3G4hZgQKN/mWfGNNbe8rZWMf9QFq5Bg43eAwr57x7y48Y3ohojCmFvNriKE\nVvlGbJAFo5eJJ8uuJNfChJ0BcCV/k3Aw4ord9VLPdjyJVy70yGyAHPPRAoGBAIWi\nv6GepsXlVDkTNm2sGx7JadOH1/JaIJw44PQq7pojDt0IAQ68rGLl2eiilTKs3hGX\nwmr9KFYN52eOeoXOUSE+N5nqHje9vawqeMMLCYQ8//NpP9bKN4F8VrKrRzcHHKzU\n/WpiH5GA676Za+BFeS2XT/jnNe7nxCagnh8D+wjnAoGAMWVlZyHDDYTTtOnnlgBh\napOHkpsYKo66PEBfKNLXPQcZfH1mydzZDImN01/beSo5Ujuus9GmAKFb8CNNzVzL\nPT6eFWm8cZfC8QN4EaSSzQtkMbMDfyqZQ4a6+x9x6AXEmWelDy3g3F+A2sYYsMjx\nP12XnD1zKYrPFfmTseMA2hQ=\n-----END PRIVATE KEY-----\n",
    "client_email": "service-account@crucial-media-449421-c2.iam.gserviceaccount.com",
    "client_id": "109194977158438675284",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/service-account%40crucial-media-449421-c2.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
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

