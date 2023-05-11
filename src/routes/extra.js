var express = require('express');
var router = express.Router();
var oplogs = require('../models/open_trades');
var request = require('request-promise');
const TradingView = require('@mathieuc/tradingview');

router.post('/marketorder', function (req, res, next) {

    var stn = req.body.stockname;
    console.log(stn);

    var passi =  "NSE:" + stn;

    const client = new TradingView.Client
    const chart = new client.Session.Chart();
    chart.setTimezone('Asia/Kolkata');

    chart.setMarket(passi, {
        timeframe: '1',
        range: 1,
    });

    chart.onSymbolLoaded(() => {
        console.log(chart.infos.name, 'loaded !');
    });
                
    chart.onUpdate(() => {
        console.log('OK', chart.periods);
        res.send({"success": "ok", "exprice":chart.periods[0].close});
        client.end();
    });
    
});

module.exports = router;