const db = require('../config/db');
const User = require('../models/userModel');

(async () => {
  const [users] = await db.execute('SELECT * FROM users WHERE email = "pproadmin@gmail.com"');
  console.log('User from DB:', users);
  const user = await User.findById(users[0]?.id);
  console.log('User from findById:', user);
  process.exit(0);
})();
