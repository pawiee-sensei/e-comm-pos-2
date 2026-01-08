const bcrypt = require('bcrypt');
const Admin = require('../models/admin.model');

function showLogin(req, res) {
  res.render('auth/adminLogin', { error: null });
}

async function login(req, res) {
  const { email, password } = req.body;

  const admin = await Admin.findByEmail(email);
  if (!admin) {
    return res.render('auth/adminLogin', { error: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) {
    return res.render('auth/adminLogin', { error: 'Invalid credentials' });
  }

  req.session.user = {
    id: admin.id,
    role: 'admin'
  };

  const redirectTo = req.session.redirectTo || '/admin';
  delete req.session.redirectTo;

  return res.redirect(redirectTo);
}

function logout(req, res) {
  req.session.destroy(() => res.redirect('/admin/login'));
}

module.exports = { showLogin, login, logout };
