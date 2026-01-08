const bcrypt = require('bcryptjs');

(async () => {
  const hashed = await bcrypt.hash("admin123", 10);
  console.log("HASHED PASSWORD:", hashed);
})();
