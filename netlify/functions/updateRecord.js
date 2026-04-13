const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'mysql-5456f0d-cutmy.l.aivencloud.com',
  port: 11636,
  user: 'avnadmin',
  password: 'AVNS_ePlD8mFxi4r3Jjk-xV_',
  database: 'defaultdb',
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: '只支持 POST' }) };
  }

  try {
    const data = JSON.parse(event.body);

    const sql = `
      UPDATE work_records SET 
        client = ?, req = ?, total = ?, paid = ?, paidStatus = ?, 
        prodStatus = ?, board = ?, address = ?, contact = ?, note = ?, 
        date = ?, delivery = ?
      WHERE id = ?
    `;

    const values = [
      data.client, data.req || null, data.total, data.paid || 0,
      data.paidStatus || '未收', data.prodStatus || '未完成',
      data.board || null, data.address || null, data.contact || null,
      data.note || null, data.date, data.delivery || null, data.id
    ];

    await new Promise((resolve, reject) => {
      pool.query(sql, values, (err, result) => err ? reject(err) : resolve(result));
    });

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('更新失败:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};