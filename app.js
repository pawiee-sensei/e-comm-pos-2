require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');

const app = express();

/**
 * Helmet with CSP enabled
 * No inline scripts or styles allowed
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
 * Body parsing
 */
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

/**
 * Session (MemoryStore — DEV ONLY)
 */
app.use(
  session({
    name: 'ecomm.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    }
  })
);

/**
 * Static assets
 */
app.use('/public', express.static(path.join(__dirname, 'public')));

/**
 * Health check route (NO BUSINESS LOGIC)
 */
app.get('/', (req, res) => {
  res.status(200).send('E-COMM PHASE 0 — FOUNDATION OK');
});

/**
 * Server start
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
