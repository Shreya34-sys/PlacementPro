const mysql = require('mysql2/promise'); //Importing the MySQL Library.Promises allow you to use async/await syntax when running SQL queries, keeping your database code clean and preventing deeply nested callback functions.
require('dotenv').config();  //Loads environment variables stored inside your .env file directly into process.env

const pool = mysql.createPool({     //Creating a new database connection for every incoming user request is slow and resource-heavy. A pool maintains a reusable group of open connections that multiple user requests can share simultaneously.
    host: process.env.DB_HOST || 'localhost',  //Sets the database server location using process.env.DB_HOST. If it's missing in .env, it defaults to 'localhost'
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'placementpro',
    waitForConnections: true,  //If all pool connections are busy when a new request comes in, setting this to true makes the request wait in a queue until a connection frees up (instead of throwing an immediate error).
    connectionLimit: 10, //estricts the pool to opening a maximum of 10 simultaneous connections at any given time to protect your MySQL server from memory overload.
    queueLimit: 0  //Sets no cap (0) on the maximum number of requests that can wait in line when all 10 connections are currently busy
});

module.exports = pool;