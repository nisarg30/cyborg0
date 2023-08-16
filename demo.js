var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var td_log = require('./src/models/trade_log')
var Users = require('./src/models/user.js');
const op_log = require('./src/models/open_trades');
const limit = require('./src/models/limit.js');
const fetch123 = require('./src/utls/s_price');
const limitexe = require('./src/utls/limitexe');

const {buy_handle, sell_handle} = require('./src/control/limit_order');
getConnection = async () => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(
      'mongodb+srv://nisargpatel0466:nn__4569@cluster0.lsqbqko.mongodb.net/cyborg0?retryWrites=true&w=majority',
      { useNewUrlParser: true }
    ).then(async () => {
      console.log('Connection to DB Successful');
      // await xyz();
      // for(var i=0; i<15; i++){
      //   await tdata();
      //   console.log(i);
      // }
      // await abc();
      // await sdata();
      // await abc();
      await rtg();
    });
  } catch (err) {
    console.error('Connection to DB Failed:', err);
  }
}

getConnection();

function randINT(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const sdata = async () => {
  var username = "np" + "1";
  const udata1 = await op_log.findOne({ username: username});
  var array = udata1.log;

  for(i in array){
    const order = {
      username : username,
      stockname : array[i].stockname,
      exprice : array[i].ex_price,
      quantity : array[i].quantity,
      ordertime : "intraday",
      direction : "SELL"
    }
    console.log(order);
    const x = await sell_handle(order);
    console.log(x);
  }

  username = "np" + "2";
  const udata2 = await op_log.findOne({ username: username});
  array = udata2.log;

  for(i in array){
    const order = {
      username : username,
      stockname : array[i].stockname,
      exprice : array[i].ex_price,
      quantity : array[i].quantity,
      ordertime : "intraday",
      direction : "SELL"
    }
    console.log(order);
    const x = await sell_handle(order);
    console.log(x);
  }

  username = "np" + "3";
  const udata3 = await op_log.findOne({ username: username});
  array = udata3.log;

  for(i in array){
    const order = {
      username : username,
      stockname : array[i].stockname,
      exprice : array[i].ex_price,
      quantity : randINT(1, array[i].quantity),
      ordertime : "intraday",
      direction : "SELL"
    }
    console.log(order);
    const x = await sell_handle(order);
    console.log(x);
  }
}

const tdata = async () => {
  const usern = randINT(1,3);
  const stockn = randINT(0, 15);
  const quqn = randINT(1,10);
  const dirn = randINT(1,2);
  const odtn = randINT(1,2);
  
  var array = [ "ADANIENT", "ADANIPORTS", "APOLLOHOSP", "ASIANPAINT", "AXISBANK", "BAJAJ_AUTO", "BAJAJFINSV",
                "BAJFINANCE", "BHARTIARTL", "BPCL", "BRITANNIA", "CIPLA", "COALINDIA", "DIVISLAB", "DRREDDY",
                "EICHERMOT", "GRASIM", "HCLTECH", "HDFCBANK", "HDFCLIFE", "HEROMOTOCO", "HINDALCO", "HINDUNILVR",
                "ICICIBANK", "INDUSINDBK", "INFY", "ITC", "JSWSTEEL", "KOTAKBANK", "LT", "LTIM", "MARUTI", "M_M",
                "NESTLEIND", "NTPC", "ONGC", "POWERGRID", "RELIANCE", "SBILIFE", "SBIN", "SUNPHARMA", "TATACONSUM",
                "TATAMOTORS", "TATASTEEL", "TCS", "TECHM", "TITAN", "ULTRACEMCO", "UPL", "WIPRO"];
  
  const pp = await fetch123(array[stockn]);
  const stockname = array[stockn];
  const order = {
    stockname : stockname,
    username : "np" + usern,
    ex_price : pp,
    quantity : quqn,
    direction : "BUY",
    ordertime : "delivery"
  }
  console.log(stockname);
  console.log("np" + usern);
  const x = await buy_handle(order);
  console.log(x);
}

async function abc(){
  var array = [ "ADANIENT", "ADANIPORTS", "APOLLOHOSP", "ASIANPAINT", "AXISBANK", "BAJAJ_AUTO", "BAJAJFINSV",
                "BAJFINANCE", "BHARTIARTL", "BPCL", "BRITANNIA", "CIPLA", "COALINDIA", "DIVISLAB", "DRREDDY",
                "EICHERMOT", "GRASIM", "HCLTECH", "HDFCBANK", "HDFCLIFE", "HEROMOTOCO", "HINDALCO", "HINDUNILVR",
                "ICICIBANK", "INDUSINDBK", "INFY", "ITC", "JSWSTEEL", "KOTAKBANK", "LT", "LTIM", "MARUTI", "M_M",
                "NESTLEIND", "NTPC", "ONGC", "POWERGRID", "RELIANCE", "SBILIFE", "SBIN", "SUNPHARMA", "TATACONSUM",
                "TATAMOTORS", "TATASTEEL", "TCS", "TECHM", "TITAN", "ULTRACEMCO", "UPL", "WIPRO"];
  
                for( i in array){
                  limitexe(array[i]);
                }
}

async function xyz(){
  var array = [ "ADANIENT", "ADANIPORTS", "APOLLOHOSP", "ASIANPAINT", "AXISBANK", "BAJAJ_AUTO", "BAJAJFINSV",
                "BAJFINANCE", "BHARTIARTL", "BPCL", "BRITANNIA", "CIPLA", "COALINDIA", "DIVISLAB", "DRREDDY",
                "EICHERMOT", "GRASIM", "HCLTECH", "HDFCBANK", "HDFCLIFE", "HEROMOTOCO", "HINDALCO", "HINDUNILVR",
                "ICICIBANK", "INDUSINDBK", "INFY", "ITC", "JSWSTEEL", "KOTAKBANK", "LT", "LTIM", "MARUTI", "M_M",
                "NESTLEIND", "NTPC", "ONGC", "POWERGRID", "RELIANCE", "SBILIFE", "SBIN", "SUNPHARMA", "TATACONSUM",
                "TATAMOTORS", "TATASTEEL", "TCS", "TECHM", "TITAN", "ULTRACEMCO", "UPL", "WIPRO"];
  
                for( i in array){
                  var newentry = new limit({
                    stockname : array[i],
                    log : []
                  });
                  console.log(newentry);
                  newentry.save();
                }
}

// Call the async function
async function rtg(){

  const x = await td_log.aggregate([
    {
        $match: {
            "username": "np1",
            "delivery": {
                $elemMatch: {
                    "stockname": "DRREDDY",
                }
            }
        }
        },
        { $unwind: "$delivery" },
        { $match: {
            "delivery.stockname": "DRREDDY"
        }},
        { $replaceRoot: {
            newRoot: "$delivery"
        }}
    ]);
    console.log(x);
}






