const TradingView = require('@mathieuc/tradingview');
const limitexe = require('./limitexe');
const spp = require('../models/stockprice');
var mongoose = require('mongoose');

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
        await spp.updateOne(
          { stockname: chart.infos.name },
          [{
            $set: {
              previousprice: "$currentprice", // Use a string to reference the field
              currentprice : chart.periods[0].close
            }
          }]
        );
        limitexe(chart.infos.name).then(() => {
          console.log(chart.infos.name + " limit executed");
        });
    });
}

getConnection = async () => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(
      'mongodb+srv://nisargpatel0466:nn__4569@cluster0.lsqbqko.mongodb.net/cyborg0?retryWrites=true&w=majority',
      { useNewUrlParser: true }
    ).then(async () => {
      console.log('Connection to DB Successful');

      var array = [ "ADANIENT", "ADANIPORTS", "APOLLOHOSP", "ASIANPAINT", "AXISBANK", "BAJAJ_AUTO", "BAJAJFINSV",
                "BAJFINANCE", "BHARTIARTL", "BPCL", "BRITANNIA", "CIPLA", "COALINDIA", "DIVISLAB", "DRREDDY",
                "EICHERMOT", "GRASIM", "HCLTECH", "HDFCBANK", "HDFCLIFE", "HEROMOTOCO", "HINDALCO", "HINDUNILVR",
                "ICICIBANK", "INDUSINDBK", "INFY", "ITC", "JSWSTEEL", "KOTAKBANK", "LT", "LTIM", "MARUTI", "M_M",
                "NESTLEIND", "NTPC", "ONGC", "POWERGRID", "RELIANCE", "SBILIFE", "SBIN", "SUNPHARMA", "TATACONSUM",
                "TATAMOTORS", "TATASTEEL", "TCS", "TECHM", "TITAN", "ULTRACEMCO", "UPL", "WIPRO"];

                for (let i in array) {
                  await fetch(array[i]); // Wait for fetch to complete
                  await new Promise(resolve => setTimeout(resolve, 500)); // Wait for the specified delay
                }
    });
  } catch (err) {
    console.error('Connection to DB Failed:', err);
  }
}

getConnection();
