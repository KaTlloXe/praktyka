const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  database: 'vacation_db',
  user: 'root',
  password: '142536',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

module.exports = connection;
