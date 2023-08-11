const TradingView = require('@mathieuc/tradingview');

async function fetch(stn){
    
    // console.log(stn);

    var passi =  "NSE:" + stn;

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
        console.log(chart.infos.name, 'loaded !');
        // console.log('OK', chart.periods);
        // console.log(chart.periods[0].close);
        // let x = call(chart.periods[0].close);
        console.log(chart.periods[0].close);
        client.end();
    });
}

var array = ["SBIN", "TCS", "TEJASNET","RELIANCE","INDUSINDBK"];
array.map(async (e) => {
    await fetch(e);
})
