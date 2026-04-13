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
    const { id } = JSON.parse(event.body);

    await new Promise((resolve, reject) => {
      pool.query('DELETE FROM work_records WHERE id = ?', [id], (err, result) => err ? reject(err) : resolve(result));
    });

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('删除失败:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};