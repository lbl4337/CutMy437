const mysql = require('mysql2');

// ============================================
// ✅ Aiven 数据库连接信息
// ============================================
const pool = mysql.createPool({
  host: 'mysql-5456f0d-cutmy.l.aivencloud.com',
  port: 11636,
  user: 'avnadmin',
  password: 'AVNS_ePlD8mFxi4r3Jjk-xV_',
  database: 'defaultdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false }
});

// ============================================
// 🆕 自动建表（包含 processStatus 字段）
// ============================================
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS work_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client VARCHAR(255) NOT NULL,
    req TEXT,
    total DECIMAL(10,2),
    paid DECIMAL(10,2),
    paidStatus VARCHAR(50),
    prodStatus VARCHAR(50),
    processStatus VARCHAR(20) DEFAULT 'pending',
    board VARCHAR(255),
    address TEXT,
    contact VARCHAR(100),
    note TEXT,
    date DATE,
    delivery DATE
  )
`;

pool.query(createTableSQL, (err) => {
  if (err) {
    console.error('建表失败:', err);
  } else {
    console.log('✅ work_records 表已就绪');
  }
});

// ============================================
// 处理 POST 请求：保存一条工作记录
// ============================================
exports.handler = async (event) => {
  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: '只支持 POST 请求' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    console.log('收到数据:', data.client);

    // 先确保表存在（包含 processStatus 字段）
    await new Promise((resolve, reject) => {
      pool.query(`
        CREATE TABLE IF NOT EXISTS work_records (
          id INT AUTO_INCREMENT PRIMARY KEY,
          client VARCHAR(255) NOT NULL,
          req TEXT,
          total DECIMAL(10,2),
          paid DECIMAL(10,2),
          paidStatus VARCHAR(50),
          prodStatus VARCHAR(50),
          processStatus VARCHAR(20) DEFAULT 'pending',
          board VARCHAR(255),
          address TEXT,
          contact VARCHAR(100),
          note TEXT,
          date DATE,
          delivery DATE
        )
      `, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // 检查并添加 processStatus 字段（如果表已存在但没有该字段）
    await new Promise((resolve, reject) => {
      pool.query(`
        SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'defaultdb' 
        AND TABLE_NAME = 'work_records' 
        AND COLUMN_NAME = 'processStatus'
      `, (err, results) => {
        if (err) {
          reject(err);
        } else {
          if (results[0].cnt === 0) {
            pool.query(`ALTER TABLE work_records ADD COLUMN processStatus VARCHAR(20) DEFAULT 'pending'`, (err2) => {
              if (err2) console.log('添加字段失败（可能已存在）:', err2.message);
              resolve();
            });
          } else {
            resolve();
          }
        }
      });
    });

    // 插入数据
    const sql = `
      INSERT INTO work_records 
      (client, req, total, paid, paidStatus, prodStatus, processStatus, board, address, contact, note, date, delivery) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.client,
      data.req || null,
      data.total,
      data.paid || 0,
      data.paidStatus || '未收',
      data.prodStatus || '未完成',
      data.processStatus || 'pending',  // 默认未处理
      data.board || null,
      data.address || null,
      data.contact || null,
      data.note || null,
      data.date,
      data.delivery || null
    ];

    const result = await new Promise((resolve, reject) => {
      pool.query(sql, values, (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });

    console.log('✅ 记录已保存, ID:', result.insertId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: '记录已保存',
        id: result.insertId
      })
    };

  } catch (error) {
    console.error('保存失败:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: '保存失败，请稍后重试'
      })
    };
  }
};