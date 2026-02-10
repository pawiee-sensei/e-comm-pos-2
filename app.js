require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');

const app = express();

/**
 * ===============================
 * View engine
 * ===============================
 */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/**
 * ===============================
 * Helmet (CSP enabled)
 * No inline scripts or styles
 * ===============================
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'", "http://localhost:3000"], // allow AJAX fetch
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    }
  })
);

/**
 * ===============================
 * Body parsing
 * ===============================
 */
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

/**
 * ===============================
 * Session (MemoryStore — DEV ONLY)
 * ===============================
 */
app.use(
  session({
    name: 'ecomm.sid',
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // only true if https in production
      sameSite: 'lax'
    }
  })
);

/**
 * ===============================
 * Static assets
 * ===============================
 */
app.use('/public', express.static(path.join(__dirname, 'public')));

/**
 * ===============================
 * Routes (Mounted Here)
 * ===============================
 */
const adminAuthRoutes = require('./routes/admin.auth.routes');
const userAuthRoutes = require('./routes/user.auth.routes');
const adminUIRoutes = require('./routes/admin.ui.routes');

app.use('/admin', adminAuthRoutes);
app.use('/', userAuthRoutes);

app.use('/', require('./routes/user.shop.routes'));
app.use('/', require('./routes/user.cart.routes'));
app.use('/', require('./routes/user.checkout.routes'));

// Admin UI shell (Sidebar + Dashboard Panels)
app.use('/admin', adminUIRoutes);

// Product Panel Routes (Phase 3 Part 1)
app.use('/admin', require('./routes/admin.product.routes'));

// AJAX: Stock Adjust
app.use('/admin', require('./routes/admin.product.stock.routes'));

// AJAX: Product Create
app.use('/admin', require('./routes/admin.product.create.routes'));

app.use('/admin', require('./routes/admin.product.update.routes'));

app.use('/admin', require('./routes/admin.product.logs.routes'));

app.use('/admin', require('./routes/admin.orders.routes'));

app.use('/admin', require('./routes/admin.pos.routes'));

app.use('/admin', require('./routes/admin.strategy.routes'));

/**
 * ===============================
 * Root redirect
 * ===============================
 */
app.get('/', (req, res) => {
  res.redirect('/admin');
});

/**
 * ===============================
 * Server start
 * ===============================
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
