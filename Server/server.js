/*TODO: 
Handle Task logic (DB = Owen + Ares) (Text scan = Nathen)
*/

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const Hashes = require('jshashes'); // Import jshashes which is a hashing library

const jwt = require('jsonwebtoken'); //For keeping users authenticated
const JWT_SECRET = "ChickenJockey" // super seceret key (shhhhh)



const vision = require('@google-cloud/vision');

// PostgreSQL client setup
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'Knotes', // DB name
    password: 'of7224165', // DB password
    port: 5432, // Default PostgreSQL port
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));


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
    const url = req.url === '/' ? '/landingpage.html' : req.url;
    const ext = path.extname(url);

    // Serve static files (HTML, CSS, JS)
    if (ext === '.html') {
        serveStaticFile(path.join(__dirname, url), 'text/html', res);
    } else if (ext === '.css') {
        serveStaticFile(path.join(__dirname, url), 'text/css', res);
    } else if (ext === '.js') {
        serveStaticFile(path.join(__dirname, url), 'application/javascript', res);
    } else if (ext === '.png') {serveStaticFile(path.join(__dirname, url), 'image/png', res);}

    // Handle POST request for registration
    else if (req.method === 'POST' && req.url === '/register') { /////////////////////////////////////////////// /register is the "task" in question
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { username, password, securityQuestion, securityAnswer } = JSON.parse(body);

                if (!username || !password || !securityQuestion || !securityAnswer) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('A required field is missing');
                    return;
                }

                const checkQuery = 'SELECT uname FROM "Users" WHERE uname = $1';
                const checkResult = await client.query(checkQuery, [username]);

                if (checkResult.rows.length > 0) {
                    res.writeHead(409, { 'Content-Type': 'text/plain' });
                    res.end('Username already exists');
                    return;
                }

                const likedNotes = []; // Initialize liked_notes as an empty array
                const likedCourses = []; // Initialize liked_courses as an empty array

                // Insert into PostgreSQL (user_id is auto-generated)
                const user_gen_id = await generateID("Users", "user_id");
                console.log("User ID: ", user_gen_id); // Log the generated user ID
                client.query(
                    'INSERT INTO "Users" (user_id, uname, pword, securityq, securityq_ans, liked_notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [user_gen_id, username, password, securityQuestion, securityAnswer, likedNotes, likedCourses],
                    (err) => {
                        if (err) {
                            console.error('Database insert error:', err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Database error');
                        } else {

                            const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h'}); //GENEREATE JWT HERE

                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: 'User registered successfully', token }));
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
                var content = JSON.parse(body);
                console.log(content);
                content = content.content;
                console.log(typeof content);
                console.log("contents of: ", content);
                const textImg = dataUrlToBuffer(content);
                const extractedText = await extract(textImg);
                console.log(extractedText);

                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end(extractedText);

            } catch (error) {
                res.writeHead(400, {'Content-Type': 'text/plain'});
                console.log(error);
                res.end('Invalid request format');
            }
        });
    }




    else if (req.method === 'POST' && req.url === '/login') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { username, password } = JSON.parse(body);

                if (!username || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Missing username or password" }));
                    return;
                }

                // Get note count and IDs for the given course
                const query = `
                    SELECT pword 
                    FROM "Users"
                    WHERE uname = $1;
                `;

                const result = await client.query(query, [username]);
                const storedHashPass = result.rows[0].pword;



                if (storedHashPass && storedHashPass.trim() === password.trim()) {

                    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h'}); //GENEREATE JWT HERE

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ exists: true, token: token, message: "Login successful", }));   
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ exists: false, message: "Incorrect password"  }));
                }
            


            } catch (error) {
                console.error('Error verifying user:', error);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Error hashing password');
            }
        });
    }

    //USED FOR COURSE SEARCH PAGE WHEN USER TYPES IN THE SEARCH BAR
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
    
        //Used in Course Display Page, this is used to determine the amount of buttons and info fields about the course
        else if (req.method === 'POST' && req.url === '/getCourseNoteInfo') {
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
        }


else if (req.method === 'POST' && req.url === '/getNoteCountAndID') { //USED TO CREATE BUTTONS
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
    }


        //Used in Course Search Page, this is used to determine the amount of buttons
        else if (req.method === 'GET' && req.url === '/getCourseCount') {
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
    }

    else if (req.method === 'POST' && req.url === '/uploadNote') {
        let body = '';
    
        req.on('data', chunk => {
            body += chunk.toString();
        });
    
        req.on('end', async () => {
            const {course, title, imageArray, txtArray, username} = JSON.parse(body);

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
    }
    
    else if (req.method === 'POST' && req.url === '/verifySecurityAnswer') {
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
    }

    else if (req.method === 'POST' && req.url === '/resetPassword') {
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
    }

    else if (req.method === 'POST' && req.url === '/verifyUsername') {
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
    }

    else if (req.method === 'POST' && req.url === '/deleteNote') {
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
    }

    else if (req.method === 'GET' && req.url === '/protected') {
        authenticateToken(req, res, () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'This is a protected route', user: req.user }));
        });
    }

    else if (req.method === 'POST' && req.url === '/getNoteTombstoneInfo') { 
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
    }

    else if (req.method === 'POST' && req.url === '/likeNote') {
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
    }

    else if (req.method === 'POST' && req.url === '/getLikedNotes') {
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

                // Get the liked notes for the user
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
    }

    else if (req.method === 'POST' && req.url === '/getLikedCourses') {
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

                // Get the liked courses for the user
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

                result2 = await client.query(query2, [likedCourses]);

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
    return (fullTextAnnotation.text);

}



// Method for generating ID on table addition

async function generateID(idType, columnName) {
    console.log("Generating ID for: ", idType);
    try {
        const query = `SELECT MAX(${columnName}) AS max_id FROM "${idType}"`; // Use MAX to find the highest ID
        console.log(query);
        const result = await client.query(query);
        console.log(result);
        const maxId = result.rows[0].max_id || 0; // Default to 0 if no rows exist
        return maxId + 1; // Increment the highest ID by 1
    } catch (err) {
        console.error(`Error generating ${idType}:`, err);
        throw err;
    }
}

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

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Access token required' }));
        return;
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
            return;
        }

        req.user = user; // Attach user info to the request
        next();
    });
}


