const db = require('../db');

exports.findAll = async ({ search, category_id, offset, limit }) => {
  let sql = `
    SELECT p.id, p.name, p.price, p.stock, p.image, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ` AND p.name LIKE ? `;
    params.push(`%${search}%`);
  }

  if (category_id) {
    sql += ` AND p.category_id = ? `;
    params.push(category_id);
  }

  sql += ` ORDER BY p.name ASC LIMIT ? OFFSET ? `;
  params.push(limit, offset);

  const [rows] = await db.query(sql, params);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM products WHERE id = ? LIMIT 1`, [id]
  );
  return rows[0] || null;
};

exports.countAll = async ({ search, category_id }) => {
  let sql = `SELECT COUNT(*) AS total FROM products WHERE 1=1`;
  const params = [];

  if (search) {
    sql += ` AND name LIKE ? `;
    params.push(`%${search}%`);
  }

  if (category_id) {
    sql += ` AND category_id = ? `;
    params.push(category_id);
  }

  const [rows] = await db.query(sql, params);
  return rows[0].total;
};

// Metrics
exports.countStockRange = async ({ min, max }) => {
  let sql = `SELECT COUNT(*) AS total FROM products WHERE 1=1`;
  const params = [];

  if (min != null) {
    sql += ` AND stock >= ? `;
    params.push(min);
  }

  if (max != null) {
    sql += ` AND stock <= ? `;
    params.push(max);
  }

  const [rows] = await db.query(sql, params);
  return rows[0].total;
};

exports.countStockEqual = async (value) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total FROM products WHERE stock = ?`, [value]
  );
  return rows[0].total;
};

exports.update = async (id, data) => {
  const { name, category_id, price, stock, image } = data;
  await db.query(
    `UPDATE products SET name=?, category_id=?, price=?, stock=?, image=? WHERE id=?`,
    [name, category_id, price, stock, image, id]
  );
};

exports.delete = async (id) => {
  await db.query(`DELETE FROM products WHERE id=?`, [id]);
};

exports.create = async ({ name, category_id, price, stock, image }) => {
  const [r] = await db.query(
    `INSERT INTO products (name, category_id, price, stock, image)
     VALUES (?, ?, ?, ?, ?)`,
    [name, category_id, price, stock, image]
  );
  return r.insertId;
};
