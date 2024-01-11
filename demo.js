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
const spp = require('./src/models/stockprice.js')
const {buy_handle, sell_handle} = require('./src/control/limit_order');
const TradingView = require('@mathieuc/tradingview');
const path = require('path');
const fs = require('fs').promises;
getConnection = async () => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(
      'mongodb+srv://nisargpatel0466:nn__4569@cluster0.lsqbqko.mongodb.net/cyborg0?retryWrites=true&w=majority',
      { useNewUrlParser: true }
    ).then(async () => {
      console.log('Connection to DB Successful');
      // await xyz();
      // for(var i=0; i<20; i++){
      //   await tdata();
      //   console.log(i);
      // }
      // await abc();
      // await sdata();
      // await abc(); 
      await rtg();
      // var array = [ "ADANIENT", "ADANIPORTS", "APOLLOHOSP", "ASIANPAINT", "AXISBANK", "BAJAJ_AUTO", "BAJAJFINSV",
      //           "BAJFINANCE", "BHARTIARTL", "BPCL", "BRITANNIA", "CIPLA", "COALINDIA", "DIVISLAB", "DRREDDY",
      //           "EICHERMOT", "GRASIM", "HCLTECH", "HDFCBANK", "HDFCLIFE", "HEROMOTOCO", "HINDALCO", "HINDUNILVR",
      //           "ICICIBANK", "INDUSINDBK", "INFY", "ITC", "JSWSTEEL", "KOTAKBANK", "LT", "LTIM", "MARUTI", "M_M",
      //           "NESTLEIND", "NTPC", "ONGC", "POWERGRID", "RELIANCE", "SBILIFE", "SBIN", "SUNPHARMA", "TATACONSUM",
      //           "TATAMOTORS", "TATASTEEL", "TCS", "TECHM", "TITAN", "ULTRACEMCO", "UPL", "WIPRO"];

      //           for (let i in array) {
      //             await rtg(array[i]); // Wait for fetch to complete
      //             await new Promise(resolve => setTimeout(resolve, 500)); // Wait for the specified delay
      //           }
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
  const udata1 = await Users.findOne({ username: username});
  var array = udata1.portfolio;

  for(i in array){
    const order = {
      username : username,
      stockname : array[i].stockname,
      exprice : array[i].buy_price,
      quantity : array[i].quantity,
      ordertime : "delivery",
      direction : "SELL"
    }
    // console.log(order);
    const x = await sell_handle(order);
    console.log(x);
  }

  username = "np" + "2";
  const udata2 = await Users.findOne({ username: username});
  array = udata2.portfolio;

  for(i in array){
    const order = {
      username : username,
      stockname : array[i].stockname,
      exprice : array[i].buy_price,
      quantity : array[i].quantity,
      ordertime : "delivery",
      direction : "SELL"
    }
    // console.log(order);
    const x = await sell_handle(order);
    console.log(x);
  }

  username = "np" + "3";
  const udata3 = await Users.findOne({ username: username});
  array = udata3.portfolio;

  for(i in array){
    const order = {
      username : username,
      stockname : array[i].stockname,
      exprice : array[i].buy_price,
      quantity : array[i].quantity,
      ordertime : "delivery",
      direction : "SELL"
    }
    // console.log(order);
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

                for( i in array){
                  var newentry = new spp({
                    stockname : array[i],
                    currentprice : 0,
                    previousprice : 0,
                  });
                  console.log(newentry);
                  newentry.save();
                }
}

async function fetch(stn){

  var passi =  "NSE:" + stn;
  console.log(passi);
  const client = new TradingView.Client
  const chart = new client.Session.Chart();
  chart.setTimezone('Asia/Kolkata');

  chart.setMarket(passi, {
      timeframe: '1',
      range: 1,
  });
  
  chart.onUpdate(async () => {
    console.log(chart.infos.name);
      console.log(chart.periods);
      // client.end();
  });         
}
// Call the async function
async function rtg(){

  // const filePath = path.resolve(__dirname,'src/utls/EQUITY_L.csv');
  // console.log(filePath)
  // var data = await fs.readFile(filePath, 'utf8');
  // var rows = data.trim().split('\n'); 

  // for(var i=1; i<rows.length; i++) {
  //   const dv= rows[i].split(',');
  //   const stockname = dv[0];
  //   var data= new spp({
  //     stockname : stockname,
  //     previousprice : 0,
  //     currentprice  : 0,
  //   });

  //   data.save(function(err, Person){
  //     if(err)
  //       console.log(err);
  //     else
  //       console.log('Success');
  //   });
  // }
  var array = await spp.find({});

  for (let i in array) {
    await fetch(array[i].stockname); // Wait for fetch to complete
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for the specified delay
  }
  // const client = new TradingView.Client();

  // client.onError((...error) => {
  //   err('Client error', ...error);
  // });

  // const quoteSession = new client.Session.Quote({
  //   fields: 'all',
  // });

  // const BTC = new quoteSession.Market('NSE:CIPLA');

  // BTC.onLoaded(() => {
  //   console.log('BTCEUR LOADED');
  // });

  // const keys = [
  //   'volume', 'update_mode', 'type', 'timezone',
  //   'short_name', 'rtc_time', 'rtc', 'rchp', 'ch',
  //   'rch', 'provider_id', 'pro_name', 'pricescale',
  //   'prev_close_price', 'original_name', 'lp',
  //   'open_price', 'minmove2', 'minmov', 'lp_time',
  //   'low_price', 'is_tradable', 'high_price',
  //   'fractional', 'exchange', 'description',
  //   'current_session', 'currency_code', 'chp',
  //   'currency-logoid', 'base-currency-logoid',
  // ];

  // BTC.onData(async (data) => {
  //   const rsKeys = Object.keys(data);
  //   // success('BTCEUR DATA');
  //   console.log(data);
  //   if (rsKeys.length <= 2) return;

  //   // keys.forEach((k) => {
  //   //   if (!rsKeys.includes(k)) {
  //   //     console.error(`Missing '${k}' key in`, rsKeys);
  //   //   }
  //   // });

  //   quoteSession.delete();
  //   await client.end();
  //   cb();
  // });

  // BTC.onError((...error) => {
  //   console.error('BTCEUR ERROR:', error);
  // });
}





