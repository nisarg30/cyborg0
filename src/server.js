var express = require('express');
require('dotenv').config();
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var request = require('request-promise');
var cron = require("node-cron");
var cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');

const http = require('http');

mongoose.set("strictQuery", false);
mongoose.connect(`mongodb+srv://${process.env.use}:${process.env.pass}@cluster0.lsqbqko.mongodb.net/cyborg0?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err) => {
  if (!err) {
    console.log('MongoDB Connection Succeeded.');
  } else {
    console.log('Error in DB connection : ' + err);
  }
});

const server = http.createServer(app);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {});

app.use(cors());

app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + '/views'));

var index = require('./routes/index');
app.use('/', index);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});

function requestschedule1() {
  var url = 'http://localhost:4000/maintainance';

  var info = {
    method: 'POST',
    uri: url,
    body: { 'permisiion': "execute!" },
    json: true
  };

  request(info).then(async function (parsedBody) {
    console.log(parsedBody);
  });
}

function requestschedule2() {
  var url = 'http://localhost:4000/limitmaintainance';

  var info = {
    method: 'POST',
    uri: url,
    body: { 'permisiion': "execute!" },
    json: true
  };

  request(info).then(async function (parsedBody) {
    console.log(parsedBody);
  });
}

cron.schedule("30 15 * * 1-5", function () {
  requestschedule1();
});

cron.schedule("00 16 * * 1-5", function () {
  requestschedule2();
});

function rotateSecretKey() {
  let envContent = fs.readFileSync('.env', 'utf-8');
  const newSecretKey = crypto.randomBytes(32).toString('hex');
  const newEnvContent = envContent.replace(/secret_key=.*/, `secret_key=${newSecretKey}`);
  fs.writeFileSync('.env', newEnvContent, 'utf-8');
  
  console.log('Secret key rotated successfully.');
}

cron.schedule('00 12 * * 0', rotateSecretKey);

const PORT = process.env.PORT || 4000;

server.listen(PORT, function () {
  console.log('Server is started on http://127.0.0.0:' + PORT);
});
