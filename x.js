const TradingView = require('@mathieuc/tradingview');

/*
  This example tests fetching chart
  data of a number of candles before
  or after a timestamp
*/

// if (!process.argv[2]) throw Error('Please specify your \'sessionid\' cookie');



var stn = "SBIN";

var arr = ["RELIANCE","sbin","tcs"];

arr.map((ele) => {
  ele = "NSE:" + ele;
})
// for (i in arr)
// {
  const client = new TradingView.Client
  // ({
  //   token: process.argv[2],
  // });
  
  const chart = new client.Session.Chart();
  chart.setTimezone('Asia/Kolkata');
  
  chart.setMarket, {
    timeframe: '1',
    range: 1,
  };
  
  chart.onSymbolLoaded(() => {
    console.log(chart.infos.name, 'loaded !');
  });
  
  chart.onUpdate(() => {
    console.log('OK', chart.periods);
    client.end();
  });
// }

// import 'dotenv/config'
// import fetch from 'node-fetch'
// import TradingView from '@mathieuc/tradingview'

// const placeOrder = async (sessionId, payload) => {
//   const response = await fetch('https://papertrading.tradingview.com/trading/place/', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Cookie': `sessionid=${sessionId}`,
//       'Origin': 'https://www.tradingview.com',
//       'Referer': 'https://www.tradingview.com/',
//       'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'
//     },
//     body: JSON.stringify(payload)
//   })
//   if (response.status !== 200) {
//     console.log(await response.text())
//     throw new Error(`Invalid response status: ${response.status}`)
//   }
//   const responseBody = await response.json()
//   return responseBody
// }

// const run = async () => {
//   // register unhandled rejection handler
//   process.on('unhandledRejection', (reason, promise) => {
//     console.error({
//       reason,
//       promise
//     })
//     process.exit(1)
//   })
//   // tradingview login (so quotes aren't delayed)
//   const username = "vasup56789";
//   const password = "nn__4569";
//   const rememberSession = true;
//   const loginResult = await TradingView.loginUser(username, password, rememberSession)
//   // spawn tradingview client
//   const client = new TradingView.Client({
//     token: loginResult.session
//   })
//   console.log(loginResult)
//   // place order
//   await placeOrder(loginResult.session, {"symbol":"NSE:reliance", "side":"buy", "type":"market", "qty":1})
//   // await placeOrder(loginResult.session, {"symbol":"CME_MINI:ES1\u0021", "side":"sell", "type":"market", "qty":1})
// }

// run()