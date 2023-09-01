const fetch123 = require('./limit_fetch');
const limit = require('../models/limit.js');
const buy_post = require('./buy_post');
const sell_post = require('./sell_post');
const moment = require('moment-timezone');

module.exports = async function limit_execution(stockname){    
    stockname = stockname.toUpperCase();
    var data = await fetch123(stockname);
    const minExPrice = Math.min(data.curr, data.prev);
    const maxExPrice = Math.max(data.curr, data.prev);

    const logTime = moment.tz(this.ordertime, 'Asia/Kolkata');
    const timeString = logTime.format('HH:mm:ss');
    // console.log(timeString);
    var data = await limit.find({
        'stockname': stockname,
        'log.$.time' : { $lte : timeString },
        'log.$.ex_price': { $gte: minExPrice, $lte: maxExPrice }
    });

    await limit.updateMany(
        { stockname : stockname },
        { $pull: { log: { ex_price: { $gte: minExPrice, $lte: maxExPrice }, time: { $lte : timeString } } } }
    );
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
    return;
}