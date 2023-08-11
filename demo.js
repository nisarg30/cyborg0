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
var td_log = require('./src/models/trade_log')
var Users = require('./src/models/user.js');
const limit = require('./src/models/limit.js');

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

const tdata = async () => {
  // console.log(e);
  // console.log(x);
  // await limit.findOneAndUpdate(
  //   { stockname: x },
  //   {
  //     $push: {
  //       log: e
  //     }
  //   }
  // );

  // const info = await fetch123(stockname);
    const minExPrice = 100;
    const maxExPrice = 120;
    const data = await limit.findOne({
        'stockname': "BPCL",
        'log.ex_price': { $gte: 90, $lte: 110 }
    });

console.log(data);

    var txt = "ADANIENT,2545,2545.2ADANIPORTS,805.05,805.1APOLLOHOSP,4915.65,4915.6ASIANPAINT,3240.1,3240.6AXISBANK,939.75,940.2BAJAJ_AUTO,4641.85,4641.75BAJAJFINSV,1521.15,1520.6BAJFINANCE,7117.5,7119.65BHARTIARTL,870.8,870.75BPCL,360.8,360.6BRITANNIA,4542.65,4544.5CIPLA,1253.65,1253.6COALINDIA,235.05,235.1DIVISLAB,3742.05,3742.15DRREDDY,5829.3,5829.5EICHERMOT,3428,3428GRASIM,1830,1830HCLTECH,1136,1136HDFCBANK,1636,1635.45HDFCLIFE,639.4,639.15HEROMOTOCO,3028.6,3028.55HINDALCO,467.05,467.05HINDUNILVR,2535.9,2536.55ICICIBANK,967.25,967.1INDUSINDBK,1423.45,1422.95INFY,1392.1,1392.2ITC,452.1,452.1JSWSTEEL,829.6,829.15KOTAKBANK,1811.45,1811.15LT,2642.35,2641.7LTIM,5108.55,5108MARUTI,9381.8,9380.05M_M,1547,1547.05NESTLEIND,21959.95,21956.95NTPC,217.15,217.2ONGC,178.65,178.65POWERGRID,240.9,241RELIANCE,2549.3,2549.05SBILIFE,1337.95,1338.25SBIN,572.7,572.8SUNPHARMA,1146.7,1146.6TATACONSUM,852.5,853.25TATAMOTORS,619,617TATASTEEL,120.1,120.25TCS,3448.25,3450.45TECHM,1235.3,1236TITAN,2971,2970.95ULTRACEMCO,8113.35,8113.7UPL,609.35,607.4WIPRO,417.95,417.99"

    console.log(txt.length);
}

tdata();

