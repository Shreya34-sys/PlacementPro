/*
  Add these two lines to server.js.
  Do not replace your existing routes or socket/proctoring code.

  1) With the other route imports:
*/
const versantRoutes = require('./routes/versantRoutes');

/*
  2) With your other API mounts, BEFORE app.use('/', viewRoutes):
*/
app.use('/api/versant', versantRoutes);
