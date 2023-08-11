var express = require('express');
var env = require('dotenv').config()
var ejs = require('ejs');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var request = require('request-promise');
var cron = require("node-cron")

mongoose.set("strictQuery", false);
mongoose.connect('mongodb+srv://nisargpatel0466:nn__4569@cluster0.lsqbqko.mongodb.net/cyborg0?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err) => {
  if (!err) {
    console.log('MongoDB Connection Succeeded.');
  } else {
    console.log('Error in DB connection : ' + err);
  }
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
});

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

// function requestschedule(){
//   var url = 'http://localhost:4000/maintainance';
	
// 	var info ={
// 		method : 'POST',
// 		uri    :  url,
// 		body   :  {'permisiion': "execute!"},
// 		json   :  true
// 	};

//   request(info).then(async function(parsedBody){
//     console.log(parsedBody);
//   });
// }

// cron.schedule("51 12 * * *", function(){
//   requestschedule();
// });

const PORT = process.env.PORT || 4000;
app.listen(PORT, function () {
    console.log('Server is started on http://127.0.0.0:'+PORT);
});
