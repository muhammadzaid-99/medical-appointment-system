const Pool = require('pg').Pool;

// const pool = new Pool({
//   host: "localhost",
//   user: "postgres",
//   password: "admin",
//   database: "medapptest",
//   port: 5432
// });

const pool = new Pool({
  connectionString: `${secrets.DBCONNSTRING}`
})

module.exports = {
  query: (text, params) => pool.query(text, params)
};
