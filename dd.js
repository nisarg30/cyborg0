// const express = require('express');
// const TradingView = require('@mathieuc/tradingview');
// const cors = require('cors');
// const app = express();
// const port = 3001;
// const socketIo = require('socket.io');

// app.use(cors());
// const io = socketIo(app);
// // Endpoint to fetch stock data
// app.get('/api/stockData', async (req, res) => {
//   const symbol = req.params.symbol;
//   const market = `NSE:${symbol}`;

//   const client = new TradingView.Client
//   const chart = new client.Session.Chart();
//   chart.setTimezone('Asia/Kolkata');

//   chart.setMarket(market, {
//     timeframe: '1',
//     range: 2000, // Can be positive to get before or negative to get after
//   });
  
//   chart.onUpdate(async () => {
//     console.log(chart.infos.name);
//     const chartData = chart.periods[0];
//     // console.log(chart.periods);
//     io.emit('stockData', { symbol, chartData });
//   });
// });

// io.on('connection', (socket) => {
//   console.log('Client connected');
//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
//   });
// });

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });


// // async function abc(){
// //   const symbol = 'RELIANCE';
// //   const market = `NSE:${symbol}`;

// //   const client = new TradingView.Client
// //   const chart = new client.Session.Chart();
// //   chart.setTimezone('Asia/Kolkata');

// //   chart.setMarket(market, {
// //     timeframe: '1',
// //     range: 1, // Can be positive to get before or negative to get after
// //   });
  
// //   chart.onUpdate(async () => {
// //     console.log(chart.infos.name);
// //     console.log(chart.periods[0]);
// //       // res.send(chart.periods);
// //       // client.end();
// //   });
// // }

// // abc();

const express = require('express');
const TradingView = require('@mathieuc/tradingview');
const cors = require('cors');
const app = express();
const port = 3001;
var mongoose = require('mongoose');
const spp = require('./src/models/stockprice.js');

const http = require('http');
// const socketIO = require('socket.io')
const server = http.createServer(app);
var io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});

app.use(cors());
getConnection = async () => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(
      'mongodb+srv://nisargpatel0466:nn__4569@cluster0.lsqbqko.mongodb.net/cyborg0?retryWrites=true&w=majority',
      { useNewUrlParser: true }
    ).then(async () => {
      console.log('Connection to DB Successful');
    });
  } catch (err) {
    console.error('Connection to DB Failed:', err);
  }
}

getConnection();

io.on('connection', (socket) => {
  console.log('Connection');
  const symbol = socket.handshake.query.stockname;
  const timeframe = socket.handshake.query.timeframe;

  const market = `NSE:${symbol}`;

  const client = new TradingView.Client
  const chart = new client.Session.Chart();
  chart.setTimezone('Asia/Kolkata');
 
  chart.setMarket(market, {
    timeframe: timeframe,
    range: 1,
  });
  
  chart.onUpdate(async () => {
    console.log(chart.periods[0]);
    io.emit('dataUpdate', chart.periods[0]);
  });
});

io.on('disconnecting', () => {
  console.log('disconnecting');
});

// Endpoint to fetch stock data
app.get('/api/stockData/:symbol/:timeframe', async (req, res) => {
  const symbol = req.params.symbol;
  const timeframe = req.params.timeframe;
  const market = `NSE:${symbol}`;

  const client = new TradingView.Client
  const chart = new client.Session.Chart();
  chart.setTimezone('Asia/Kolkata');

  chart.setMarket(market, {
    timeframe: timeframe,
    range: 200,
  });
  
  chart.onUpdate(async () => {
    console.log(chart.infos.name);
    // console.log(chart.periods);
      res.send(chart.periods);
      client.end();
  });
  return;
});

app.get('/data', async (req, res) => {
  console.log('req')
  var array = await spp.find({});
  res.send(array);
})

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

