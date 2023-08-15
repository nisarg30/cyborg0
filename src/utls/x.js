const fs = require('fs').promises;
const path = require('path');
const TradingView = require('@mathieuc/tradingview');
const limitexe = require('./limitexe');

var obj = {
  ADANIENT: 0,
  ADANIPORTS: 1,
  APOLLOHOSP: 2,
  ASIANPAINT: 3,
  AXISBANK: 4,
  BAJAJ_AUTO: 5,
  BAJAJFINSV: 6,
  BAJFINANCE: 7,
  BHARTIARTL: 8,
  BPCL: 9,
  BRITANNIA: 10,
  CIPLA: 11,
  COALINDIA: 12,
  DIVISLAB: 13,
  DRREDDY: 14,
  EICHERMOT: 15,
  GRASIM: 16,
  HCLTECH: 17,
  HDFCBANK: 18,
  HDFCLIFE: 19,
  HEROMOTOCO: 20,
  HINDALCO: 21,
  HINDUNILVR: 22,
  ICICIBANK: 23,
  INDUSINDBK: 24,
  INFY: 25,
  ITC: 26,
  JSWSTEEL: 27,
  KOTAKBANK: 28,
  LT: 29,
  LTIM: 30,
  MARUTI: 31,
  M_M: 32,
  NESTLEIND: 33,
  NTPC: 34,
  ONGC: 35,
  POWERGRID: 36,
  RELIANCE: 37,
  SBILIFE: 38,
  SBIN: 39,
  SUNPHARMA: 40,
  TATACONSUM: 41,
  TATAMOTORS: 42,
  TATASTEEL: 43,
  TCS: 44,
  TECHM: 45,
  TITAN: 46,
  ULTRACEMCO: 47,
  UPL: 48,
  WIPRO: 49
}

async function xyz(stn) {
  const d = limitexe(stn);
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
        // console.log(chart.infos.name);
        // limitexe(chart.infos.name).then(async () => {
        //   console.log("limitexe successfully updated");
        // });
        const x = await write(parseInt(obj[chart.infos.name]) ,chart.periods[0].close);
    });
}

async function write(targetRow, newValue) {

  const filePath = path.resolve(__dirname,'data.csv');
  try {
    var data = await fs.readFile(filePath, 'utf8');
    var rows = data.trim().split('\n'); // Split by lines
    // console.log(data);
    if (targetRow < 0 || targetRow >= rows.length) {
      console.log("Invalid target row:", targetRow);
      return;
    }

    rows[49] = rows[49].substring(0,19);
    const columns = rows[targetRow].split(','); // Split by commas

    if (columns.length < 3) {
      console.log("Invalid CSV format in target row:", targetRow);
      return;
    }

    columns[2] = columns[1];
    columns[1] = newValue;
    rows[targetRow] = columns.join(',');

    const modifiedCsvData = rows.join('\n');

    await fs.writeFile(filePath, modifiedCsvData, 'utf8');
    console.log(`Updated row ${targetRow}: ${columns[0]}, ${columns[1]}, ${columns[2]}`);
  } catch (error) {
    console.error(`Error writing file: ${error.message}`);
  }
}

async function start(){
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
}

start();
