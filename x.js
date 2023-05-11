const TradingView = require('@mathieuc/tradingview');

/*
  This example tests fetching chart
  data of a number of candles before
  or after a timestamp
*/

// if (!process.argv[2]) throw Error('Please specify your \'sessionid\' cookie');



var stn = "SBIN";

var arr = ["RELIANCE"];

for (i in arr)
{
  const client = new TradingView.Client
  // ({
  //   token: process.argv[2],
  // });
  
  const chart = new client.Session.Chart();
  chart.setTimezone('Asia/Kolkata');
  var passi = "NSE:" + arr[i];
   
  chart.setMarket(passi, {
    timeframe: '1',
    range: 1,
  });
  
  chart.onSymbolLoaded(() => {
    console.log(chart.infos.name, 'loaded !');
  });
  
  chart.onUpdate(() => {
    console.log('OK', chart.periods);
    client.end();
  });
}