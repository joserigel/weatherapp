require('dotenv').config();

const mysql = require('mysql');
const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    
});
connection.connect();

const cors =  require('cors');
const express = require('express');
const app = express();
const port = 8393;

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200
}

app.get('/', cors(corsOptions), (req, res) => {
    let query = mysql.format("SELECT country, city, latitude, longitude FROM location WHERE city LIKE CONCAT('%', ?, '%') LIMIT 5;", 
        [req.query.s == null? "" : req.query.s]);
    
    connection.query(query, (err, rows, fields) => {
        if (err) {
            res.statusCode = 502;
            res.end(err.toString());
        } else {
            res.json(rows);
        }
    })
});

app.listen(port, () => {
    console.log("listening!");
    
})
function exitHandler() {
    connection.end();
    process.exit();
}

process.on('SIGINT', exitHandler.bind(null));