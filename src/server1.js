var express = require('express');
require('dotenv').config();
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var cors = require('cors');
const abd = require('./utls/abd.js');
const TradingView = require('@mathieuc/tradingview')
const spp = require('../src/models/limit.js')
const http = require('http');
const { initSocket } = require('./socket.js');

const server = http.createServer(app);
initSocket(server);

mongoose.set("strictQuery", false);
mongoose.connect(`mongodb+srv://${process.env.use}:${process.env.pass}@cluster0.lsqbqko.mongodb.net/cyborg0?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err) => {
  if (!err) {
    console.log('MongoDB Connection Succeeded.');
    abd();
  } else {
    console.error('Error in DB connection:', err);
  }
});

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

app.use(express.static(path.join(__dirname, 'views')));

var index = require('./routes/index');
app.use('/', index);

// Endpoint to fetch stock data
app.get('/api/stockData/:symbol/:timeframe', async (req, res, next) => {
  try {
    console.log('req');
    const symbol = req.params.symbol;
    const timeframe = req.params.timeframe;
    const market = `NSE:${symbol}`;

    const client = new TradingView.Client();
    const chart = new client.Session.Chart();
    chart.setTimezone('Asia/Kolkata');

    chart.setMarket(market, {
      timeframe: timeframe,
      range: 200,
    });

    chart.onUpdate(async () => {
      res.send(chart.periods);
      client.end();
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/stockData/:symbol/:timeframe/:time', async (req, res, next) => {
  try {
    console.log('req');
    const symbol = req.params.symbol;
    const timeframe = req.params.timeframe;
    const time = req.params.time / 1000;
    const market = `NSE:${symbol}`;

    const client = new TradingView.Client();
    const chart = new client.Session.Chart();
    chart.setTimezone('Asia/Kolkata');

    chart.setMarket(market, {
      timeframe: timeframe,
      range: 100,
      to: time
    });

    chart.onUpdate(async () => {
      console.log(chart.periods[0]);
      res.send(chart.periods);
      client.end();
    });
  } catch (err) {
    next(err);
  }
});

app.get('/data', async (req, res, next) => {
  try {
    console.log('req')
    var array = await spp.find({});
    res.send(array);
  } catch (err) {
    next(err);
  }
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// global error handler
app.use(function (err, req, res, next) {
  console.error(err.stack); // log the error stack for debugging
  res.status(err.status || 500).send({
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 4002;
server.listen(PORT, function () {
  console.log('Server is started on http://127.0.0.1:' + PORT);
});
