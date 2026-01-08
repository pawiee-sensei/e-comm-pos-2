exports.requireAdmin = (req, res, next) => {
  if (!req.session.user) {
    req.session.redirectTo = req.originalUrl;
    return res.redirect('/admin/login');
  }

  if (req.session.user.role !== 'admin') {
    return res.status(403).send('Forbidden');
  }

  next();
};
