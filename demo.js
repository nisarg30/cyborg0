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
      // for(var i=0; i<=5; i++){
      //   await tdata();
      //   console.log(i);
      // }
      // await xyz();
      await abc();
      // await sdata();
      // await rtg();
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
  // var username = "np" + "1";
  // const udata1 = await Users.findOne({ username: username});
  // var array = udata1.portfolio;

  // for(i in array){
  //   const order = {
  //     username : username,
  //     stockname : array[i].stockname,
  //     exprice : array[i].ex_price,
  //     quantity : array[i].quantity,
  //     ordertime : "",
  //     direction : "SELL"
  //   }
  //   const x = await sell_handle(order);
  //   console.log(x);
  // }

  var username = "np" + "2";
  const udata2 = await Users.findOne({ username: username});
  var array = udata2.portfolio;

  for(i in array){
    const order = {
      username : username,
      stockname : array[i].stockname,
      exprice : array[i].ex_price,
      quantity : array[i].quantity,
      ordertime : "delivery",
      direction : "SELL"
    }

    const x = await sell_handle(order);
    console.log(x);
  }

  // username = "np" + "3";
  // const udata3 = await Users.findOne({ username: username});
  // array = udata3.portfolio;

  // for(i in array){
  //   const order = {
  //     username : username,
  //     stockname : array[i].stockname,
  //     exprice : array[i].ex_price,
  //     quantity : array[i].quantity,
  //     ordertime : "intraday",
  //     direction : "SELL"
  //   }

  //   const x = await sell_handle(order);
  //   console.log(x);
  // }
}

const tdata = async () => {
  const usern = 2;
  const stockn = randINT(0, 49);
  const quqn = randINT(1,20);
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
  // console.log(order);
  // await limit.updateOne(
  //   { stockname: stockname },
  //   { $push: { log: order} }
  // );
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
                  await limitexe(array[i]);
                }
                // await limitexe("NESTLEIND");
}

async function xyz(){
  var array = [ "ADANIENT", "ADANIPORTS", "APOLLOHOSP", "ASIANPAINT", "AXISBANK", "BAJAJ_AUTO", "BAJAJFINSV",
                "BAJFINANCE", "BHARTIARTL", "BPCL", "BRITANNIA", "CIPLA", "COALINDIA", "DIVISLAB", "DRREDDY",
                "EICHERMOT", "GRASIM", "HCLTECH", "HDFCBANK", "HDFCLIFE", "HEROMOTOCO", "HINDALCO", "HINDUNILVR",
                "ICICIBANK", "INDUSINDBK", "INFY", "ITC", "JSWSTEEL", "KOTAKBANK", "LT", "LTIM", "MARUTI", "M_M",
                "NESTLEIND", "NTPC", "ONGC", "POWERGRID", "RELIANCE", "SBILIFE", "SBIN", "SUNPHARMA", "TATACONSUM",
                "TATAMOTORS", "TATASTEEL", "TCS", "TECHM", "TITAN", "ULTRACEMCO", "UPL", "WIPRO"];
  
                for( i in array){
                  // console.log(i);
                  var newentry = new limit({
                    stockname : array[i],
                    log : []
                  });
        
                  newentry.save(function(err, Person){
                    if(err)
                      console.log(err);
                    else
                      console.log('Success entry');
                  });
                }
}

async function rtg() {
  try {
      const updatedUser = await Users.findOneAndUpdate(
          { username: "np1" },
          { $inc: { balance: 10000000 } },
          { new: true } // This option returns the updated document
      );

      if (updatedUser) {
          console.log("User balance updated:", updatedUser);
      } else {
          console.log("User not found.");
      }
  } catch (error) {
      console.error("Error updating user balance:", error);
  }
}

// Call the async function







