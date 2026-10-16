require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: '8b964856-ee3c-45cd-a048-7d4a991734c3', email: 'pproadmin@gmail.com', role: 'admin' },
  process.env.JWT_SECRET || 'placementpro_secret_key_@987#'
);

fetch('http://localhost:5000/api/admin/intelligence-stats', {
  headers: {
    Authorization: `Bearer ${token}`
  }
}).then(async r => {
  console.log('Status:', r.status);
  console.log('Body:', await r.text());
});
