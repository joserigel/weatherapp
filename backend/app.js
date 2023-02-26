require('dotenv').config();

// Set up MySQL Connection
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    
});
connection.connect();

// CORS Option and Express initialization
const cors =  require('cors');
const express = require('express');
const app = express();
const port = process.env.PORT;

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200
}


// GET middleware to fetch search suggestions 
// and serve coordinates
app.get('/', cors(corsOptions), (req, res) => {
    // SQL Query to get country, city, latitude and longitutde (first 5)
    let query = mysql.format("SELECT country, city, latitude, longitude FROM location WHERE city LIKE CONCAT('%', ?, '%') LIMIT 5;", 
        [req.query.s == null? "" : req.query.s]);
    
    // Sending data fetched by MySQL Query as JSON
    connection.query(query, (err, rows, fields) => {
        if (err) {
            res.statusCode = 502;
            res.end(err.toString());
        } else {
            res.json(rows);
        }
    })
});

// Starting up of App on designated port
app.listen(port, () => {
    console.log("listening!");
})

// Exit cleanup to close MySQL Connection 
function exitHandler() {
    connection.end();
    process.exit();
}
process.on('SIGINT', exitHandler.bind(null));