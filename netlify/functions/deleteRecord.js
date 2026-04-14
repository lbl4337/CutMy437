const mysql = require('mysql2');

let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}
const db = getPool();

exports.handler = async (event) => {
  try {
    const { id } = JSON.parse(event.body);
    await query('DELETE FROM work_records WHERE id=?', [id]);
    return ok({ success: true });
  } catch (e) {
    return err(e);
  }
};

function query(sql, p) {
  return new Promise((res, rej) => {
    db.query(sql, p, (e, r) => e ? rej(e) : res(r));
  });
}

function cors() { return { 'Access-Control-Allow-Origin': '*' }; }
function ok(d) { return { statusCode: 200, headers: cors(), body: JSON.stringify(d) }; }
function err(e) { return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: e.message }) }; }
