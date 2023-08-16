const fetch123 = require('./limit_fetch');
const limit = require('../models/limit.js');
const buy_post = require('./buy_post');
const sell_post = require('./sell_post');
const moment = require('moment');

module.exports = async function limit_execution(stockname){    
    stockname = stockname.toUpperCase();
    var info = await fetch123(stockname);
    info[1] = parseFloat(info[1]);
    info[2] = parseFloat(info[2]);
    const minExPrice = Math.min(info[1], info[2]);
    const maxExPrice = Math.max(info[1], info[2]);

    const logTime = moment.tz(this.ordertime, 'Asia/Kolkata');
    const timeString = logTime.format('HH:mm:ss');
    console.log(timeString);
    var data = await limit.find({
        'stockname': stockname,
        'log.$.time' : { $lte : timeString },
        'log.$.ex_price': { $gte: minExPrice, $lte: maxExPrice }
    });
    // console.log(data);
    data = data[0].log;
    // console.log(data.log);
    for(i in data){
        const order = {
            username : data[i].username,
            stockname : stockname,
            exprice : data[i].ex_price,
            quantity : data[i].quantity,
            ordertime : data[i].ordertime,
            direction : data[i].direction
        }
        // console.log(order);
        if(order.direction === "BUY"){
            const x = await buy_post(order);
            console.log(x);
        }
        else{
            const x = await sell_post(order);
            console.log(x);
        }
    }

    await limit.updateMany(
        { stockname : stockname },
        { $pull: { log: { ex_price: { $gte: minExPrice, $lte: maxExPrice }, time: { $lte : timeString } } } }
    );
    return;
}