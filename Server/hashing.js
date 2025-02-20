import { Client } from 'pg'; // Import the CLient class from the pg module
const bcrypt = require('bcrypt'); // Import bcrypt which is a hashing library


//Set up postGRESQL connection
const client = new Client({
    user: 'postgres',
    password: 'of7224165',
    host: '', //our server: example: my.database-server.com
    port: 5432, //default postgreSQL port is 5432...this could be localhost as well
    database: 'Knotes' //DB name
});

async function saveHashedPasswordToDB(myPlaintextPassword) { //async allows the function to not block, hashing is slow and expensive
    try {
        await client.connect(); //Connect to the DB

        // Hashing a password:
        const saltRounds = 10; // Number of rounds to generate the salt. A round is a hashing operation. The more rounds, the more secure the hash.
        const hashedPassword = await bcrypt.hash(myPlaintextPassword, saltRounds); //Hash the password

        //Creation of a user's profile
        const query = "INSERT INTO table_name (column1, column2, ...) VALUES ($1, $2, ...)"; //Insert query...$1, $2, ... are placeholders
        const values = ['value1', 'value2', "..."]; //Values to insert...stops SQL injection attacks
        await client.query(query, values); //run the query



        await client.end(); //Close the connection to the DB
    } catch (e) {
        console.error('Error', err);
        throw e;
    }

    finally {
        await client.end(); //Close the connection to the DB
    }
}

saveHashedPasswordToDB('myPassword');
