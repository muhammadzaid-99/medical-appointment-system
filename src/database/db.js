const Pool = require('pg').Pool;

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "admin",
  database: "medapptest",
  port: 5432
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};