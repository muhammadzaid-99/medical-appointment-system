const Pool = require('pg').Pool;

// const pool = new Pool({
//   host: "localhost",
//   user: "postgres",
//   password: "admin",
//   database: "medapptest",
//   port: 5432
// });

const pool = new Pool({
  connectionString: "dpostgres://godrrlka:Acp8x0qQVaRN6jOSALHqgAjKiD7KzZ61@satao.db.elephantsql.com/godrrlka"
})

module.exports = {
  query: (text, params) => pool.query(text, params)
};