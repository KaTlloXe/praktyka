const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const crypto = require('crypto');
const mainRouter = require('./routers/main_router');
const connection = require('./routers/db');

const host = '127.0.0.1';
const port = 8080;

app.use(express.static('css'));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, './public')));

app.use(session({
  secret: 'your_secret_key',
  resave: true,
  saveUninitialized: true
}));
app.use(flash());

app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

app.use('/', mainRouter);

app.listen(port, host, () => {
  console.log(`Start app on port ${port}`);
});
