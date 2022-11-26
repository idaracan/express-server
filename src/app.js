const express = require('express');
const app = express();

// server routes
app.use(require("./routes/admin"))
app.use(require("./routes/balances"))
app.use(require("./routes/contracts"))
app.use(require("./routes/jobs"))

module.exports = app;
