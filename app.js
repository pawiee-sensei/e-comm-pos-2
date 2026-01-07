require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');


const app = express();


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
        connectSrc: ["'self'"],
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
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true only in production with HTTPS
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
 * Auth Routes (MOUNTED HERE)
 * ===============================
 */
const adminAuthRoutes = require('./routes/admin.auth.routes');
const userAuthRoutes = require('./routes/user.auth.routes');

app.use('/admin', adminAuthRoutes); // /admin/login, /admin/register
app.use('/', userAuthRoutes);       // /login, /signup

/**
 * ===============================
 * Health check route
 * (NO BUSINESS LOGIC)
 * ===============================
 */
app.get('/', (req, res) => {
  res.status(200).send('E-COMM PHASE 0 — FOUNDATION OK');
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
