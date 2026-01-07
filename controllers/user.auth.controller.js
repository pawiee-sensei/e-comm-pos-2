const bcrypt = require('bcrypt');
const User = require('../models/user.model');

exports.showSignup = (req, res) => {
  res.render('auth/userSignup', { error: null });
};

exports.signup = async (req, res) => {
  const { email, password } = req.body;

  const existing = await User.findByEmail(email);
  if (existing) {
    return res.render('auth/userSignup', { error: 'Email already exists' });
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create(email, hashed);

  res.redirect('/login');
};

exports.showLogin = (req, res) => {
  res.render('auth/userLogin', { error: null });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    return res.render('auth/userLogin', { error: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.render('auth/userLogin', { error: 'Invalid credentials' });
  }

  req.session.user = {
    id: user.id,
    role: 'user'
  };

  const redirectTo = req.session.redirectTo || '/';
  delete req.session.redirectTo;

  res.redirect(redirectTo);
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
