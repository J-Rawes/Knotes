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

const { Pool } = require('pg');

// PostgreSQL client setup
const client = new Pool({
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
//app.use(express.json());
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
    try {
        const { courseID } = req.body;

        if (!courseID) {
            return res.status(400).json({ message: "Missing course ID" });
        }

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
            return res.status(404).json({ message: "No notes found" });
        }

        if (result2.rows.length === 0) {
            return res.status(404).json({ message: "No course found" });
        }

        const noteNames = result.rows.map(row => ({
            title: row.title,
            note_id: row.note_id,
            num_likes: row.num_likes
        }));

        const courseInfo = result2.rows[0];

        res.status(200).json({ noteNames, courseInfo });
    } catch (error) {
        console.error('Error fetching course note info:', error);
        res.status(500).json({ message: 'Server error fetching course info' });
    }
});


app.post('/getNoteCountAndID', async (req, res) => {
    try {
        const { courseID } = req.body;

        if (!courseID) {
            return res.status(400).json({ error: 'Missing course ID' });
        }

        const query = `
            SELECT ARRAY_AGG(note_id) AS note_ids
            FROM "Notes"
            WHERE course_id = $1
        `;

        const result = await client.query(query, [courseID]);

        if (!result.rows.length || !result.rows[0].note_ids) {
            return res.status(404).json({ message: 'No notes found' });
        }

        const noteIDs = result.rows[0].note_ids;

        res.status(200).json({ noteIDs });
    } catch (error) {
        console.error('Error fetching note IDs:', error);
        res.status(500).json({ error: 'Server error' });
    }
});



    //Used in Course Search Page, this is used to determine the amount of buttons
   app.post('/getCourseCount', async (req, res) => {
    try {
        const query = `
            SELECT course_name, course_id
            FROM "Courses"
        `;

        const result = await client.query(query);

        if (!result.rows.length) {
            return res.status(404).json({ message: "No courses found" });
        }

        const courseArr = result.rows.map(row => ({
            course_id: row.course_id,
            course_name: row.course_name
        }));

        res.status(200).json({ courseArr });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Error fetching courses' });
    }
});

app.post('/uploadNote', async (req, res) => {
  console.log("Upload request received");

  const clientConnection = await client.connect(); // use a dedicated client for transaction

  try {
    const { course, title, imageArray, txtArray, username } = req.body;

    if (!course || !title || !username) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await clientConnection.query('BEGIN'); // start transaction

    // Get course_id
    const courseResult = await clientConnection.query(
      `SELECT course_id FROM "Courses" WHERE course_name = $1`,
      [course]
    );
    const courseID = courseResult.rows[0]?.course_id;
    if (!courseID) {
      await clientConnection.query('ROLLBACK');
      return res.status(400).json({ error: "Invalid course name" });
    }

    // Get user_id
    const userResult = await clientConnection.query(
      `SELECT user_id FROM "Users" WHERE uname = $1`,
      [username]
    );
    const userID = userResult.rows[0]?.user_id;
    if (!userID) {
      await clientConnection.query('ROLLBACK');
      return res.status(400).json({ error: "Invalid username" });
    }

    // Generate note ID
    const noteID = await generateID("Notes", "note_id");

    // Insert into Notes
    await clientConnection.query(
      `INSERT INTO "Notes" (note_id, title, num_likes, course_id, user_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [noteID, title, 0, courseID, userID]
    );

    // Prepare text inserts
    const textInserts = txtArray.map(async (text) => {
      const textID = await generateID("Text", "text_id");
      return clientConnection.query(
        `INSERT INTO "Text" (text_id, text, note_id) VALUES ($1, $2, $3)`,
        [textID, text, noteID]
      );
    });

    // Prepare image inserts
    const imageInserts = imageArray.map(async (image) => {
      const imageID = await generateID("Images", "image_id");
      return clientConnection.query(
        `INSERT INTO "Images" (image_id, image, note_id) VALUES ($1, $2, $3)`,
        [imageID, image, noteID]
      );
    });

    // Execute all inserts in parallel
    await Promise.all([...textInserts, ...imageInserts]);

    await clientConnection.query('COMMIT'); // commit transaction

    console.log("✅ Note uploaded:", { title, course, username });
    res.status(200).json({ message: "Note uploaded successfully" });

  } catch (error) {
    await clientConnection.query('ROLLBACK');
    console.error("❌ Error uploading note:", error);
    res.status(500).json({ error: "Server error while uploading note" });
  } finally {
    clientConnection.release(); // release the connection back to the pool
  }
});


/*
app.post('/uploadNote', async (req, res) => {
  console.log("Made it 1");
    let body = '';
    req.on('end', async () => {
      console.log("Made it 2");
        const {course, title, imageArray, txtArray, username} =req.body;

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

          console.log("Made it 3");
            // Query to get the user_id from the Users table
            const getUserIDQuery = `
                SELECT user_id
                FROM "Users"
                WHERE uname = $1
    `       ;
            const userIDResult = await client.query(getUserIDQuery, [username]);
            const userID = userIDResult.rows[0]?.user_id;

          console.log("Made it 4");
           
            const noteNum = await generateID("Notes", "note_id");
            
            // Insert note into the Notes table
            const query = `
                INSERT INTO "Notes" (note_id, title, num_likes, course_id, user_id)  
                VALUES($1, $2, $3, $4, $5)
            `;
          const numlikes=0;
            await client.query(query, [noteNum, title, numlikes, courseID, userID]);

          console.log("Made it 5");
            // Insert text entries into the Text table
            for (const text of txtArray) {
                const textNum = await generateID("Text", "text_id");
                const query2 = `
                    INSERT INTO "Text" (text_id, text, note_id)  
                    VALUES($1, $2, $3)
                `;
                await client.query(query2, [textNum, text, noteNum]);
              console.log("Made it 6");
            }

            // Insert image entries into the Images table
            for (const image of imageArray) {
                const imageNum = await generateID("Images", "image_id");
                const query3 = `
                    INSERT INTO "Images" (image_id, image, note_id)  
                    VALUES($1, $2, $3)
                `;
                await client.query(query3, [imageNum, image, noteNum]);
              console.log("Made it 7");
            }

          console.log("Made it 8");
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({message: 'Note uploaded successfully'}));
        } catch (error) {
            console.error('Error uploading note:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({error: 'Database error'}));
        }
    });
});
*/

app.post('/verifySecurityAnswer', async (req, res) => {
    try {
        const { username, securityAnswer } = req.body;

        if (!username || !securityAnswer) {
            return res.status(400).json({ error: 'Missing username or security answer' });
        }

        const query = `
            SELECT securityq_ans
            FROM "Users"
            WHERE uname = $1
        `;

        const result = await client.query(query, [username]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const storedHashAnswer = result.rows[0].securityq_ans;

        if (storedHashAnswer.trim() === securityAnswer.trim()) {
            return res.status(200).json({ success: true, message: 'Security answer verified' });
        } else {
            return res.status(401).json({ success: false, message: 'Incorrect security answer' });
        }

    } catch (error) {
        console.error('Error verifying security answer:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


app.post('/resetPassword', async (req, res) => {
    try {
        const { username, newPassword } = req.body;

        if (!username || !newPassword) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        const query = `
            UPDATE "Users"
            SET pword = $1
            WHERE uname = $2
        `;

        await client.query(query, [newPassword, username]);

        res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/verifyUsername', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const query = 'SELECT securityq FROM "Users" WHERE uname = $1';
        const result = await client.query(query, [username]);

        if (result.rows.length > 0) {
            const securityQuestion = result.rows[0].securityq;
            return res.status(200).json({ exists: true, securityQuestion });
        } else {
            return res.status(200).json({ exists: false });
        }
    } catch (error) {
        console.error('Error verifying username:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/deleteNote', async (req, res) => {
    try {
        const { noteID } = req.body;

        if (!noteID) {
            return res.status(400).json({ error: 'Missing note ID' });
        }

        const query = 'DELETE FROM "Notes" WHERE note_id = $1';
        const result = await client.query(query, [noteID]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.status(200).json({ message: 'Note successfully deleted' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


app.get('/protected', async (req, res) => {
    authenticateToken(req, res, () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'This is a protected route', user: req.user }));
    });
});


app.post('/getNoteTombstoneInfo', async (req, res) => {
    try {
        const { noteID } = req.body;

        if (!noteID) {
            return res.status(400).json({ error: 'Missing note ID' });
        }

        // Query image, text, and note data
        const imageQuery = 'SELECT * FROM "Images" WHERE note_id = $1';
        const textQuery = 'SELECT * FROM "Text" WHERE note_id = $1';
        const noteQuery = 'SELECT * FROM "Notes" WHERE note_id = $1';

        const imageResult = await client.query(imageQuery, [noteID]);
        const textResult = await client.query(textQuery, [noteID]);
        const noteResult = await client.query(noteQuery, [noteID]);

        if (noteResult.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // Convert images to base64 strings
        const images = imageResult.rows.map(row =>
            row.image ? `data:image/png;base64,${row.image.toString('base64')}` : null
        );

        const text = textResult.rows.map(row => row.text);
        const noteInfo = noteResult.rows[0];

        // Get the username from the user_id
        const userResult = await client.query(
            'SELECT uname FROM "Users" WHERE user_id = $1',
            [noteInfo.user_id]
        );
        noteInfo.username = userResult.rows[0]?.uname || "Unknown";

        // Send JSON response
        res.status(200).json({ images, text, noteInfo });
    } catch (error) {
        console.error('Error retrieving tombstone info:', error);
        res.status(500).json({ error: 'Database error' });
    }
});


app.post('/likeNote', async (req, res) => {
    try {
        const { currentNote, courseID, username } = req.body;

        if (!currentNote || !courseID || !username) {
            return res.status(400).json({ error: 'Missing required fields (note ID, course ID, or username)' });
        }

        console.log("Liking note:", currentNote);
        console.log("From user:", username);

        // Update note likes
        await client.query(
            `UPDATE "Notes" SET num_likes = num_likes + 1 WHERE note_id = $1`,
            [currentNote]
        );

        // Update liked notes for user
        await client.query(
            `UPDATE "Users" SET liked_notes = array_append(liked_notes, $1::bigint) WHERE uname = $2`,
            [currentNote, username]
        );

        // Update liked courses for user
        await client.query(
            `UPDATE "Users" SET liked_courses = array_append(liked_courses, $1::bigint) WHERE uname = $2`,
            [courseID, username]
        );

        res.status(200).json({ message: 'Note liked successfully' });

    } catch (error) {
        console.error('Error liking note:', error);
        res.status(500).json({ error: 'Server error' });
    }
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
    try {
        const query = `
            SELECT course_name, course_id
            FROM "Courses"
        `;

        const result = await client.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No courses found" });
        }

        const courseArr = result.rows.map(row => ({
            course_id: row.course_id,
            course_name: row.course_name
        }));

        res.status(200).json({ courseArr });

    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Server error' });
    }
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

