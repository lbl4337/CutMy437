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
      waitForConnections: true,
      connectionLimit: 5,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}
const db = getPool();

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors() };
  }

  try {
    const data = JSON.parse(event.body);

    const sql = `
    INSERT INTO work_records 
    (client, req, total, paid, paidStatus, prodStatus, processStatus, drawDone, checkDone, board, address, contact, note, date, delivery)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.client,
      data.req,
      data.total,
      data.paid || 0,
      data.paidStatus || '未收',
      data.prodStatus || '未完成',
      'pending',
      0,
      0,
      data.board,
      data.address,
      data.contact,
      data.note,
      data.date,
      data.delivery
    ];

    await query(sql, values);

    return ok({ success: true });

  } catch (e) {
    return err(e);
  }
};

function query(sql, params = []) {
  return new Promise((res, rej) => {
    db.query(sql, params, (e, r) => e ? rej(e) : res(r));
  });
}

function cors() {
  return { 'Access-Control-Allow-Origin': '*' };
}

function ok(data) {
  return { statusCode: 200, headers: cors(), body: JSON.stringify(data) };
}

function err(e) {
  return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: e.message }) };
}
