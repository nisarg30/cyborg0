// var router = express.Router();
var express = require('express');
var router = express.Router();
var Users = require('../models/user');
var op_logs = require('../models/open_trades');
var td_logs = require('../models/trade_log');
var request = require('request-promise');
const { parse } = require('path');
const { renderFile } = require('ejs');
const TradingView = require('@mathieuc/tradingview');

// async function fetch(stn){
    
//     // console.log(stn);

//     var passi =  "NSE:" + stn;

//     const client = new TradingView.Client
//     const chart = new client.Session.Chart();
//     chart.setTimezone('Asia/Kolkata');

//     chart.setMarket(passi, {
//         timeframe: '1',
//         range: 1,
//     });

//     chart.onSymbolLoaded(() => {
//         // console.log(chart.infos.name, 'loaded !');
//     });
                
//     chart.onUpdate(() => {
//         console.log(chart.infos.name, 'loaded !');
//         // console.log('OK', chart.periods);
//         // console.log(chart.periods[0].close);
//         let x = call(chart.periods[0].close);
//         // console.log(x);
//         client.end();
//     });
// }

function up(log, day_obj){
    
    log.map(async (e) => {
        var passi =  "NSE:" + e.stockname;
        const client = new TradingView.Client
        const chart = new client.Session.Chart();
        chart.setTimezone('Asia/Kolkata');
    
        chart.setMarket(passi, {
            timeframe: '1',
            range: 1,
        });
    
        chart.onSymbolLoaded(() => {
            // console.log(chart.infos.name, 'loaded !');
        });
                    
        chart.onUpdate(() => {
            // console.log(chart.infos.name, 'loaded !');
            console.log(chart.periods[0].close);
            const x = chart.periods[0].close;
            for (i in day_obj){
                if(day_obj[i].stockname==e.stockname){
                    day_obj[i].sell_price = ((day_obj[i].sell_price * day_obj[i].quantity) + (x * e.quantity))/(e.quantity + day_obj[i].quantity);
                    day_obj[i].quantity += e.quantity ;
                    day_obj[i].realised = (day_obj[i].sell_price - day_obj[i].buy_price) * day_obj[i].quantity;
                }
            }
            client.end();
            console.log(day_obj);
        });
    });
    return day_obj;
}

module.exports = async (req, res) => {


    const odata = await op_logs.find({});

    odata.map(async (e) => {
        const tdata = await td_logs.findOne({username : e.username});
        var intra_trade = tdata.intraday;
        var day_obj;
        var index = 0;
        for (i in intra_trade){
            if(intra_trade[i].date ==  new Date().toLocaleDateString()){
                day_obj = intra_trade[i].logos;
                index = i;
                break;
            }
        }
        const vv = await up(e.log, day_obj);
        console.log(vv);
        intra_trade[index].logos = vv;

        await td_logs.updateOne(
            { "username" : e.username},
            {
                $set : {
                    intraday : intra_trade
                }
            }
        );
    });

    // op_logs.deleteMany({}, async (err,data) => {

    //     if(err){
    //         console.log(err);
    //     }
    //     else{
    //         console.log("deletion successfull");
    //     }
    // })
    res.send({"success" : "deletion"});
}