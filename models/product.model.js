const db = require('../db');

exports.findAll = async ({ search, category_id, offset, limit }) => {
  let sql = `SELECT p.*, c.name AS category_name 
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE 1=1`;

  const params = [];

  if (search) {
    sql += ` AND p.name LIKE ?`;
    params.push(`%${search}%`);
  }

  if (category_id) {
    sql += ` AND p.category_id = ?`;
    params.push(category_id);
  }

  sql += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [rows] = await db.query(sql, params);
  return rows;
};

exports.countAll = async ({ search, category_id }) => {
  let sql = `SELECT COUNT(*) AS total FROM products WHERE 1=1`;
  const params = [];

  if (search) {
    sql += ` AND name LIKE ?`;
    params.push(`%${search}%`);
  }

  if (category_id) {
    sql += ` AND category_id = ?`;
    params.push(category_id);
  }

  const [[row]] = await db.query(sql, params);
  return row.total;
};

exports.create = async (data) => {
  const [r] = await db.query(
    `INSERT INTO products (name, category_id, price, stock, image) VALUES (?,?,?,?,?)`,
    [data.name, data.category_id, data.price, data.stock, data.image]
  );
  return r.insertId;
};

exports.findById = async (id) => {
  const [[row]] = await db.query(
    `SELECT * FROM products WHERE id = ? LIMIT 1`,
    [id]
  );
  return row;
};

exports.update = async (id, data) => {
  await db.query(
    `UPDATE products SET name=?, category_id=?, price=?, stock=?, image=? WHERE id=?`,
    [data.name, data.category_id, data.price, data.stock, data.image, id]
  );
};

exports.delete = async (id) => {
  await db.query(`DELETE FROM products WHERE id = ?`, [id]);
};
